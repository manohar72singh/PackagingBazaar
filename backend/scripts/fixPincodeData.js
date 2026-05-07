import pool from '../config/db.js';
import { getCoordinates } from '../utils/geoUtils.js';

const fixPincodeData = async () => {
    // High-accuracy manual overrides for reported pincodes
    const MANUAL_OVERRIDES = {
        '824219': { latitude: 24.624929, longitude: 84.657127, city: 'Amas', state: 'Bihar' }
    };

    try {
        console.log("🔍 Fetching ALL pincodes from database for full refresh...");
        
        // 1. Get ALL pincodes currently in the pincodes_geo table
        const [allRows] = await pool.query("SELECT pincode FROM pincodes_geo");
        
        const allPincodes = allRows.map(r => r.pincode);

        console.log(`🚀 Found ${allPincodes.length} pincodes in database to verify/refresh.`);


        let successCount = 0;
        let failCount = 0;

        for (const pincode of allPincodes) {
            console.log(`\n🌐 Processing Pincode: ${pincode}`);
            
            let coords;
            if (MANUAL_OVERRIDES[pincode]) {
                console.log(`   📍 Using MANUAL OVERRIDE for ${pincode}`);
                coords = MANUAL_OVERRIDES[pincode];
                // Update DB with manual data
                await pool.query(
                    "INSERT INTO pincodes_geo (pincode, latitude, longitude, city, state) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE latitude=VALUES(latitude), longitude=VALUES(longitude), city=VALUES(city), state=VALUES(state)",
                    [pincode, coords.latitude, coords.longitude, coords.city, coords.state]
                );
            } else {
                // forceRefresh = true ensures we get fresh data from API
                coords = await getCoordinates(pincode, true);
            }
            
            if (coords) {

                console.log(`   ✅ SUCCESS: ${coords.city}, ${coords.state} (${coords.latitude}, ${coords.longitude})`);
                successCount++;
            } else {
                console.log(`   ❌ FAILED to geocode: ${pincode}`);
                failCount++;
            }

            // Respect API rate limits (1 request per second)
            await new Promise(resolve => setTimeout(resolve, 1200));
        }

        console.log(`\n🏁 FINISHED!`);
        console.log(`✅ Corrected: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Fix script failed:", error);
        process.exit(1);
    }
};

fixPincodeData();
