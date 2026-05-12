import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'packaging_bazaar_db'
  });

  try {
    const leadIds = [6, 7, 8];
    const [leads] = await pool.query(`
      SELECT i.id, i.product_id, i.buyer_name, i.quantity_required, i.thickness, i.width, i.pincode, i.city, i.state,
             p.name as product_name, p.sub_category_id, sc.category_id
      FROM inquiries i
      JOIN products p ON i.product_id = p.id
      JOIN sub_categories sc ON p.sub_category_id = sc.id
      WHERE i.id IN (?)
    `, [leadIds]);

    console.log('--- LEAD DETAILS ---');
    console.table(leads);

    // For each lead, we'll check top 3 recommendations
    for (const lead of leads) {
      console.log(`\nAnalyzing Recommendations for Lead ID ${lead.id} (${lead.product_name})...`);
      
      // I'll use a simplified version of the SQL logic to see the scores
      // Note: Coordinates are needed for distance. I'll fetch them from pincodes_geo.
      
      const [leadGeo] = await pool.query("SELECT latitude, longitude FROM pincodes_geo WHERE pincode = ?", [lead.pincode]);
      const bLat = leadGeo[0]?.latitude || 0;
      const bLng = leadGeo[0]?.longitude || 0;

      // This is a truncated version of the actual query used in adminController.js
      const query = `
        SELECT 
          s.company_name, 
          s.city, 
          s.state,
          (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) AS distance_km,
          -- Simplified Location Score
          (CASE 
            WHEN s.pincode = ? THEN 200
            WHEN LOWER(s.city) = LOWER(?) THEN 50
            ELSE 0 
          END) as loc_score,
          -- Simplified Product Score (Checking Thickness/Width match)
          (
            SELECT MAX(
              CASE WHEN sp.stock_qty >= 0 THEN 100 ELSE 0 END +
              CASE WHEN LOWER(sp.width) = LOWER(?) OR LOWER(sp.width) LIKE '%all%' THEN 150 ELSE 0 END
            )
            FROM seller_products sp
            WHERE sp.seller_id = s.id AND sp.status = 'active'
          ) as prod_score
        FROM sellers s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN pincodes_geo pg ON s.pincode = pg.pincode
        WHERE u.role = 'seller' AND u.is_verified = 1
        ORDER BY distance_km ASC
        LIMIT 3
      `;

      const [recs] = await pool.query(query, [bLat, bLng, bLat, lead.pincode, lead.city, lead.width || '']);
      console.table(recs);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
