import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'packaging_bazaar_db'
  });

  try {
    const query = `
      SELECT 
        s.company_name, 
        p.name as product_name, 
        p.thickness, 
        sp.width 
      FROM seller_products sp
      JOIN sellers s ON sp.seller_id = s.id
      JOIN products p ON sp.product_id = p.id
      WHERE 
        LOWER(p.thickness) LIKE '%all%' OR 
        LOWER(sp.width) LIKE '%all%' OR 
        LOWER(p.thickness) LIKE '%any%' OR 
        LOWER(sp.width) LIKE '%any%' OR 
        LOWER(p.thickness) LIKE '%custom%' OR 
        LOWER(sp.width) LIKE '%custom%'
    `;
    const [rows] = await pool.query(query);
    console.log('--- SELLERS WITH GENERALIST SPECS (All/Any/Custom) ---');
    if (rows.length === 0) {
      console.log('No such sellers found.');
    } else {
      console.table(rows);
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
