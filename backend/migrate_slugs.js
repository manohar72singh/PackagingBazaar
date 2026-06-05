import pool from './config/db.js';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

async function migrate() {
  try {
    // 1. Add column if it doesn't exist
    try {
      await pool.query('ALTER TABLE products ADD COLUMN slug VARCHAR(255) UNIQUE');
      console.log('Added slug column to products table.');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('Slug column already exists.');
      } else {
        throw e;
      }
    }

    // 2. Fetch all products
    const [products] = await pool.query('SELECT id, name FROM products WHERE slug IS NULL');
    
    // 3. Generate and update slugs
    for (const product of products) {
      let slug = generateSlug(product.name || `product-${product.id}`);
      
      // Ensure unique
      let uniqueSlug = slug;
      let counter = 1;
      let isUnique = false;
      while (!isUnique) {
        try {
          await pool.query('UPDATE products SET slug = ? WHERE id = ?', [uniqueSlug, product.id]);
          isUnique = true;
        } catch (e) {
          if (e.code === 'ER_DUP_ENTRY') {
            uniqueSlug = `${slug}-${counter}`;
            counter++;
          } else {
            throw e;
          }
        }
      }
      console.log(`Updated product ${product.id} with slug: ${uniqueSlug}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
