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
        group_key, 
        COUNT(*) as records_in_group 
      FROM products 
      WHERE LOWER(name) LIKE '%metallized polyester film%' 
      GROUP BY group_key
    `;
    const [rows] = await pool.query(query);
    console.log('--- UNIQUE CARDS FOR SEARCH: METALLIZED POLYESTER FILM ---');
    console.table(rows);
    console.log('TOTAL UNIQUE CARDS (Groups):', rows.length);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
