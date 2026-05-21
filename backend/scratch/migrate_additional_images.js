import pool from "../config/db.js";

async function migrate() {
  try {
    const [columns] = await pool.query("DESCRIBE products");
    console.log("Current columns:", columns.map(c => c.Field));
    
    const hasAdditionalImages = columns.some(c => c.Field === 'additional_images');
    if (!hasAdditionalImages) {
      console.log("Adding additional_images column to products table...");
      await pool.query("ALTER TABLE products ADD COLUMN additional_images TEXT DEFAULT NULL");
      console.log("additional_images column added successfully.");
    } else {
      console.log("additional_images column already exists.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
