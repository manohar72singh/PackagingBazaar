
async function testFetch() {
    const urls = [
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        'https://router.project-osrm.org/route/v1/driving/77.2090,28.6139;72.8777,19.0760?overview=false'
    ];

    for (const url of urls) {
        console.log(`Testing ${url}...`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status} ${res.statusText}`);
        } catch (e) {
            console.error(`FAILED: ${e.message}`);
            if (e.cause) {
                console.error(`CAUSE:`, e.cause);
            }
        }
        console.log('---');
    }
}

testFetch();
