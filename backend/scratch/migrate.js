import pool from "../config/db.js";

async function migrate() {
  try {
    const [columns] = await pool.query("DESCRIBE products");
    console.log("Current columns:", columns.map(c => c.Field));
    
    const hasPdfUrl = columns.some(c => c.Field === 'pdf_url');
    if (!hasPdfUrl) {
      console.log("Adding pdf_url column to products table...");
      await pool.query("ALTER TABLE products ADD COLUMN pdf_url VARCHAR(255) DEFAULT NULL");
      console.log("pdf_url column added successfully.");
    } else {
      console.log("pdf_url column already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
