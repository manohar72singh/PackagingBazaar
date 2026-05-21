import pool from "../config/db.js";
import { validateMobile, validateGST } from "../utils/validation.js";

// Get current logged in seller's profile
export const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT s.*, u.name as ownerName, u.email, u.mobile, u.is_verified, 
      DATE_FORMAT(s.created_at, '%Y-%m-%d') as joinedDate
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      WHERE u.id = ?
    `;

    const [rows] = await pool.query(query, [userId]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Seller profile not found." });
    }

    const seller = rows[0];

    // Format output to match frontend structure expectations
    const frontendSellerInfo = {
      id: seller.id,
      user_id: seller.user_id,
      uid: seller.seller_uid || "PB-S-PENDING",
      businessName: seller.company_name || "",
      businessType: seller.business_type
        ? seller.business_type.split(",").map((s) => s.trim())
        : [],
      gstNumber: seller.gst_number || "",
      yearEstablished: seller.year_established || "",
      ownerName: seller.ownerName || "",
      email: seller.email || "",
      phone: seller.mobile || "", // Mobile from users table
      city: seller.city || "",
      state: seller.state || "",
      address: seller.business_address || "",
      filmTypes: seller.products_offered
        ? seller.products_offered.split(",").map((s) => s.trim())
        : [],
      monthlyCapacity: seller.monthly_capacity || "",
      priceRange: seller.price_range || "",
      description: seller.description || "",
      status: seller.status || "pending",
      joinedDate: seller.joinedDate,
      avatar: seller.company_name
        ? seller.company_name.substring(0, 2).toUpperCase()
        : "SL",
    };

    res.status(200).json({ success: true, data: frontendSellerInfo });
  } catch (error) {
    console.error("Error in getSellerProfile:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get current logged in seller's products
export const getSellerProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // First fetch sellers.id
    const [sellerRows] = await pool.query(
      "SELECT id FROM sellers WHERE user_id = ?",
      [userId],
    );

    if (sellerRows.length === 0) {
      return res
        .status(200)
        .json({ success: true, data: [], totalCount: 0, totalPages: 0 });
    }

    const sellerId = sellerRows[0].id;

    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.thickness, 
        p.width, 
        p.image_url,
        COALESCE(sp.price_min, p.price) as price,
        COALESCE(sp.stock_qty, ps.quantity) as stock,
        COALESCE(sp.moq, ps.min_order) as min_order,
        COALESCE(sp.status, 'active') as status,
        sc.name as subcategory_name, 
        c.name as category_name
      FROM products p
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE p.seller_id = ? OR sp.seller_id = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [sellerId, sellerId, sellerId, limit, offset]);

    // Total count for pagination
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total 
       FROM products p
       LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
       WHERE p.seller_id = ? OR sp.seller_id = ?`,
      [sellerId, sellerId, sellerId]
    );

    res.status(200).json({
      success: true,
      data: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getSellerProducts:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSellerOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get seller_id
    const [sellerRows] = await pool.query(
      "SELECT id FROM sellers WHERE user_id = ?",
      [userId],
    );

    if (sellerRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    const sellerId = sellerRows[0].id;

    // Get total count
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) as total 
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE oi.seller_id = ?`,
      [sellerId]
    );

    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.order_date, 
             u.name as customer_name, u.email as customer_email,
             (SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'name', p.name, 
                  'qty', oi.quantity, 
                  'price', oi.price_at_time,
                  'thickness', oi.thickness,
                  'width', oi.width,
                  'brand', oi.brand,
                  'specific_message', oi.specific_message
                )
              ) 
              FROM order_items oi 
              JOIN products p ON oi.product_id = p.id 
              WHERE oi.order_id = o.id AND oi.seller_id = ?) as items
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.id AND oi.seller_id = ?
      )
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [sellerId, sellerId, limit, offset]);

    res.status(200).json({
      success: true,
      data: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getSellerOrders:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get dashboard stats for seller
export const getSellerStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get seller_id
    const [sellerRows] = await pool.query(
      "SELECT id FROM sellers WHERE user_id = ?",
      [userId]
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    const sellerId = sellerRows[0].id;

    // 1. Total Products
    const [[{ totalProducts }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as totalProducts 
       FROM products p
       LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
       WHERE p.seller_id = ? OR sp.seller_id = ?`,
      [sellerId, sellerId, sellerId]
    );

    // 2. Total Active Products
    const [[{ activeProducts }]] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as activeProducts 
       FROM products p
       LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
       WHERE (p.seller_id = ? OR sp.seller_id = ?) AND (sp.status = 'active' OR sp.status IS NULL)`,
      [sellerId, sellerId, sellerId]
    );

    // 3. Total Orders
    const [[{ totalOrders }]] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) as totalOrders 
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
       WHERE p.seller_id = ? OR sp.seller_id = ?`,
      [sellerId, sellerId, sellerId]
    );

    // 4. Avg Rating
    const [[{ avgRating }]] = await pool.query(
      `SELECT AVG(pr.rating) as avgRating 
       FROM product_reviews pr
       JOIN products p ON pr.product_id = p.id
       LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.seller_id = ?
       WHERE p.seller_id = ? OR sp.seller_id = ?`,
      [sellerId, sellerId, sellerId]
    );

    // 5. Total Leads (Assigned Business Leads)
    const [[{ totalLeads }]] = await pool.query(
      `SELECT COUNT(*) as totalLeads FROM lead_assignments WHERE seller_id = ?`,
      [sellerId]
    );

    // 6. Total Views (Mocked for now as we don't have views table)
    const totalViews = Math.floor(Math.random() * 1000); // Placeholder

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalOrders,
        avgRating: parseFloat(avgRating || 0).toFixed(1),
        totalLeads,
        totalViews
      }
    });
  } catch (error) {
    console.error("Error in getSellerStats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const userId = req.user.id;

    // First get seller_id from user_id
    const [sellerRows] = await pool.query(
      "SELECT id FROM sellers WHERE user_id = ?",
      [userId],
    );

    if (sellerRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    const sellerId = sellerRows[0].id;

    const {
      name,
      display_name,
      category,
      subcategory,
      tag,
      thickness,
      width,
      price,
      unit,
      minOrder,
      stock,
      description,
      applications,
      img,
      color,
      productType,
      deliveryTime,
      groupKey,
      pdf_url,
      additional_images
    } = req.body;

    // Prices: Standardize to min_price and max_price for the listing page
    const minPrice = parseFloat(price);
    const maxPrice = parseFloat(price);

    // Get sub_category_id from subcategory name
    const [subCatRows] = await pool.query(
      `SELECT sc.id FROM sub_categories sc 
       JOIN categories c ON sc.category_id = c.id 
       WHERE sc.name = ? AND c.name = ?`,
      [subcategory, category],
    );

    if (subCatRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category/subcategory combination",
      });
    }

    const subCategoryId = subCatRows[0].id;

    // Get tag_id if tag exists
    let tagId = null;
    if (tag && tag !== "") {
      const [tagRows] = await pool.query(
        "SELECT id FROM tags WHERE tag_name = ?",
        [tag],
      );
      if (tagRows.length > 0) {
        tagId = tagRows[0].id;
      }
    }

    // Resolve Product Group (Variant Linking)
    let resolvedGroupId = null;
    if (groupKey && groupKey !== "NEW_GROUP") {
       const [grpRows] = await pool.query("SELECT id FROM product_groups WHERE master_id = ?", [groupKey]);
       if (grpRows.length > 0) resolvedGroupId = grpRows[0].id;
    }

    // Insert product
    const [productResult] = await pool.query(
      `INSERT INTO products 
       (seller_id, sub_category_id, tag_id, name, display_name, thickness, width, 
        price, min_price, max_price, unit, description, image_url, color, product_type, delivery_time, group_key, product_group_id, pdf_url, additional_images) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId,
        subCategoryId,
        tagId,
        name,
        display_name || name,
        thickness,
        width,
        price,
        minPrice,
        maxPrice,
        unit,
        description,
        img,
        color || null,
        productType || null,
        deliveryTime || null,
        groupKey || null,
        resolvedGroupId,
        pdf_url || null,
        JSON.stringify(additional_images || [])
      ],
    );

    const productId = productResult.insertId;

    // Insert stock information
    await pool.query(
      `INSERT INTO product_stocks (product_id, quantity, min_order) 
       VALUES (?, ?, ?)`,
      [productId, stock, minOrder],
    );

    // Insert applications (always store, even if empty)
    await pool.query("UPDATE products SET applications = ? WHERE id = ?", [
      JSON.stringify(applications || []),
      productId,
    ]);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      productId: productId,
    });
  } catch (error) {
    console.error("Error in createProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Update existing product
export const updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    // Verify product belongs to this seller
    const [checkRows] = await pool.query(
      `SELECT p.id FROM products p
       JOIN sellers s ON p.seller_id = s.id
       WHERE p.id = ? AND s.user_id = ?`,
      [productId, userId],
    );

    if (checkRows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized or product not found",
      });
    }

    const {
      name,
      display_name,
      category,
      subcategory,
      tag,
      thickness,
      width,
      price,
      unit,
      minOrder,
      stock,
      description,
      applications,
      img,
      color,
      productType,
      deliveryTime,
      groupKey,
      pdf_url,
      additional_images
    } = req.body;

    const minPrice = parseFloat(price);
    const maxPrice = parseFloat(price);

    // Get sub_category_id
    const [subCatRows] = await pool.query(
      `SELECT sc.id FROM sub_categories sc 
       JOIN categories c ON sc.category_id = c.id 
       WHERE sc.name = ? AND c.name = ?`,
      [subcategory, category],
    );

    const subCategoryId = subCatRows[0]?.id;

    // Get tag_id
    let tagId = null;
    if (tag && tag !== "") {
      const [tagRows] = await pool.query(
        "SELECT id FROM tags WHERE tag_name = ?",
        [tag],
      );
      tagId = tagRows[0]?.id || null;
    }

    // Resolve Product Group
    let resolvedGroupId = null;
    if (groupKey && groupKey !== "NEW_GROUP") {
       const [grpRows] = await pool.query("SELECT id FROM product_groups WHERE master_id = ?", [groupKey]);
       if (grpRows.length > 0) resolvedGroupId = grpRows[0].id;
    }

    // Update product
    await pool.query(
      `UPDATE products 
       SET sub_category_id = ?, tag_id = ?, name = ?, display_name = ?, thickness = ?, 
           width = ?, price = ?, min_price = ?, max_price = ?, unit = ?, description = ?, image_url = ?,
           color = ?, product_type = ?, delivery_time = ?, group_key = ?, product_group_id = ?, pdf_url = ?, additional_images = ?
       WHERE id = ?`,
      [
        subCategoryId,
        tagId,
        name,
        display_name || name,
        thickness,
        width,
        price,
        minPrice,
        maxPrice,
        unit,
        description,
        img,
        color || null,
        productType || null,
        deliveryTime || null,
        groupKey || null,
        resolvedGroupId,
        pdf_url || null,
        JSON.stringify(additional_images || []),
        productId,
      ],
    );

    // Update stock
    await pool.query(
      `UPDATE product_stocks 
       SET quantity = ?, min_order = ? 
       WHERE product_id = ?`,
      [stock, minOrder, productId],
    );

    // Update applications (always update, even if empty)
    await pool.query("UPDATE products SET applications = ? WHERE id = ?", [
      JSON.stringify(applications || []),
      productId,
    ]);

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// Update seller profile
export const updateSellerProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;

    const {
      businessName,
      businessType,
      gstNumber,
      yearEstablished,
      city,
      state,
      address,
      filmTypes,
      monthlyCapacity,
      priceRange,
      description,
      phone,
      ownerName,
      email, // Added ownerName and email
    } = req.body;

    // Basic Validation
    if (gstNumber && !validateGST(gstNumber)) {
      await connection.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid GST number format (15 characters required).",
        });
    }
    if (phone && !validateMobile(phone)) {
      await connection.rollback();
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid mobile number (10 digits required).",
        });
    }

    // Check duplicate Email
    if (email) {
      const [existingEmail] = await connection.query("SELECT id FROM users WHERE email = ? AND id != ?", [email, userId]);
      if (existingEmail.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "This email is already registered to another account." });
      }
    }

    // Check duplicate Phone
    if (phone) {
      const formattedPhone = String(phone).trim();
      const [existingMobile] = await connection.query("SELECT id FROM users WHERE mobile = ? AND id != ?", [formattedPhone, userId]);
      if (existingMobile.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "This mobile number is already registered to another account." });
      }
    }

    // Check duplicate GST Number
    if (gstNumber) {
      const formattedGST = String(gstNumber).trim();
      const [existingGST] = await connection.query("SELECT id FROM sellers WHERE gst_number = ? AND user_id != ?", [formattedGST, userId]);
      if (existingGST.length > 0) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "This GST number is already registered to another seller." });
      }
    }

    const businessTypeString = Array.isArray(businessType)
      ? businessType.join(", ")
      : businessType;
    const productIdsString =
      filmTypes?.length > 0 ? filmTypes.join(", ") : null;

    // 1. Update SELLERS Table
    await connection.query(
      `UPDATE sellers SET 
       company_name=?, business_type=?, gst_number=?, year_established=?,
       city=?, state=?, business_address=?, monthly_capacity=?, 
       price_range=?, description=?, products_offered=?, mobile=?
       WHERE user_id=?`,
      [
        businessName,
        businessTypeString,
        gstNumber,
        yearEstablished || null,
        city,
        state,
        address,
        monthlyCapacity,
        priceRange,
        description,
        productIdsString,
        phone || null,
        userId,
      ],
    );

    // 2. Update USERS Table (for name, email, mobile)
    const userUpdateFields = [];
    const userUpdateValues = [];

    if (ownerName) {
      userUpdateFields.push("name = ?");
      userUpdateValues.push(ownerName);
    }
    if (email) {
      userUpdateFields.push("email = ?");
      userUpdateValues.push(email);
    }
    if (phone) {
      userUpdateFields.push("mobile = ?");
      userUpdateValues.push(phone);
    }

    if (userUpdateFields.length > 0) {
      userUpdateValues.push(userId);
      await connection.query(
        `UPDATE users SET ${userUpdateFields.join(", ")} WHERE id = ?`,
        userUpdateValues,
      );
    }

    await connection.commit();
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in updateSellerProfile:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      let dupMessage = "This information is already registered to another account.";
      const errStr = String(error.message || "").toLowerCase();
      if (errStr.includes("email")) {
        dupMessage = "This email is already registered to another account.";
      } else if (errStr.includes("mobile") || errStr.includes("phone")) {
        dupMessage = "This mobile number is already registered to another account.";
      } else if (errStr.includes("gst_number")) {
        dupMessage = "This GST number is already registered to another seller.";
      }
      return res.status(400).json({ success: false, message: dupMessage });
    }
    
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verify product belongs to this seller
    const [checkRows] = await connection.query(
      `SELECT p.id FROM products p
       JOIN sellers s ON p.seller_id = s.id
       WHERE p.id = ? AND s.user_id = ?`,
      [id, userId],
    );

    if (checkRows.length === 0) {
      await connection.rollback();
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized or product not found" });
    }

    // Delete associated stock
    await connection.query("DELETE FROM product_stocks WHERE product_id = ?", [id]);
    
    // Delete from seller_products
    await connection.query("DELETE FROM seller_products WHERE product_id = ?", [id]);
    
    // Delete from product_application_mapping
    await connection.query("DELETE FROM product_application_mapping WHERE product_id = ?", [id]);
    
    // Delete from product_reviews
    await connection.query("DELETE FROM product_reviews WHERE product_id = ?", [id]);

    // Delete product
    const [result] = await connection.query(
      "DELETE FROM products WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    await connection.commit();
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    await connection.rollback();
    console.error("Error in deleteProduct:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};
