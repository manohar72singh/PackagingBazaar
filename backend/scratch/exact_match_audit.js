import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'packaging_bazaar_db'
  });

  try {
    console.log('--- AUDIT: SEARCHING FOR EXACT MATCHES ---');

    const check = async (label, thickness, width) => {
      console.log(`\n--- ${label} ---`);
      const query = `
        SELECT 
          s.company_name, 
          p.name as product_name, 
          p.thickness, 
          sp.width,
          sp.stock_qty,
          sp.moq
        FROM seller_products sp
        JOIN products p ON sp.product_id = p.id
        JOIN sellers s ON sp.seller_id = s.id
        WHERE 
          (LOWER(p.thickness) LIKE ? OR LOWER(p.thickness) = 'all') AND
          (LOWER(sp.width) LIKE ? OR LOWER(sp.width) = 'all')
      `;
      const [rows] = await pool.query(query, [`%${thickness}%`, `%${width}%`]);
      if (rows.length === 0) {
        console.log('No exact matches found.');
      } else {
        console.table(rows);
      }
    };

    await check('Lead 6 (15 Mic, 800mm)', '15', '800');
    await check('Lead 7 (12 Mic, 1000mm)', '12', '1000');
    await check('Lead 8 (15/18 Mic, 500mm)', '15', '500');

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
