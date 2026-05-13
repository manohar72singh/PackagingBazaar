import pool from '../config/db.js';

/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Get coordinates (Lat/Long) for a given pincode.
 * Synchronizes with OpenStreetMap API and updates local database if coordinates differ.
 * @param {string} pincode - Indian Pincode
 * @param {boolean} syncWithApi - If true, always fetch from API to ensure accuracy and update DB
 * @returns {Promise<{latitude: number, longitude: number, city: string, state: string} | null>}
 */
export const getCoordinates = async (pincode, syncWithApi = false) => {
    if (!pincode) return null;
    
    // Clean pincode (ensure 6 digits)
    const cleanPincode = pincode.toString().trim().substring(0, 6);
    if (cleanPincode.length !== 6) return null;

    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

    try {
        let dbResult = null;
        const [rows] = await pool.query("SELECT * FROM pincodes_geo WHERE pincode = ?", [cleanPincode]);
        if (rows.length > 0) {
            dbResult = {
                latitude: parseFloat(rows[0].latitude),
                longitude: parseFloat(rows[0].longitude),
                city: rows[0].city,
                state: rows[0].state
            };
        }

        // If we have DB result and don't need to sync, return immediately (Performance)
        if (dbResult && !syncWithApi) {
            return dbResult;
        }

        let apiResult = null;

        // 1. Try Google Maps Geocoding (Best Accuracy)
        if (GOOGLE_KEY) {
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanPincode},+India&key=${GOOGLE_KEY}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.status === 'OK' && data.results.length > 0) {
                    const loc = data.results[0].geometry.location;
                    const addressParts = data.results[0].address_components;
                    
                    const cityComp = addressParts.find(c => c.types.includes('locality')) || 
                                   addressParts.find(c => c.types.includes('administrative_area_level_2'));
                    const stateComp = addressParts.find(c => c.types.includes('administrative_area_level_1'));

                    apiResult = {
                        latitude: parseFloat(loc.lat),
                        longitude: parseFloat(loc.lng),
                        city: cityComp ? cityComp.long_name : '',
                        state: stateComp ? stateComp.long_name : ''
                    };
                } else if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED' || data.status === 'BILLING_NOT_ENABLED') {
                    console.error(`⚠️ Google Geocoding API Error: ${data.status} - ${data.error_message || ''}`);
                }
            } catch (e) {
                console.error("Google Geocoding network failed, trying OpenStreetMap...", e.message);
            }
        }

        // 2. Fallback to OpenStreetMap Nominatim API if Google failed or not provided
        if (!apiResult) {
            try {
                const url = `https://nominatim.openstreetmap.org/search?q=${cleanPincode}+India&format=json&limit=1`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': `PackagingBazaar-App/1.1 (contact: ${process.env.EMAIL_USER || 'admin@packagingbazaar.co.in'})`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        apiResult = {
                            latitude: parseFloat(data[0].lat),
                            longitude: parseFloat(data[0].lon),
                            city: data[0].display_name.split(',')[0],
                            state: data[0].display_name.split(',').slice(-3, -2)[0]?.trim() || ''
                        };
                    }
                }
            } catch (e) {
                console.error("OpenStreetMap API failed:", e.message);
            }
        }

        if (apiResult) {
            // Check if DB needs update (different coords or missing)
            const needsUpdate = !dbResult || 
                Math.abs(dbResult.latitude - apiResult.latitude) > 0.0001 || 
                Math.abs(dbResult.longitude - apiResult.longitude) > 0.0001;

            if (needsUpdate) {
                console.log(`♻️ Updating DB for ${cleanPincode} with fresh API coordinates.`);
                await pool.query(
                    "INSERT INTO pincodes_geo (pincode, latitude, longitude, city, state) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude=VALUES(latitude), longitude=VALUES(longitude), city=VALUES(city), state=VALUES(state)",
                    [cleanPincode, apiResult.latitude, apiResult.longitude, apiResult.city, apiResult.state]
                );
            }
            return apiResult;
        }

        // Final Fallback: If API has no results, use DB if available
        if (dbResult) {
            return dbResult;
        }

        return null;
    } catch (error) {
        console.error(`❌ Global Error in getCoordinates for ${pincode}:`, error.message);
        return null;
    }
};

/**
 * Helper to fetch with a specific timeout
 */
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

/**
 * Get road distance and travel time between two points.
 */
export const getRoadMetrics = async (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const MAPBOX_KEY = process.env.MAPBOX_TOKEN;

    // 1. Try Google Maps (Best Accuracy & Traffic)
    if (GOOGLE_KEY) {
        try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${GOOGLE_KEY}`;
            const response = await fetchWithTimeout(url, {}, 10000); // 10s timeout
            const data = await response.json();
            
            if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
                const element = data.rows[0].elements[0];
                return {
                    road_distance_km: (element.distance.value / 1000).toFixed(1),
                    duration_min: Math.round(element.duration.value / 60)
                };
            } else {
                // If billing is disabled, it will return REQUEST_DENIED or similar
                if (data.status !== 'OK') {
                    console.log(`⚠️ Google Maps API returned error: ${data.status} ${data.error_message || ''}`);
                }
            }
        } catch (e) { 
            console.log(`⚠️ Google Maps API Failed: ${e.message}`, e.cause ? `(Cause: ${e.cause.message || e.cause})` : ""); 
        }
    }

    // 2. Try Mapbox
    if (MAPBOX_KEY) {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${MAPBOX_KEY}&overview=false`;
            const response = await fetchWithTimeout(url, {}, 10000);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return {
                    road_distance_km: (data.routes[0].distance / 1000).toFixed(1),
                    duration_min: Math.round((data.routes[0].duration / 60) * 1.3)
                };
            }
        } catch (e) { 
            console.log(`⚠️ Mapbox API Failed: ${e.message}`); 
        }
    }

    // 3. Fallback to OSRM (Free)
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const response = await fetchWithTimeout(url, {}, 15000); // 15s timeout for OSRM
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const baseDurationMin = data.routes[0].duration / 60;
            return {
                road_distance_km: (data.routes[0].distance / 1000).toFixed(1),
                duration_min: Math.round(baseDurationMin * 1.4)
            };
        }
    } catch (e) {
        console.log(`⚠️ OSRM API Failed: ${e.message}`, e.cause ? `(Cause: ${e.cause.message || e.cause})` : "");
    }

    return null;
};
