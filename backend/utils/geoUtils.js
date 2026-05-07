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
 * Checks the database first, then falls back to OpenStreetMap API.
 * @param {string} pincode - Indian Pincode
 * @param {boolean} forceRefresh - If true, skip database and fetch fresh from API
 * @returns {Promise<{latitude: number, longitude: number, city: string, state: string} | null>}
 */
export const getCoordinates = async (pincode, forceRefresh = false) => {
    if (!pincode) return null;
    
    // Clean pincode (ensure 6 digits)
    const cleanPincode = pincode.toString().trim().substring(0, 6);
    if (cleanPincode.length !== 6) return null;

    try {
        // 1. Check Database (unless forceRefresh is true)
        if (!forceRefresh) {
            const [rows] = await pool.query("SELECT * FROM pincodes_geo WHERE pincode = ?", [cleanPincode]);
            if (rows.length > 0) {
                return {
                    latitude: parseFloat(rows[0].latitude),
                    longitude: parseFloat(rows[0].longitude),
                    city: rows[0].city,
                    state: rows[0].state
                };
            }
        }

        // 2. Fallback to OpenStreetMap Nominatim API
        console.log(`🌐 Fetching FRESH coordinates for pincode ${cleanPincode} from API...`);
        
        // Using q=pincode+India for better precision than postalcode=
        const url = `https://nominatim.openstreetmap.org/search?q=${cleanPincode}+India&format=json&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': `PackagingBazaar-App/1.1 (contact: ${process.env.EMAIL_USER || 'admin@packagingbazaar.co.in'})`
            }
        });

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const data = await response.json();

        if (data && data.length > 0) {
            const result = {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                city: data[0].display_name.split(',')[0],
                state: data[0].display_name.split(',').slice(-3, -2)[0]?.trim() || ''
            };

            // 3. Cache/Update the result in the database
            await pool.query(
                "INSERT INTO pincodes_geo (pincode, latitude, longitude, city, state) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude=VALUES(latitude), longitude=VALUES(longitude), city=VALUES(city), state=VALUES(state)",
                [cleanPincode, result.latitude, result.longitude, result.city, result.state]
            );

            console.log(`✅ Updated ${cleanPincode}: ${result.latitude}, ${result.longitude}`);
            return result;
        }

        console.log(`⚠️ No results found for pincode ${cleanPincode}`);
        return null;
    } catch (error) {
        console.error(`❌ Error fetching coordinates for ${cleanPincode}:`, error.message);
        return null;
    }
};

/**
 * Get road distance and travel time between two points.
 * Tries Google Maps first, then Mapbox, and finally falls back to OSRM (Free).
 */
export const getRoadMetrics = async (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const MAPBOX_KEY = process.env.MAPBOX_TOKEN;

    try {
        // 1. Try Google Maps (Best Accuracy & Traffic)
        if (GOOGLE_KEY) {
            console.log("📍 Using Google Maps API for road metrics...");
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${GOOGLE_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
                const element = data.rows[0].elements[0];
                return {
                    road_distance_km: (element.distance.value / 1000).toFixed(1),
                    duration_min: Math.round(element.duration.value / 60)
                };
            }
        }

        // 2. Try Mapbox (Great Accuracy, No Traffic)
        if (MAPBOX_KEY) {
            console.log("📍 Using Mapbox API for road metrics...");
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${MAPBOX_KEY}&overview=false`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return {
                    road_distance_km: (data.routes[0].distance / 1000).toFixed(1),
                    duration_min: Math.round((data.routes[0].duration / 60) * 1.3) // 30% Buffer for Mapbox
                };
            }
        }

        // 3. Fallback to OSRM (Free, Base Estimates)
        //console.log("📍 Using OSRM (Free) for road metrics...");
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const baseDurationMin = data.routes[0].duration / 60;
            return {
                road_distance_km: (data.routes[0].distance / 1000).toFixed(1),
                duration_min: Math.round(baseDurationMin * 1.4) // 40% Traffic Factor
            };
        }

        return null;
    } catch (error) {
        console.error("❌ Routing API Error:", error.message);
        return null;
    }
};




