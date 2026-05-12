import pool from "../config/db.js";

// Fetch Categories
// 10. Get Product Groups (for variant grouping)
export const getProductGroups = async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = `
      SELECT pg.*, c.name as category_name, c.code_prefix
      FROM product_groups pg
      JOIN categories c ON pg.category_id = c.id
    `;
    const params = [];

    if (categoryId) {
      query += " WHERE pg.category_id = ?";
      params.push(categoryId);
    }

    query += " ORDER BY pg.name ASC";
    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error in getProductGroups:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getProductVariants = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get group_key and subcategory of current product
    const [rows] = await pool.query(
      "SELECT group_key, product_group_id, sub_category_id FROM products WHERE id = ?", 
      [id]
    );
    const current = rows[0];
    
    if (!current) return res.status(404).json({ success: false, message: "Product not found" });

    let variants = [];
    
    // Priority 1: If product belongs to a group (via group_key or product_group_id)
    if (current.group_key || current.product_group_id) {
      [variants] = await pool.query(
        `SELECT p.id as id, 
                MAX(p.name) as name, 
                MAX(p.thickness) as thickness, 
                MAX(p.width) as width, 
                MAX(p.image_url) as image_url, 
                MAX(p.color) as color, 
                MAX(p.product_type) as product_type,
                COALESCE(MIN(sp.price_min), MAX(p.min_price)) as min_price,
                COALESCE(MAX(sp.price_max), MAX(p.max_price)) as max_price,
                COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock_qty,
                MAX(s.company_name) as seller_name,
                MAX(s.seller_uid) as seller_uid
         FROM products p
         LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
         LEFT JOIN product_stocks ps ON p.id = ps.product_id
         LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
         WHERE (p.group_key = ? OR (p.product_group_id IS NOT NULL AND p.product_group_id = ?)) AND p.id != ?
         GROUP BY p.id
         LIMIT 20`,
        [current.group_key, current.product_group_id, id]
      );
    }
    
    // Priority 2: Fallback to same subcategory if no variants found in group
    if (variants.length === 0 && current.sub_category_id) {
      [variants] = await pool.query(
        `SELECT p.id as id, 
                MAX(p.name) as name, 
                MAX(p.thickness) as thickness, 
                MAX(p.width) as width, 
                MAX(p.image_url) as image_url, 
                MAX(p.color) as color, 
                MAX(p.product_type) as product_type,
                COALESCE(MIN(sp.price_min), MAX(p.min_price)) as min_price,
                COALESCE(MAX(sp.price_max), MAX(p.max_price)) as max_price,
                COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock_qty,
                MAX(s.company_name) as seller_name,
                MAX(s.seller_uid) as seller_uid
         FROM products p
         LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
         LEFT JOIN product_stocks ps ON p.id = ps.product_id
         LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
         WHERE p.sub_category_id = ? AND p.id != ?
         GROUP BY p.id
         LIMIT 10`,
        [current.sub_category_id, id]
      );
    }

    res.status(200).json({
      success: true,
      variants
    });
  } catch (error) {
    console.error("Error in getProductVariants:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 11. Create Product Group (Admin)
export const createProductGroup = async (req, res) => {
  try {
    const { name, categoryId, description } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ success: false, message: "Name and Category are required" });
    }

    // 1. Get category prefix
    const [catRows] = await pool.query("SELECT code_prefix FROM categories WHERE id = ?", [categoryId]);
    if (catRows.length === 0) return res.status(404).json({ success: false, message: "Category not found" });
    const prefix = catRows[0].code_prefix || "GRP";

    // 2. Count existing groups for fallback
    const [[{ count }]] = await pool.query("SELECT COUNT(*) as count FROM product_groups WHERE category_id = ?", [categoryId]);
    const finalMasterId = req.body.masterId || `GP-${prefix}-${count + 1}`;

    const [result] = await pool.query(
      "INSERT INTO product_groups (category_id, master_id, name, description) VALUES (?, ?, ?, ?)",
      [categoryId, finalMasterId, name, description]
    );

    res.status(201).json({
      success: true,
      message: "Product Group created!",
      groupId: result.insertId,
      masterId: finalMasterId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
       return res.status(400).json({ success: false, message: "A group with this name or ID already exists" });
    }
    console.error("Error creating product group:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.name, COUNT(p.id) as variants 
      FROM categories c 
      LEFT JOIN sub_categories sc ON c.id = sc.category_id 
      LEFT JOIN products p ON sc.id = p.sub_category_id 
      GROUP BY c.id 
      ORDER BY c.name ASC
    `;
    const [rows] = await pool.query(query);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error in getCategories: ", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Fetch SubCategories (Optionally filtered by category)
export const getSubCategories = async (req, res) => {
  const { categoryId } = req.query;
  try {
    let query = "SELECT id, category_id, name FROM sub_categories";
    const params = [];
    if (categoryId) {
      query += " WHERE category_id = ?";
      params.push(categoryId);
    }
    query += " ORDER BY name ASC";
    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Fetch Tags
export const getTags = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, tag_name FROM tags ORDER BY tag_name ASC");
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Fetch Applications
export const getApplications = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, app_name FROM applications ORDER BY app_name ASC");
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 1. Get All Products (With Filters & Pagination) - Grouped by Product Group
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      category = "All",
      sort = "default",
      search = "",
      tag = "",
      city = "",
    } = req.query;

    const offset = (page - 1) * limit;
    const queryParams = [];

    // Base WHERE clause
    let whereClause = " WHERE 1=1";

    if (category !== "All") {
      whereClause += ` AND c.name = ?`;
      queryParams.push(category);
    }

    if (search) {
      whereClause += ` AND (p.name LIKE ? OR s.company_name LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Tag Filter logic
    if (tag && tag.toLowerCase() !== "none") {
      whereClause += ` AND t.tag_name = ?`;
      queryParams.push(tag.toLowerCase());
    }

    if (city && city.toLowerCase() !== "all") {
      whereClause += ` AND s.city = ?`;
      queryParams.push(city);
    }

    // Main Data Query
    let dataQuery = `
      SELECT 
        SUBSTRING_INDEX(GROUP_CONCAT(p.id ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as id,
        MAX(p.name) as name,
        MAX(p.display_name) as display_name,
        SUBSTRING_INDEX(GROUP_CONCAT(p.description ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as description,
        SUBSTRING_INDEX(GROUP_CONCAT(p.image_url ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as image_url,
        SUBSTRING_INDEX(GROUP_CONCAT(p.thickness ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as thickness,
        SUBSTRING_INDEX(GROUP_CONCAT(p.width ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as width,
        SUBSTRING_INDEX(GROUP_CONCAT(p.unit ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as unit,
        SUBSTRING_INDEX(GROUP_CONCAT(p.color ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as color,
        SUBSTRING_INDEX(GROUP_CONCAT(p.product_type ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as product_type,
        MAX(p.group_key) as group_key,
        MAX(p.is_trending) as is_trending,
        MAX(p.is_hot_deal) as is_hot_deal,
        MAX(s.is_verified) as is_verified,
        MAX(t.tag_name) as tag_name, 
        MAX(sc.name) as subcategory_name, 
        MAX(c.name) as category_name,
        COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
        COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
        COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock, 
        COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
        (SELECT AVG(rating) FROM product_reviews WHERE product_id = SUBSTRING_INDEX(GROUP_CONCAT(p.id ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) AND status = 'approved') as avg_rating,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = SUBSTRING_INDEX(GROUP_CONCAT(p.id ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) AND status = 'approved') as review_count,
        SUBSTRING_INDEX(GROUP_CONCAT(s.company_name ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as seller_name, 
        SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as seller_uid,
        SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY COALESCE(sp.price_min, p.min_price) ASC SEPARATOR '||'), '||', 1) as seller_id,
        MAX(s.city) as city, 
        MAX(s.state) as state,
        COUNT(DISTINCT s.id) as seller_count,
        COUNT(DISTINCT p.id) as variant_count
      FROM products p
      LEFT JOIN tags t ON p.tag_id = t.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
      ${whereClause}
      GROUP BY COALESCE(p.group_key, CAST(p.id AS CHAR))
    `;

    // Sorting
    if (sort === "price_low") dataQuery += ` ORDER BY min_price ASC`;
    else if (sort === "price_high") dataQuery += ` ORDER BY min_price DESC`;
    else if (sort === "highest_rated") dataQuery += ` ORDER BY avg_rating DESC`;
    else dataQuery += ` ORDER BY id ASC`;

    // Pagination
    dataQuery += ` LIMIT ? OFFSET ?`;

    // Count Query - Accurate way to count grouped results
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT 1
        FROM products p
        LEFT JOIN tags t ON p.tag_id = t.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        LEFT JOIN categories c ON sc.category_id = c.id
        LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
        LEFT JOIN product_stocks ps ON p.id = ps.product_id
        LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
        ${whereClause}
        GROUP BY COALESCE(p.group_key, CAST(p.id AS CHAR))
      ) as grouped_results
    `;

    // Increase GROUP_CONCAT limit for Base64 images
    const connection = await pool.getConnection();
    try {
      await connection.query("SET SESSION group_concat_max_len = 1000000");

      // Execute queries
      const [rows] = await connection.query(dataQuery, [
        ...queryParams,
        parseInt(limit),
        parseInt(offset),
      ]);
      const [countRows] = await connection.query(countQuery, queryParams);

      const totalProducts = countRows[0].total;

      res.status(200).json({
        success: true,
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page),
        data: rows,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// NEW: Get Products specifically for Seller Page (No group collapsing)
export const getProductsBySellers = async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    
    // Simple query to get all individual products with seller info
    // We group by p.id to ensure every product variant is its own row
    const query = `
      SELECT 
        p.id as id,
        MAX(p.name) as name,
        MAX(p.display_name) as display_name,
        MAX(p.image_url) as image_url,
        MAX(p.group_key) as group_key,
        MAX(s.is_verified) as is_verified,
        COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
        COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
        COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock, 
        COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
        MAX(s.company_name) as seller_name, 
        MAX(s.seller_uid) as seller_uid,
        MAX(s.id) as seller_id,
        MAX(s.city) as city, 
        MAX(s.state) as state
      FROM products p
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
      WHERE s.id IS NOT NULL
      GROUP BY p.id, s.id
      ORDER BY s.id ASC, p.id ASC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, [parseInt(limit)]);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error in getProductsBySellers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Get Single Product by ID (Corrected Export)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const { sellerId } = req.query;

    const query = `
  SELECT p.*, MAX(t.tag_name) as tag_name, MAX(sc.name) as subcategory_name, MAX(c.name) as category_name,
         sc.category_id,
         COALESCE(
           MIN(CASE WHEN ? IS NULL OR s.id = ? THEN sp.price_min ELSE NULL END), 
           MIN(sp.price_min),
           p.min_price, 
           0
         ) as min_price,
         COALESCE(
           MAX(CASE WHEN ? IS NULL OR s.id = ? THEN sp.price_max ELSE NULL END), 
           MAX(sp.price_max),
           p.max_price, 
           0
         ) as max_price,
         COALESCE(
           SUM(CASE WHEN ? IS NULL OR s.id = ? THEN sp.stock_qty ELSE 0 END), 
           MAX(ps.quantity), 
           0
         ) as stock, 
         COALESCE(
           MIN(CASE WHEN ? IS NULL OR s.id = ? THEN sp.moq ELSE NULL END), 
           MIN(ps.min_order), 
           100
         ) as min_order,
         SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY (s.id = ?) DESC, sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_uid, 
         SUBSTRING_INDEX(GROUP_CONCAT(s.company_name ORDER BY (s.id = ?) DESC, sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_name, 
         SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY (s.id = ?) DESC, sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_id,
         MAX(CASE WHEN ? IS NULL OR s.id = ? THEN s.is_verified ELSE 0 END) as is_verified,
         (SELECT AVG(rating) FROM product_reviews WHERE product_id = p.id AND status = 'approved') as avg_rating,
         (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id AND status = 'approved') as review_count,
         MAX(CASE WHEN ? IS NULL OR s.id = ? THEN sp.delivery_hours ELSE NULL END) as delivery_hours,
         COALESCE(GROUP_CONCAT(DISTINCT a.app_name), '') as mapped_applications 
  FROM products p
  LEFT JOIN tags t ON p.tag_id = t.id
  LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
  LEFT JOIN categories c ON sc.category_id = c.id
  LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
  LEFT JOIN product_stocks ps ON p.id = ps.product_id
  LEFT JOIN product_application_mapping pam ON p.id = pam.product_id
  LEFT JOIN applications a ON pam.app_id = a.id
  LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
  WHERE p.id = ?
  GROUP BY p.id
`;

    const [rows] = await pool.query(query, [
      sellerId || null, sellerId || null, 
      sellerId || null, sellerId || null, 
      sellerId || null, sellerId || null, 
      sellerId || null, sellerId || null,
      sellerId || null, sellerId || null, sellerId || null,
      sellerId || null, sellerId || null, 
      sellerId || null, sellerId || null,
      id
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const product = rows[0];

    // Combine applications from JSON column and Mapping table
    let apps = [];
    
    // 1. From JSON column (p.applications)
    if (product.applications) {
      if (Array.isArray(product.applications)) {
        apps = [...product.applications];
      } else if (typeof product.applications === "string") {
        try {
          const parsed = JSON.parse(product.applications);
          if (Array.isArray(parsed)) apps = [...parsed];
          else apps = product.applications.split(",").map(s => s.trim());
        } catch (e) {
          apps = product.applications.split(",").map(s => s.trim());
        }
      }
    }

    // 2. From Mapping table (mapped_applications)
    if (product.mapped_applications) {
      const mapped = product.mapped_applications.split(",").map(s => s.trim());
      apps = [...new Set([...apps, ...mapped])];
    }

    product.applications = apps.filter(a => a && a !== "");

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error in getProductById:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};



// Get Top Selling Products (Sorted by Review Count)
export const getTopSellingProducts = async (req, res) => {
  try {
    // Increase GROUP_CONCAT limit for Base64 images
    const connection = await pool.getConnection();
    try {
      await connection.query("SET SESSION group_concat_max_len = 1000000");

      const query = `
        SELECT MAX(p.id) as id, MAX(p.name) as name, MAX(p.description) as description, MAX(p.image_url) as image_url, MAX(p.unit) as unit,
               MAX(t.tag_name) as tag_name, MAX(c.name) as category_name, 
               SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_uid, 
               SUBSTRING_INDEX(GROUP_CONCAT(s.company_name ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_name, 
               SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_id,
               COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
               COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
               COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock, 
               COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
               (SELECT AVG(rating) FROM product_reviews WHERE product_id = MAX(p.id) AND status = 'approved') as avg_rating,
               (SELECT COUNT(*) FROM product_reviews WHERE product_id = MAX(p.id) AND status = 'approved') as review_count,
               COUNT(DISTINCT s.id) as seller_count
        FROM products p
        LEFT JOIN tags t ON p.tag_id = t.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        LEFT JOIN categories c ON sc.category_id = c.id
        LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
        LEFT JOIN product_stocks ps ON p.id = ps.product_id
        LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
        GROUP BY p.id
        ORDER BY review_count DESC
        LIMIT 8
      `;
      const [rows] = await connection.query(query);
      res.status(200).json({ success: true, data: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in getTopSellingProducts:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// NEW: Unique Top Selling — same product from multiple sellers shows only once
export const getUniqueTopSelling = async (req, res) => {
  try {
    // Increase GROUP_CONCAT limit for Base64 images
    const connection = await pool.getConnection();
    try {
      await connection.query("SET SESSION group_concat_max_len = 1000000");

      const query = `
        SELECT
          p.name,
          -- Pick ALL fields from the same product (lowest id) to avoid mismatch
          SUBSTRING_INDEX(GROUP_CONCAT(p.id ORDER BY p.id ASC SEPARATOR '||'), '||', 1) as id,
          SUBSTRING_INDEX(GROUP_CONCAT(p.image_url ORDER BY p.id ASC SEPARATOR '||'), '||', 1) as image_url,
          SUBSTRING_INDEX(GROUP_CONCAT(p.description ORDER BY p.id ASC SEPARATOR '||'), '||', 1) as description,
          SUBSTRING_INDEX(GROUP_CONCAT(p.unit ORDER BY p.id ASC SEPARATOR '||'), '||', 1) as unit,
          SUBSTRING_INDEX(GROUP_CONCAT(t.tag_name ORDER BY p.id ASC SEPARATOR '||'), '||', 1) as tag_name,
          MAX(c.name) as category_name,
          SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_uid,
          SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_id,
          COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
          COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
          COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock,
          COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
          (SELECT AVG(pr.rating) FROM product_reviews pr
            INNER JOIN products pp ON pr.product_id = pp.id
            WHERE pp.name = p.name AND pr.status = 'approved') as avg_rating,
          (SELECT COUNT(*) FROM product_reviews pr
            INNER JOIN products pp ON pr.product_id = pp.id
            WHERE pp.name = p.name AND pr.status = 'approved') as review_count,
          COUNT(DISTINCT s.id) as seller_count
        FROM products p
        LEFT JOIN tags t ON p.tag_id = t.id
        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
        LEFT JOIN categories c ON sc.category_id = c.id
        LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
        LEFT JOIN product_stocks ps ON p.id = ps.product_id
        LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
        GROUP BY p.name
        ORDER BY review_count DESC, seller_count DESC
        LIMIT 8
      `;
      const [rows] = await connection.query(query);
      res.status(200).json({ success: true, data: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error in getUniqueTopSelling:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const addProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      category_id, // Added to handle category resolution
      sub_category_id,
      tag_id,
      thickness,
      width,
      minPrice,
      maxPrice,
      unit,
      min_order,
      stock,
      image_url,
      description,
      applications, // Expecting array of app_names or app_ids
    } = req.body;

    const userId = req.user.id;
    const role = req.user.role;

    let seller_id = null;
    if (role !== "admin") {
      const [sellerRows] = await connection.query("SELECT id FROM sellers WHERE user_id = ?", [userId]);
      if (sellerRows.length === 0) return res.status(404).json({ success: false, message: "Seller profile not found." });
      seller_id = sellerRows[0].id;
    }

    // Helper: Dynamic Master Data Resolution
    const resolveId = async (table, nameField, value, parentField = null, parentValue = null) => {
      if (!value) return null;
      if (!isNaN(value)) return value; // If purely numeric, assume it's an ID

      // If string, search by name
      let sql = `SELECT id FROM ${table} WHERE ${nameField} = ?`;
      let params = [value];
      if (parentField && parentValue) {
        sql += ` AND ${parentField} = ?`;
        params.push(parentValue);
      }

      const [rows] = await connection.query(sql, params);
      if (rows.length > 0) return rows[0].id;

      // Create new record if not found
      const insertSql = parentField 
        ? `INSERT INTO ${table} (${nameField}, ${parentField}) VALUES (?, ?)` 
        : `INSERT INTO ${table} (${nameField}) VALUES (?)`;
      const insertParams = parentField ? [value, parentValue] : [value];
      
      const [result] = await connection.query(insertSql, insertParams);
      return result.insertId;
    };

    // Resolve Category, SubCategory, Tag
    const resolvedCategoryId = await resolveId('categories', 'name', category_id);
    const resolvedSubCategoryId = await resolveId('sub_categories', 'name', sub_category_id, 'category_id', resolvedCategoryId);
    const resolvedTagId = await resolveId('tags', 'tag_name', tag_id);

    // Resolve Product Group (Variant Linking)
    let resolvedGroupId = null;
    const { groupKey, newGroupName, newGroupId } = req.body;
    
    if (groupKey === "NEW_GROUP") {
      const finalMasterId = newGroupId || `GP-${Date.now()}`;
      const [grpRes] = await connection.query(
        "INSERT INTO product_groups (category_id, master_id, name) VALUES (?, ?, ?)",
        [resolvedCategoryId, finalMasterId, newGroupName]
      );
      resolvedGroupId = grpRes.insertId;
    } else if (groupKey) {
       const [grpRows] = await connection.query("SELECT id FROM product_groups WHERE master_id = ?", [groupKey]);
       if (grpRows.length > 0) resolvedGroupId = grpRows[0].id;
    }

    // 1. Insert into products
    const [productResult] = await connection.query(
      `INSERT INTO products 
      (name, sub_category_id, tag_id, seller_id, product_group_id, group_key, product_code, thickness, width, product_type, color, min_price, max_price, unit, description, image_url, delivery_time) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, resolvedSubCategoryId, resolvedTagId, seller_id, resolvedGroupId, groupKey === "NEW_GROUP" ? (newGroupId || `GP-${Date.now()}`) : groupKey, req.body.productCode, thickness, width, req.body.productType, req.body.color, minPrice, maxPrice, unit, description, image_url, req.body.deliveryTime],
    );

    const productId = productResult.insertId;

    // 2. Insert into product_stocks
    await connection.query(
      `INSERT INTO product_stocks (product_id, quantity, min_order) VALUES (?, ?, ?)`,
      [productId, stock, min_order],
    );

    // 3. Resolve and Insert Applications
    if (applications && applications.length > 0) {
      const appIds = [];
      for (const app of applications) {
         const id = await resolveId('applications', 'app_name', app);
         if (id) appIds.push(id);
      }

      if (appIds.length > 0) {
        const mappingValues = appIds.map(aid => [productId, aid]);
        await connection.query("INSERT INTO product_application_mapping (product_id, app_id) VALUES ?", [mappingValues]);
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, message: "Product added successfully!", productId });
  } catch (error) {
    await connection.rollback();
    console.error("Error in addProduct:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 5. Update Product (Seller/Admin Only)
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    display_name,
    sub_category_id,
    product_group_id,
    tag_id,
    product_code,
    thickness,
    color,
    productType, // from frontend form
    minPrice,
    maxPrice,
    width,
    unit,
    description,
    image_url,
    deliveryTime, // from frontend form
    stock,
    minOrder,
    applications, // Array of app names or IDs
    is_hot_deal,
    is_trending,
  } = req.body;

  const userId = req.user.id;
  const role = req.user.role;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Check ownership
    const [productRows] = await connection.query(
      "SELECT seller_id FROM products WHERE id = ?",
      [id]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (role !== "admin") {
      const [sellerRows] = await connection.query("SELECT id FROM sellers WHERE user_id = ?", [userId]);
      if (sellerRows.length === 0 || productRows[0].seller_id !== sellerRows[0].id) {
        await connection.rollback();
        return res.status(403).json({ success: false, message: "Unauthorized to edit this product" });
      }
    }

    // 2. Update products table
    const updateProductSql = `
      UPDATE products SET 
        name = ?, 
        display_name = ?, 
        sub_category_id = ?, 
        product_group_id = ?, 
        tag_id = ?, 
        product_code = ?, 
        thickness = ?, 
        color = ?, 
        product_type = ?, 
        min_price = ?, 
        max_price = ?, 
        width = ?, 
        unit = ?, 
        description = ?, 
        image_url = ?, 
        delivery_time = ?,
        is_hot_deal = ?,
        is_trending = ?
      WHERE id = ?
    `;
    
    await connection.query(updateProductSql, [
      name, display_name, sub_category_id, product_group_id, tag_id, product_code,
      thickness, color, productType, minPrice, maxPrice, width, unit,
      description, image_url, deliveryTime, is_hot_deal ? 1 : 0, is_trending ? 1 : 0, id
    ]);

    // 3. Update product_stocks table
    if (stock !== undefined || minOrder !== undefined) {
      await connection.query(
        "UPDATE product_stocks SET quantity = COALESCE(?, quantity), min_order = COALESCE(?, min_order) WHERE product_id = ?",
        [stock, minOrder, id]
      );
    }

    // 4. Update Applications Mapping
    if (applications) {
      // Remove old mappings
      await connection.query("DELETE FROM product_application_mapping WHERE product_id = ?", [id]);
      
      if (applications.length > 0) {
        // Resolve IDs if names are provided (Helper logic similar to addProduct)
        const appIds = [];
        for (const app of applications) {
          if (!isNaN(app)) {
            appIds.push(app);
          } else {
            const [rows] = await connection.query("SELECT id FROM applications WHERE app_name = ?", [app]);
            if (rows.length > 0) {
              appIds.push(rows[0].id);
            } else {
              const [res] = await connection.query("INSERT INTO applications (app_name) VALUES (?)", [app]);
              appIds.push(res.insertId);
            }
          }
        }

        if (appIds.length > 0) {
          const mappingValues = appIds.map(aid => [id, aid]);
          await connection.query("INSERT INTO product_application_mapping (product_id, app_id) VALUES ?", [mappingValues]);
        }
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Product updated successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error in updateProduct:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 6. Delete Product (Seller/Admin Only)
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch product to check ownership
    const [productRows] = await connection.query(
      "SELECT seller_id FROM products WHERE id = ?",
      [id]
    );

    if (productRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    const product = productRows[0];

    // 2. Authorization check
    if (role !== "admin") {
      const [sellerRows] = await connection.query("SELECT id FROM sellers WHERE user_id = ?", [userId]);
      if (sellerRows.length === 0 || product.seller_id !== sellerRows[0].id) {
        await connection.rollback();
        return res.status(403).json({ message: "You can only delete your own products" });
      }
    }

    // 3. Delete from dependent tables (Foreign Key Constraints)
    // Delete from product_stocks
    await connection.query("DELETE FROM product_stocks WHERE product_id = ?", [id]);
    
    // Delete from seller_products
    await connection.query("DELETE FROM seller_products WHERE product_id = ?", [id]);
    
    // Delete from product_application_mapping
    await connection.query("DELETE FROM product_application_mapping WHERE product_id = ?", [id]);
    
    // Delete from product_reviews
    await connection.query("DELETE FROM product_reviews WHERE product_id = ?", [id]);

    // 4. Finally delete the product
    await connection.query("DELETE FROM products WHERE id = ?", [id]);

    await connection.commit();
    res.json({ success: true, message: "Product and related data deleted successfully!" });
  } catch (error) {
    await connection.rollback();
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  } finally {
    connection.release();
  }
};

////////////////

// 7. Get Hot Deals (Featured Products)
export const getHotDeals = async (req, res) => {
  try {
    const query = `
      SELECT MAX(p.id) as id, MAX(p.name) as name, MAX(p.description) as description, MAX(p.image_url) as image_url, MAX(p.unit) as unit,
             MAX(t.tag_name) as tag_name, MAX(c.name) as category_name, 
             SUBSTRING_INDEX(GROUP_CONCAT(s.company_name ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_name, 
             SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_uid,
             SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_id,
             COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
             COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
             COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock, 
             COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
             COUNT(DISTINCT s.id) as seller_count,
             1 as variant_count
      FROM products p
      LEFT JOIN tags t ON p.tag_id = t.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
      WHERE p.is_hot_deal = 1
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT 12
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error in getHotDeals:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getTrendingProducts = async (req, res) => {
  try {
    const query = `
      SELECT MAX(p.id) as id, MAX(p.name) as name, MAX(p.description) as description, MAX(p.image_url) as image_url, MAX(p.unit) as unit,
             MAX(t.tag_name) as tag_name, MAX(c.name) as category_name, 
             SUBSTRING_INDEX(GROUP_CONCAT(s.company_name ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_name, 
             SUBSTRING_INDEX(GROUP_CONCAT(s.seller_uid ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_uid,
             SUBSTRING_INDEX(GROUP_CONCAT(s.id ORDER BY sp.price_min ASC SEPARATOR '||'), '||', 1) as seller_id,
             COALESCE(MIN(sp.price_min), MIN(p.min_price), 0) as min_price,
             COALESCE(MAX(sp.price_max), MAX(p.max_price), 0) as max_price,
             COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock, 
             COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as min_order,
             COUNT(DISTINCT s.id) as seller_count,
             1 as variant_count
      FROM products p
      LEFT JOIN tags t ON p.tag_id = t.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
      WHERE p.is_trending = 1
      GROUP BY p.id
      ORDER BY p.id DESC
      LIMIT 12
    `;

    const [rows] = await pool.query(query);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error in getTrendingProducts:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 8. Get Unique Product Names for Suggestions
export const getUniqueProductNames = async (req, res) => {
  try {
    const query = `
      SELECT p.name, 
             MAX(p.group_key) as group_key, 
             MAX(p.display_name) as display_name, 
             MAX(p.product_group_id) as product_group_id,
             MAX(sc.category_id) as category_id,
             MAX(p.sub_category_id) as sub_category_id
      FROM products p
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      WHERE p.name IS NOT NULL AND p.name != '' 
      GROUP BY p.name 
      ORDER BY p.name ASC
    `;
    const [rows] = await pool.query(query);
    
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error in getUniqueProductNames:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 9. Get all sellers for a specific product group key (Phase 2)
export const getSellersByGroupKey = async (req, res) => {
  try {
    const { groupKey } = req.params;

    if (!groupKey) {
      return res.status(400).json({ success: false, message: "Group key is required" });
    }

    const query = `
      SELECT 
        MAX(COALESCE(sp.id, p.id)) as id,
        p.id as product_id,
        p.image_url,
        p.thickness,
        COALESCE(MIN(sp.price_min), MAX(p.min_price)) as price_min,
        COALESCE(MAX(sp.price_max), MAX(p.max_price)) as price_max,
        COALESCE(MIN(sp.moq), MIN(ps.min_order), 100) as moq,
        COALESCE(SUM(sp.stock_qty), MAX(ps.quantity), 0) as stock_qty,
        s.id as seller_id,
        MAX(s.company_name) as company_name, 
        MAX(s.seller_uid) as seller_uid,
        MAX(s.city) as city, 
        MAX(s.state) as state, 
        MAX(s.pincode) as pincode,
        MAX(s.is_verified) as is_verified,
        MAX(u.name) as owner_name, 
        MAX(u.mobile) as phone, 
        MAX(u.email) as email,
        MAX(p.display_name) as display_name, 
        MAX(p.name) as master_product_name,
        MAX(sp.delivery_hours) as delivery_hours
      FROM products p
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      JOIN sellers s ON s.id = COALESCE(sp.seller_id, p.seller_id)
      JOIN users u ON s.user_id = u.id
      WHERE p.group_key = ?
      GROUP BY p.id, s.id
      ORDER BY price_min ASC
    `;

    const [sellers] = await pool.query(query, [groupKey]);

    res.status(200).json({
      success: true,
      totalSellers: sellers.length,
      data: sellers
    });
  } catch (error) {
    console.error("Error in getSellersByGroupKey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

