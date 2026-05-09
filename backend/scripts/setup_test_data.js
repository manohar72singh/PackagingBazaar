import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function setupTest() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    console.log("🚀 Setting up test data...");

    // 1. Create 3 Sellers
    const sellerData = [
      { name: "Seller Near", email: "near@test.com", pincode: "201001", city: "Ghaziabad", state: "Uttar Pradesh" },
      { name: "Seller Generalist", email: "generalist@test.com", pincode: "110001", city: "New Delhi", state: "Delhi" },
      { name: "Seller Far", email: "far@test.com", pincode: "400001", city: "Mumbai", state: "Maharashtra" }
    ];

    const sellerIds = [];
    const password = await bcrypt.hash("password123", 10);

    for (const s of sellerData) {
      // Create User
      const [uResult] = await connection.query(
        "INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'seller', 1) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [s.name, s.email, password]
      );
      const userId = uResult.insertId;

      // Create Seller Profile
      const sellerUID = `TEST-S-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const [sResult] = await connection.query(
        `INSERT INTO sellers (user_id, status, seller_uid, company_name, city, state, pincode, is_verified) 
         VALUES (?, 'verified', ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
        [userId, sellerUID, s.name + " Corp", s.city, s.state, s.pincode]
      );
      sellerIds.push(sResult.insertId);
    }

    console.log(`✅ Created/Updated 3 Sellers: ${sellerIds.join(", ")}`);

    // 2. Create Category & SubCategory if missing
    const [catResult] = await connection.query("INSERT IGNORE INTO categories (name, code_prefix) VALUES ('Bopp', 'BOP')");
    const categoryId = 3; // Based on your DB dump earlier

    // 3. Create Products
    // Product 1: Exact Match Specs
    const groupKey = "BOPP_NATURAL_12_TEST";
    const [p1Result] = await connection.query(
      `INSERT INTO products (sub_category_id, name, group_key, thickness, width, color, unit) 
       VALUES (3, 'BOPP Film 12 Mic', ?, '12 Micron', '500mm', 'Natural', 'kg')`,
      [groupKey]
    );
    const prodId1 = p1Result.insertId;

    // Product 2: Generalist Product
    const [p2Result] = await connection.query(
      `INSERT INTO products (sub_category_id, name, group_key, thickness, width, color, unit) 
       VALUES (3, 'BOPP All Sizes', 'BOPP_GENERIC', 'All', 'All', 'All', 'kg')`
    );
    const prodId2 = p2Result.insertId;

    console.log(`✅ Created 2 Products: ${prodId1}, ${prodId2}`);

    // 4. Link Products to Sellers (seller_products)
    // Seller Near -> Exact Match
    await connection.query(
      "INSERT INTO seller_products (product_id, seller_id, price_min, stock_qty, moq, status) VALUES (?, ?, 100, 1000, 100, 'active')",
      [prodId1, sellerIds[0]]
    );

    // Seller Generalist -> All
    await connection.query(
      "INSERT INTO seller_products (product_id, seller_id, price_min, stock_qty, moq, status, width) VALUES (?, ?, 110, 5000, 100, 'active', 'All')",
      [prodId2, sellerIds[1]]
    );

    // Seller Far -> Exact Match
    await connection.query(
      "INSERT INTO seller_products (product_id, seller_id, price_min, stock_qty, moq, status) VALUES (?, ?, 95, 2000, 100, 'active')",
      [prodId1, sellerIds[2]]
    );

    console.log("✅ Linked products to sellers.");

    await connection.commit();
    console.log("✨ Test Setup Complete!");
    process.exit(0);
  } catch (error) {
    await connection.rollback();
    console.error("❌ Setup Failed:", error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

setupTest();
