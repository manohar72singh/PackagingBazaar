import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import { sendNotification } from "../utils/notificationHelper.js";
import { getCoordinates, getRoadMetrics } from "../utils/geoUtils.js";
import { sendEmail } from "../utils/mailHelper.js";

// --- SELLER MANAGEMENT ---

// 1. Fetch all pending sellers
export const getPendingSellers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT u.id as user_id, u.name as owner_name, u.email, u.mobile, u.is_verified, 
             COALESCE(s.seller_uid, 'N/A') as seller_uid,
             COALESCE(s.company_name, 'Incomplete Registration') as company_name, 
             COALESCE(s.business_type, 'N/A') as business_type, 
             COALESCE(s.gst_number, 'Not Provided') as gst_number, 
             s.gst_certificate,
             COALESCE(s.city, 'N/A') as city, 
             s.city, 
             s.state, 
             s.pincode,
             s.business_address,
             s.year_established,
             s.description,
             s.created_at,
             s.status
      FROM users u
      LEFT JOIN sellers s ON u.id = s.user_id
      WHERE u.role = 'seller' AND (s.status IN ('pending', 'hold') OR s.id IS NULL)
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);
    
    // Total count for pagination
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM users u
      LEFT JOIN sellers s ON u.id = s.user_id
      WHERE u.role = 'seller' AND (s.status IN ('pending', 'hold') OR s.id IS NULL)
    `);

    res.status(200).json({ 
      success: true, 
      count: rows.length, 
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      sellers: rows 
    });
  } catch (error) {
    console.error("Error fetching pending sellers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Fetch all active sellers
export const getAllSellers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT u.id as user_id, u.name as owner_name, u.email, u.mobile,
             u.is_verified,                        
             s.seller_uid, s.company_name, s.business_type, s.gst_number, s.gst_certificate,
             s.city, s.state, s.pincode, s.business_address, s.year_established, s.description,
             s.created_at, s.status
      FROM users u
      JOIN sellers s ON u.id = s.user_id
      WHERE u.role = 'seller' AND s.is_verified = 1
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);

    // Total count
    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM users u 
      JOIN sellers s ON u.id = s.user_id 
      WHERE u.role = 'seller' AND s.is_verified = 1
    `);

    res.status(200).json({ 
      success: true, 
      sellers: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page 
    });
  } catch (error) {
    console.error("Error fetching all sellers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Update Seller Status (Pending -> Hold -> Verified)
export const updateSellerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update seller status
    await connection.query("UPDATE sellers SET status = ? WHERE user_id = ?", [status, id]);

    // 2. If status is 'verified' or 'hold', notify the seller
    if (status === 'verified' || status === 'hold') {
      const isVerified = status === 'verified' ? 1 : 0;
      await connection.query("UPDATE users SET is_verified = ? WHERE id = ?", [isVerified, id]);
      await connection.query("UPDATE sellers SET is_verified = ? WHERE user_id = ?", [isVerified, id]);
      
      try {
        const title = status === 'verified' ? 'Account Verified!' : 'Account on Hold';
        const message = status === 'verified' 
          ? 'Congratulations! Your seller account has been verified. You can now receive leads and manage your products.'
          : 'Your account has been placed on hold by the admin. Please check your email or contact support for more details.';

        await sendNotification({
          userId: id,
          userRole: 'seller',
          title: title,
          message: message,
          type: 'status',
          link: '/seller/dashboard'
        });
      } catch (notifErr) {
        console.error("Notification Error:", notifErr);
      }
    } else {
      await connection.query("UPDATE users SET is_verified = 0 WHERE id = ?", [id]);
      await connection.query("UPDATE sellers SET is_verified = 0 WHERE user_id = ?", [id]);
    }

    // 3. Fetch seller mobile for WhatsApp redirect
    const [rows] = await connection.query("SELECT mobile FROM users WHERE id = ?", [id]);
    const mobile = rows[0]?.mobile;

    await connection.commit();
    res.status(200).json({ 
      success: true, 
      message: `Seller status updated to ${status}.`,
      mobile: mobile
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating seller status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 4. Reject Seller / Delete Seller
export const rejectSeller = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch user details before deleting for notification
    const [userRows] = await connection.query("SELECT name, email, mobile FROM users WHERE id = ?", [id]);
    if (userRows.length > 0) {
      const user = userRows[0];
      // Send Rejection Email
      try {
        const subject = "Application Status - PackagingBazaar";
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #e11d48;">Application Declined</h2>
            <p>Hi ${user.name},</p>
            <p>We regret to inform you that your seller application on PackagingBazaar has been declined at this time.</p>
            <p>If you have any questions or would like to re-apply with corrected details, please contact our support team.</p>
            <hr>
            <p>Regards,<br>Team PackagingBazaar</p>
          </div>
        `;
        await sendEmail(user.email, subject, "Your application has been declined.", html);
      } catch (mailErr) {
        console.error("Mail Error (rejection):", mailErr);
      }
    }

    await connection.query("DELETE FROM sellers WHERE user_id = ?", [id]);
    const [result] = await connection.query("DELETE FROM users WHERE id = ?", [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "User not found." });
    }
    await connection.commit();
    res.status(200).json({ success: true, message: "Seller deleted and notified." });
  } catch (error) {
    await connection.rollback();
    console.error("Error rejecting seller:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// --- USER MANAGEMENT ---

// 5. Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.name, u.email, u.mobile, u.role, u.is_verified, u.created_at,
             s.company_name, s.seller_uid, s.city, s.state, s.business_type
      FROM users u
      LEFT JOIN sellers s ON u.id = s.user_id
      WHERE u.id != ?
    `;
    let countQuery = "SELECT COUNT(*) as total FROM users WHERE id != ?";
    const params = [req.user.id];
    const countParams = [req.user.id];

    if (role) {
      if (role === 'seller') {
        query += " AND u.role = ? AND u.is_verified = 1";
        countQuery += " AND role = ? AND is_verified = 1";
      } else {
        query += " AND u.role = ?";
        countQuery += " AND role = ?";
      }
      params.push(role);
      countParams.push(role);
    }

    query += " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    res.status(200).json({ 
      success: true, 
      users: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 6. Update User Role/Status
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, is_verified } = req.body;
  try {
    await pool.query("UPDATE users SET role = ?, is_verified = ? WHERE id = ?", [role, is_verified, id]);
    res.status(200).json({ success: true, message: "User updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 7. Delete User
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- PRODUCT MANAGEMENT ---

// 8. Get All Products for Admin
export const getAllProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id, p.id as product_id, p.name, p.group_key, p.product_code, p.thickness, p.color, p.product_type, p.unit, p.image_url, p.is_hot_deal, p.is_trending,
        COALESCE(sp.price_min, p.min_price) as price_min, 
        COALESCE(sp.price_max, p.max_price) as price_max, 
        COALESCE(sp.moq, ps.min_order) as moq, 
        COALESCE(sp.stock_qty, ps.quantity) as stock_qty,
        s.company_name as seller_name, s.seller_uid,
        c.name as category_name
      FROM products p
      LEFT JOIN seller_products sp ON p.id = sp.product_id AND sp.status = 'active'
      LEFT JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN product_stocks ps ON p.id = ps.product_id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM products");

    res.status(200).json({ 
      success: true, 
      products: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("getAllProductsAdmin Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 9. Get Dashboard Summary Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [users] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const [sellers] = await pool.query(`
      SELECT COUNT(*) as count FROM users u 
      JOIN sellers s ON u.id = s.user_id 
      WHERE u.role = 'seller' AND s.status IN ('verified', 'approved', 'active')
    `);
    const [pending] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users u
      LEFT JOIN sellers s ON u.id = s.user_id
      WHERE u.role = 'seller' AND (s.status IN ('pending', 'hold') OR s.id IS NULL)
    `);
    const [totalProducts] = await pool.query("SELECT COUNT(*) as count FROM products");
    const [uniqueProducts] = await pool.query("SELECT COUNT(DISTINCT group_key) as count FROM products WHERE group_key IS NOT NULL");
    const [orders] = await pool.query("SELECT COUNT(*) as count FROM orders");
    const [inquiries] = await pool.query("SELECT COUNT(*) as count FROM inquiries");
    
    res.status(200).json({
      success: true,
      stats: {
        totalUsers: users[0].count,
        totalSellers: sellers[0].count,
        pendingSellers: pending[0].count,
        totalProducts: totalProducts[0].count,
        uniqueProducts: uniqueProducts[0].count,
        totalOrders: orders[0].count,
        totalInquiries: inquiries[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 9b. Get Advanced Analytics Stats
export const getAnalyticsStats = async (req, res) => {
  try {
    // 1. Lead Status Distribution
    const [statusRows] = await pool.query(`
      SELECT status as name, COUNT(*) as value 
      FROM inquiries 
      GROUP BY status
    `);

    // 2. Lost Reasons Breakdown
    const [lostRows] = await pool.query(`
      SELECT lost_reason as name, COUNT(*) as value 
      FROM inquiries 
      WHERE status = 'Lead Lost' AND lost_reason IS NOT NULL
      GROUP BY lost_reason
    `);

    // 3. Category Popularity (Top 5)
    const [catRows] = await pool.query(`
      SELECT c.name, COUNT(i.id) as value
      FROM inquiries i
      JOIN products p ON i.product_id = p.id
      JOIN sub_categories sc ON p.sub_category_id = sc.id
      JOIN categories c ON sc.category_id = c.id
      GROUP BY c.id
      ORDER BY value DESC
      LIMIT 5
    `);

    // 4. Monthly Inquiry Volume (Last 6 Months)
    const [volumeRows] = await pool.query(`
      SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count
      FROM inquiries
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY MIN(created_at) ASC
    `);

    // 5. Seller Performance (Top 5 by Won Deals)
    const [sellerRows] = await pool.query(`
      SELECT s.company_name as name, COUNT(i.id) as value
      FROM inquiries i
      JOIN sellers s ON i.won_seller_id = s.id
      WHERE i.status = 'Deal Closed'
      GROUP BY s.id
      ORDER BY value DESC
      LIMIT 5
    `);

    res.status(200).json({
      success: true,
      analytics: {
        leadStatus: statusRows,
        lostReasons: lostRows,
        categories: catRows,
        monthlyVolume: volumeRows,
        topSellers: sellerRows
      }
    });
  } catch (error) {
    console.error("Error fetching analytics stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// --- SALES MANAGEMENT ---

// 10. Get All Orders for Admin
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.order_date, 
             u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM orders");

    res.status(200).json({ 
      success: true, 
      orders: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching all orders for admin:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 11. Get Orders for a Specific User (Customer)
export const getUserOrdersAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT o.id, o.user_id, o.total_price, o.status, o.order_date, 
             u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;
    const [rows] = await pool.query(query, [userId]);
    res.status(200).json({ success: true, orders: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSellerProductsAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params; // Frontend sends user_id
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT p.*, s.company_name as seller_name, s.seller_uid, c.name as category_name
    FROM products p
    JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
      LEFT JOIN categories c ON sc.category_id = c.id
      WHERE s.user_id = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [sellerId, limit, offset]);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM products p JOIN sellers s ON p.seller_id = s.id WHERE s.user_id = ?", [sellerId]);

    res.status(200).json({ 
      success: true, 
      products: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("getSellerProductsAdmin Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getSellerOrdersAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params; // Frontend sends user_id
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

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
                  'brand', oi.brand
                )
              ) 
              FROM order_items oi 
              JOIN products p ON oi.product_id = p.id 
              WHERE oi.order_id = o.id AND p.seller_id = s.id) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN sellers s ON p.seller_id = s.id
      JOIN users u ON o.user_id = u.id
      WHERE s.user_id = ?
      GROUP BY o.id, s.id, u.name, u.email
      ORDER BY o.order_date DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [sellerId, limit, offset]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(DISTINCT o.id) as total 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.user_id = ?
    `, [sellerId]);

    res.status(200).json({ 
      success: true, 
      orders: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("getSellerOrdersAdmin Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 14. Get Sellers who have received orders (Seller Hub → Seller Orders tab)
export const getSellersWithOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        s.user_id,
        s.seller_uid,
        s.company_name,
        s.business_type,
        u.email,
        u.name AS owner_name,
        u.is_verified,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE((
          SELECT SUM(o2.total_price)
          FROM orders o2
          JOIN order_items oi2 ON oi2.order_id = o2.id
          JOIN products p2 ON p2.id = oi2.product_id
          WHERE p2.seller_id = s.id
          GROUP BY p2.seller_id
        ), 0) AS total_revenue
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      JOIN products p ON p.seller_id = s.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
      GROUP BY s.user_id, s.id, s.seller_uid, s.company_name, s.business_type, u.email, u.name, u.is_verified
      ORDER BY total_orders DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(DISTINCT s.user_id) as total
      FROM sellers s
      JOIN products p ON p.seller_id = s.id
      JOIN order_items oi ON oi.product_id = p.id
      JOIN orders o ON o.id = oi.order_id
    `);

    res.status(200).json({ 
      success: true, 
      sellers: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("getSellersWithOrdersAdmin error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- INQUIRY MANAGEMENT (LEADS) ---

// 15. Get All Inquiries for Admin
export const getAllInquiriesAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT i.*, 
             COALESCE(u.name, i.buyer_name) as buyer_display_name,
             COALESCE(u.mobile, i.phone) as buyer_display_mobile,
             COALESCE(u.email, i.buyer_email) as buyer_display_email,
             p.name as product_name, p.image_url,
             s.company_name as seller_name, s.city as seller_city, s.state as seller_state,
             ws.company_name as won_seller_name
      FROM inquiries i
      LEFT JOIN users u ON i.buyer_id = u.id
      JOIN products p ON i.product_id = p.id
      JOIN sellers s ON i.seller_id = s.id
      LEFT JOIN sellers ws ON i.won_seller_id = ws.id
      ORDER BY i.id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [limit, offset]);

    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM inquiries");

    res.status(200).json({ 
      success: true, 
      inquiries: rows,
      totalCount: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching all inquiries for admin:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// updateInquiryStatus moved to the end of file for cleaner organization


// ── CATEGORY & SUBCATEGORY MANAGEMENT ──────────────────────────────────────

export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ success: false, message: "Category name required" });
  try {
    const codePrefix = name.trim().substring(0, 3).toUpperCase();
    const [existing] = await pool.query("SELECT id FROM categories WHERE name = ?", [name.trim()]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "Category already exists" });
    const [result] = await pool.query("INSERT INTO categories (name, code_prefix) VALUES (?, ?)", [name.trim(), codePrefix]);
    res.status(201).json({ success: true, id: result.insertId, name: name.trim(), code_prefix: codePrefix });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sub_categories WHERE category_id = ?", [id]);
    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const createSubCategory = async (req, res) => {
  const { name, category_id } = req.body;
  if (!name?.trim() || !category_id) return res.status(400).json({ success: false, message: "Name and category required" });
  try {
    const [existing] = await pool.query("SELECT id FROM sub_categories WHERE name = ? AND category_id = ?", [name.trim(), category_id]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: "Subcategory already exists in this category" });
    const [result] = await pool.query("INSERT INTO sub_categories (name, category_id) VALUES (?, ?)", [name.trim(), category_id]);
    res.status(201).json({ success: true, id: result.insertId, name: name.trim(), category_id });
  } catch (err) {
    console.error("createSubCategory error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteSubCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM sub_categories WHERE id = ?", [id]);
    res.json({ success: true, message: "Subcategory deleted" });
  } catch (err) {
    console.error("deleteSubCategory error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// 16. Toggle Product Hot Deal Status
export const toggleHotDeal = async (req, res) => {
  const { id } = req.params;
  const { is_hot_deal } = req.body;
  try {
    const [result] = await pool.query("UPDATE products SET is_hot_deal = ? WHERE id = ?", [is_hot_deal ? 1 : 0, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Product not found." });
    res.status(200).json({ success: true, message: `Product ${is_hot_deal ? 'added to' : 'removed from'} Hot Deals.` });
  } catch (error) {
    console.error("Error toggling hot deal:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const toggleTrending = async (req, res) => {
  const { id } = req.params;
  const { is_trending } = req.body;
  try {
    const [result] = await pool.query("UPDATE products SET is_trending = ? WHERE id = ?", [is_trending ? 1 : 0, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Product not found." });
    res.status(200).json({ success: true, message: `Product ${is_trending ? 'marked as' : 'removed from'} Trending.` });
  } catch (error) {
    console.error("Error toggling trending:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 17. Get Recommended Sellers for a lead (Phase 2 - Smart Matching)
// export const getRecommendedSellers = async (req, res) => {
//   try {
//     const { id } = req.params;
    
//     // 1. Get lead details
//     const [leadRows] = await pool.query(
//       `SELECT i.*, p.sub_category_id, sc.category_id, p.product_type, p.group_key
//        FROM inquiries i 
//        JOIN products p ON i.product_id = p.id 
//        LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
//        WHERE i.id = ?`,
//       [id]
//     );

//     if (leadRows.length === 0) {
//       return res.status(404).json({ success: false, message: "Lead not found" });
//     }

//     const lead = leadRows[0];
    
//     // Helper function to extract number from string (e.g., "500 kg" -> 500)
//     const parseQty = (str) => {
//       if (!str) return 0;
//       const match = str.match(/(\d+)/);
//       return match ? parseInt(match[1]) : 0;
//     };

//     const leadQty = parseQty(lead.quantity_required);
//     const leadThickness = lead.thickness ? lead.thickness.toLowerCase() : null;
//     const leadWidth = lead.width ? lead.width.toLowerCase() : null;

//     // 1.1 Get Lead Coordinates
//     const leadCoords = await getCoordinates(lead.pincode);
//     const bLat = leadCoords?.latitude || null;
//     const bLng = leadCoords?.longitude || null;

//     // 2. Fetch all verified sellers with smart matching logic
//     // New IndiaMART Style Layered Filtering & Smart Scoring (Max ~1500 Pts)
//     // - Distance: 0-10km (200), 10-50km (150), 50-100km (100), 100km+ (50/fallback)
//     // - Location: City (50), State (20) - fallback if lat/lng missing
//     // - Specifications Match: Exact (150), Custom/All/Null (100), Mismatch (0)
//     // - Delivery Speed: <= 24h (150), <= 48h (100), <= 72h (50)
//     // - Stock & Price are dynamically scored based on averages
    
//     const query = `
//       SELECT * FROM (
//         SELECT s.id as seller_id, s.company_name, s.city, s.state, s.pincode, s.business_address as address, s.status as seller_status,
//         u.email, u.mobile as phone, u.name as owner_name,
//         pg.latitude as seller_lat, pg.longitude as seller_lng,
//         -- Distance Calculation (Using Robust Law of Cosines with NaN Protection)
//         (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) AS distance_km,
        
//         -- Location Score Breakdown (Max 200)
//         (
//           CASE 
//             WHEN (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 10 THEN 200
//             WHEN (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 50 THEN 150
//             WHEN (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 100 THEN 100
//             WHEN (6371 * acos(LEAST(1, GREATEST(-1, cos(radians(?)) * cos(radians(pg.latitude)) * cos(radians(pg.longitude) - radians(?)) + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 300 THEN 50
//             WHEN s.pincode = ? THEN 150
//             WHEN LOWER(s.city) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.city), '%') THEN 50 
//             WHEN LOWER(s.state) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.state), '%') THEN 20 
//             WHEN (
//               (LOWER(?) LIKE '%delhi%' OR LOWER(?) LIKE '%ncr%') AND 
//               (LOWER(s.city) IN ('ghaziabad', 'noida', 'greater noida', 'gurgaon', 'gurugram', 'faridabad', 'sonepat', 'bahadurgarh'))
//             ) THEN 150
//             ELSE 0 
//           END
//         ) as location_score,


//         -- Product Score Breakdown
//         COALESCE((
//           SELECT MAX(
//             CASE 
//               WHEN sp.delivery_hours IS NULL THEN 0
//               WHEN sp.delivery_hours <= 24 THEN 150
//               WHEN sp.delivery_hours <= 48 THEN 100
//               WHEN sp.delivery_hours <= 72 THEN 50
//               ELSE 0 
//             END +
//             CASE 
//               WHEN sp.price_min <= (SELECT COALESCE(MIN(price_min), sp.price_min) FROM seller_products WHERE product_id = sp.product_id) THEN 250
//               WHEN sp.price_min <= (SELECT COALESCE(AVG(price_min), sp.price_min) FROM seller_products WHERE product_id = sp.product_id) THEN 150 
//               ELSE 50 
//             END +
//             CASE WHEN sp.stock_qty >= ? THEN 100 ELSE 0 END +
//             CASE 
//               WHEN REGEXP_REPLACE(LOWER(sp.width), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') THEN 150 
//               WHEN sp.width REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') THEN 150
//               WHEN sp.width IS NULL OR LOWER(sp.width) REGEXP 'all|custom|any|none' THEN 100
//               ELSE 0 
//             END +
//             CASE 
//               WHEN EXISTS (SELECT 1 FROM products p3 WHERE p3.id = sp.product_id AND (
//                 REGEXP_REPLACE(LOWER(p3.thickness), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR 
//                 p3.thickness REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)')
//               )) THEN 150 
//               WHEN EXISTS (SELECT 1 FROM products p3 WHERE p3.id = sp.product_id AND (p3.thickness IS NULL OR LOWER(p3.thickness) REGEXP 'all|custom|any|none')) THEN 100
//               ELSE 0 
//             END
//           )
//           FROM seller_products sp
//           JOIN products p_check ON sp.product_id = p_check.id
//           JOIN sub_categories sc_check ON p_check.sub_category_id = sc_check.id
//           WHERE sp.seller_id = s.id AND sp.status = 'active' AND sc_check.category_id = ?
//         ), 0) as product_score,

//         (s.pincode = ?) as pincode_match,
//         (LOWER(s.city) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.city), '%')) as city_match,
//         (LOWER(s.state) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.state), '%')) as state_match,
//         EXISTS (SELECT 1 FROM seller_products sp2 JOIN products p2 ON sp2.product_id = p2.id JOIN sub_categories sc2 ON p2.sub_category_id = sc2.id WHERE sp2.seller_id = s.id AND sc2.category_id = ? AND sp2.stock_qty >= ? ) as has_stock,
//         EXISTS (SELECT 1 FROM seller_products sp3 JOIN products p3 ON sp3.product_id = p3.id JOIN sub_categories sc3 ON p3.sub_category_id = sc3.id WHERE sp3.seller_id = s.id AND sc3.category_id = ? AND sp3.moq <= ? ) as moq_fit,
//         EXISTS (SELECT 1 FROM seller_products sp4 JOIN products p4 ON sp4.product_id = p4.id JOIN sub_categories sc4 ON p4.sub_category_id = sc4.id WHERE sp4.seller_id = s.id AND sc4.category_id = ? AND sp4.price_min <= (SELECT COALESCE(AVG(price_min), sp4.price_min) FROM seller_products WHERE product_id = sp4.product_id) ) as price_match,
//         (SELECT MIN(delivery_hours) FROM seller_products sp5 JOIN products p5 ON sp5.product_id = p5.id JOIN sub_categories sc5 ON p5.sub_category_id = sc5.id WHERE sp5.seller_id = s.id AND sp5.status = 'active' AND sc5.category_id = ?) as best_delivery_hours,
//         (SELECT MIN(price_min) FROM seller_products sp_p JOIN products p_p ON sp_p.product_id = p_p.id JOIN sub_categories sc_p ON p_p.sub_category_id = sc_p.id WHERE sp_p.seller_id = s.id AND sp_p.status = 'active' AND sc_p.category_id = ?) as best_price,
//         EXISTS (SELECT 1 FROM seller_products sp6 JOIN products p6 ON sp6.product_id = p6.id JOIN sub_categories sc6 ON p6.sub_category_id = sc6.id WHERE sp6.seller_id = s.id AND sc6.category_id = ?) as category_match,
//         EXISTS (SELECT 1 FROM lead_assignments la WHERE la.seller_id = s.id AND la.inquiry_id = ?) as is_assigned
//         FROM sellers s
//         JOIN users u ON s.user_id = u.id
//         LEFT JOIN pincodes_geo pg ON s.pincode = pg.pincode
//         WHERE u.role = 'seller' AND u.is_verified = 1
//           AND EXISTS (
//             SELECT 1 FROM seller_products sp_filter 
//             JOIN products p_filter ON sp_filter.product_id = p_filter.id
//             JOIN sub_categories sc_filter ON p_filter.sub_category_id = sc_filter.id
//             WHERE sp_filter.seller_id = s.id 
//               AND sp_filter.status = 'active'
//               AND sc_filter.category_id = ? 
//               AND (
//                 -- Flexible Match: Product Type or Name contains the lead's type/name
//                 (p_filter.product_type LIKE CONCAT('%', ?, '%') OR ? LIKE CONCAT('%', p_filter.product_type, '%') OR p_filter.name LIKE CONCAT('%', ?, '%'))
//                 AND (
//                   (REGEXP_REPLACE(LOWER(sp_filter.width), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR sp_filter.width REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(sp_filter.width) REGEXP 'all|any|custom|none' OR sp_filter.width IS NULL)
//                   AND 
//                   (REGEXP_REPLACE(LOWER(p_filter.thickness), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR p_filter.thickness REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(p_filter.thickness) REGEXP 'all|any|custom|none' OR p_filter.thickness IS NULL)
//                 )
//               )
//               AND sp_filter.stock_qty >= ? 
//               AND sp_filter.moq <= ? 
//           )
//       ) as t
//       ORDER BY (CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END) ASC, distance_km ASC, product_score DESC, best_price ASC
//     `;

//     const [sellers] = await pool.query(query, [
//       bLat, bLng, bLat, // distance_km
      
//       // location_score
//       bLat, bLng, bLat, bLat, bLng, bLat, bLat, bLng, bLat, bLat, bLng, bLat,
//       lead.pincode, lead.city, lead.address, lead.state, lead.address, lead.state, lead.state,

//       // product_score
//       leadQty, leadWidth, leadWidth, leadThickness, leadThickness, lead.category_id,

//       // matches checks
//       lead.pincode, lead.city, lead.address, lead.state, lead.address,
//       lead.category_id, leadQty, 
//       lead.category_id, leadQty, 
//       lead.category_id, 
//       lead.category_id, 
//       lead.category_id, lead.category_id, lead.id,

//       // WHERE clause filters (Mandatory)
//       lead.category_id, // category match
//       lead.product_type || 'NA', lead.product_type || 'NA', lead.product_type || 'NA', // type match
//       leadWidth, leadWidth, // width match
//       leadThickness, leadThickness, // thickness match
//       leadQty > 0 ? leadQty : 0, // stock
//       leadQty > 0 ? leadQty : 999999  // moq
//     ]);

//     // 2.1 Fetch Real Road Metrics for top 5 sellers (Only if coordinates exist)
//     const enrichedSellers = await Promise.all(sellers.map(async (seller, idx) => {
//       // Use idx < 5 to limit API calls (saves cost/latency)
//       if (idx < 5 && bLat && bLng && seller.seller_lat && seller.seller_lng) {
//         const roadMetrics = await getRoadMetrics(bLat, bLng, seller.seller_lat, seller.seller_lng);
//         if (roadMetrics) {
//           return { ...seller, ...roadMetrics };
//         }
//       }
//       return seller;
//     }));

//     res.status(200).json({ 
//       success: true, 
//       recommendations: enrichedSellers,
//       leadLocation: { city: lead.city, state: lead.state },
//       leadRequirements: { qty: leadQty, thickness: leadThickness, width: leadWidth }
//     });
//   } catch (error) {
//     console.error("Error in getRecommendedSellers:", error);
//     res.status(500).json({ success: false, message: "Server Error" });
//   }
// };

// 17. Get Recommended Sellers for a lead (Phase 2 - Smart Matching)
export const getRecommendedSellers = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get lead details
    const [leadRows] = await pool.query(
      `SELECT i.*, p.sub_category_id, sc.category_id, p.product_type, p.group_key
       FROM inquiries i 
       JOIN products p ON i.product_id = p.id 
       LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
       WHERE i.id = ?`,
      [id]
    );

    if (leadRows.length === 0) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    const lead = leadRows[0];

    // Helper: extract number from string e.g. "500 kg" -> 500
    const parseQty = (str) => {
      if (!str) return 0;
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    const leadQty       = parseQty(lead.quantity_required);
    const leadThickness = lead.thickness ? lead.thickness.toLowerCase() : null;
    const leadWidth     = lead.width     ? lead.width.toLowerCase()     : null;

    // 1.1 Get Lead Coordinates
    const leadCoords = await getCoordinates(lead.pincode);
    const bLat = leadCoords?.latitude  || null;
    const bLng = leadCoords?.longitude || null;

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Fetch all verified sellers with smart matching + scoring
    //
    // Scoring breakdown (Max ~1500 pts before weighting):
    //   location_score : 0–200  (distance bands + city/state fallback)
    //   product_score  : 0–800  (delivery + price + stock + width + thickness)
    //   delivery_bonus : 0–150  (used separately in total_score weighting)
    //
    // Final ORDER BY:
    //   total_score = location_score*0.40 + product_score*0.40 + delivery_bonus*0.20
    // ─────────────────────────────────────────────────────────────────────────
    const query = `
      SELECT * FROM (
        SELECT
          s.id as seller_id,
          s.company_name,
          s.city,
          s.state,
          s.pincode,
          s.business_address as address,
          s.status as seller_status,
          u.email,
          u.mobile as phone,
          u.name as owner_name,
          pg.latitude  as seller_lat,
          pg.longitude as seller_lng,

          -- Distance (km) via spherical law of cosines
          (6371 * acos(LEAST(1, GREATEST(-1,
            cos(radians(?)) * cos(radians(pg.latitude))
              * cos(radians(pg.longitude) - radians(?))
            + sin(radians(?)) * sin(radians(pg.latitude))
          )))) AS distance_km,

          -- Location Score (Max 200)
          (
            CASE
              WHEN (6371 * acos(LEAST(1, GREATEST(-1,
                      cos(radians(?)) * cos(radians(pg.latitude))
                        * cos(radians(pg.longitude) - radians(?))
                      + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 10  THEN 200
              WHEN (6371 * acos(LEAST(1, GREATEST(-1,
                      cos(radians(?)) * cos(radians(pg.latitude))
                        * cos(radians(pg.longitude) - radians(?))
                      + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 50  THEN 150
              WHEN (6371 * acos(LEAST(1, GREATEST(-1,
                      cos(radians(?)) * cos(radians(pg.latitude))
                        * cos(radians(pg.longitude) - radians(?))
                      + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 100 THEN 100
              WHEN (6371 * acos(LEAST(1, GREATEST(-1,
                      cos(radians(?)) * cos(radians(pg.latitude))
                        * cos(radians(pg.longitude) - radians(?))
                      + sin(radians(?)) * sin(radians(pg.latitude)))))) <= 300 THEN 50
              WHEN s.pincode = ?                                                         THEN 150
              WHEN LOWER(s.city)  = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.city),  '%') THEN  50
              WHEN LOWER(s.state) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.state), '%') THEN  20
              WHEN (
                (LOWER(?) LIKE '%delhi%' OR LOWER(?) LIKE '%ncr%') AND
                LOWER(s.city) IN (
                  'ghaziabad','noida','greater noida','gurgaon',
                  'gurugram','faridabad','sonepat','bahadurgarh'
                )
              ) THEN 150
              ELSE 0
            END
          ) as location_score,

          -- Product Score (Max 800 — delivery + price + stock + width + thickness)
          COALESCE((
            SELECT MAX(
              -- Delivery speed (Max 150)
              CASE
                WHEN sp.delivery_hours IS NULL    THEN 0
                WHEN sp.delivery_hours <= 24      THEN 150
                WHEN sp.delivery_hours <= 48      THEN 100
                WHEN sp.delivery_hours <= 72      THEN  50
                ELSE 0
              END +
              -- Price competitiveness (Max 250)
              CASE
                WHEN sp.price_min <= (SELECT COALESCE(MIN(price_min), sp.price_min) FROM seller_products WHERE product_id = sp.product_id) THEN 250
                WHEN sp.price_min <= (SELECT COALESCE(AVG(price_min), sp.price_min) FROM seller_products WHERE product_id = sp.product_id) THEN 150
                ELSE 50
              END +
              -- Stock availability (Max 100)
              CASE WHEN sp.stock_qty >= ?         THEN 100 ELSE 0 END +
              -- Width match (Max 150)
              CASE
                WHEN REGEXP_REPLACE(LOWER(sp.width), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '')  THEN 150
                WHEN sp.width REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)')    THEN 150
                WHEN sp.width IS NULL OR LOWER(sp.width) REGEXP 'all|custom|any|none'                          THEN 100
                ELSE 0
              END +
              -- Thickness match (Max 150)
              CASE
                WHEN EXISTS (
                  SELECT 1 FROM products p3 WHERE p3.id = sp.product_id AND (
                    REGEXP_REPLACE(LOWER(p3.thickness), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR
                    p3.thickness REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)')
                  )
                ) THEN 150 
                WHEN EXISTS (
                  SELECT 1 FROM products p3 WHERE p3.id = sp.product_id AND (
                    p3.thickness IS NULL OR LOWER(p3.thickness) REGEXP 'all|custom|any|none'
                  )
                ) THEN 100
                ELSE 0 
              END +
              -- Product Name Exact Match Bonus (Max 250)
              CASE 
                WHEN p_check.name = (SELECT name FROM products WHERE id = ?) THEN 250
                ELSE 0
              END
            )
            FROM seller_products sp
            JOIN products p_check       ON sp.product_id      = p_check.id
            JOIN sub_categories sc_check ON p_check.sub_category_id = sc_check.id
            WHERE sp.seller_id = s.id
              AND sp.status    = 'active'
              AND sc_check.category_id = ?
          ), 0) as product_score,

          -- Flag columns (used for match_tag in JS)
          (s.pincode = ?)                                                                              as pincode_match,
          (LOWER(s.city)  = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.city),  '%'))              as city_match,
          (LOWER(s.state) = LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(s.state), '%'))              as state_match,

          EXISTS (
            SELECT 1 FROM seller_products sp2
            JOIN products p2         ON sp2.product_id        = p2.id
            WHERE sp2.seller_id = s.id AND p2.name = (SELECT name FROM products WHERE id = ?) AND sp2.stock_qty >= ?
          ) as has_stock,

          EXISTS (
            SELECT 1 FROM seller_products sp3
            JOIN products p3         ON sp3.product_id        = p3.id
            WHERE sp3.seller_id = s.id AND p3.name = (SELECT name FROM products WHERE id = ?) AND sp3.moq >= ?
          ) as moq_fit,

          EXISTS (
            SELECT 1 FROM seller_products sp4
            JOIN products p4         ON sp4.product_id        = p4.id
            WHERE sp4.seller_id = s.id AND p4.name = (SELECT name FROM products WHERE id = ?)
              AND sp4.price_min <= (
                SELECT COALESCE(AVG(price_min), sp4.price_min)
                FROM seller_products WHERE product_id = sp4.product_id
              )
          ) as price_match,

          (
            SELECT MIN(delivery_hours)
            FROM seller_products sp5
            JOIN products p5         ON sp5.product_id        = p5.id
            WHERE sp5.seller_id = s.id AND sp5.status = 'active' AND p5.name = (SELECT name FROM products WHERE id = ?)
          ) as best_delivery_hours,

          (
            SELECT MIN(price_min)
            FROM seller_products sp_p
            JOIN products p_p        ON sp_p.product_id       = p_p.id
            WHERE sp_p.seller_id = s.id AND sp_p.status = 'active' AND p_p.name = (SELECT name FROM products WHERE id = ?)
          ) as best_price,

          (
            SELECT MIN(moq)
            FROM seller_products sp_moq
            JOIN products p_moq        ON sp_moq.product_id       = p_moq.id
            WHERE sp_moq.seller_id = s.id AND sp_moq.status = 'active' AND p_moq.name = (SELECT name FROM products WHERE id = ?)
          ) as best_moq,

          (
             SELECT MAX(
                (
                  (REGEXP_REPLACE(LOWER(sp_f.width), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR sp_f.width REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(sp_f.width) REGEXP 'all|any|custom|none' OR sp_f.width IS NULL) AND
                  (REGEXP_REPLACE(LOWER(p_f.thickness), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR p_f.thickness REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(p_f.thickness) REGEXP 'all|any|custom|none' OR p_f.thickness IS NULL) AND
                  (p_f.product_type LIKE CONCAT('%', ?, '%') OR ? LIKE CONCAT('%', p_f.product_type, '%'))
                )
             )
             FROM seller_products sp_f
             JOIN products p_f ON sp_f.product_id = p_f.id
             WHERE sp_f.seller_id = s.id AND sp_f.status = 'active' AND p_f.name = (SELECT name FROM products WHERE id = ?)
          ) as is_hard_match,

          (
             SELECT JSON_OBJECT(
               'width_match',     MAX(REGEXP_REPLACE(LOWER(sp_f.width), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR sp_f.width REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(sp_f.width) REGEXP 'all|any|custom|none' OR sp_f.width IS NULL),
               'thickness_match', MAX(REGEXP_REPLACE(LOWER(p_f.thickness), '[^0-9.]', '') = REGEXP_REPLACE(LOWER(?), '[^0-9.]', '') OR p_f.thickness REGEXP CONCAT('(^|[^0-9.])', REGEXP_REPLACE(?, '[^0-9.]', ''), '([^0-9.]|$)') OR LOWER(p_f.thickness) REGEXP 'all|any|custom|none' OR p_f.thickness IS NULL),
               'type_match',      MAX(p_f.product_type LIKE CONCAT('%', ?, '%') OR ? LIKE CONCAT('%', p_f.product_type, '%'))
             )
             FROM seller_products sp_f
             JOIN products p_f ON sp_f.product_id = p_f.id
             WHERE sp_f.seller_id = s.id AND sp_f.status = 'active' AND p_f.name = (SELECT name FROM products WHERE id = ?)
          ) as hard_match_info,

          EXISTS (
            SELECT 1 FROM lead_assignments la
            WHERE la.seller_id = s.id AND la.inquiry_id = ?
          ) as is_assigned

        FROM sellers s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN pincodes_geo pg ON s.pincode = pg.pincode
        WHERE u.role = 'seller'
          AND u.is_verified = 1
          AND EXISTS (
            SELECT 1 FROM seller_products sp_final
            JOIN products p_final ON sp_final.product_id = p_final.id
            JOIN sub_categories sc_final ON p_final.sub_category_id = sc_final.id
            WHERE sp_final.seller_id = s.id 
              AND sp_final.status = 'active'
              AND sc_final.category_id = ?
              AND p_final.name = (SELECT name FROM products WHERE id = ?)
          )
      ) as t

      -- ── SMART RANKING ────────────────────────────────────────────────────
      -- Prioritize those who passed ALL hard filters, then by distance, then score
      ORDER BY
        (CASE WHEN is_hard_match = 1 THEN 0 ELSE 1 END) ASC,
        (CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END) ASC,
        (
          location_score * 0.40
          + product_score * 0.40
          + (CASE
               WHEN best_delivery_hours <= 24 THEN 150
               WHEN best_delivery_hours <= 48 THEN 100
               WHEN best_delivery_hours <= 72 THEN  50
               ELSE 0
             END) * 0.20
        ) DESC,
        best_price ASC
    `;

    const params = [
      // 1. distance_km (3 params)
      bLat, bLng, bLat,

      // 2. location_score — 4 distance bands × 3 params each = 12
      bLat, bLng, bLat,
      bLat, bLng, bLat,
      bLat, bLng, bLat,
      bLat, bLng, bLat,

      // 3. location_score — fallback text checks (7 params)
      lead.pincode,
      lead.city, lead.address,
      lead.state, lead.address,
      lead.state, lead.state,  // NCR check

      // 4. product_score inner SELECT (7 params)
      leadQty,              // stock_qty check
      leadWidth, leadWidth, // width regex
      leadThickness, leadThickness, // thickness regex
      lead.product_id,      // name match bonus
      lead.category_id,     // category filter

      // 5. Flag columns (11 params)
      lead.pincode,         // pincode_match
      lead.city, lead.address, // city_match
      lead.state, lead.address, // state_match
      lead.product_id, leadQty, // has_stock
      lead.product_id, leadQty, // moq_fit
      lead.product_id, // price_match
      lead.product_id, // best_delivery_hours

      // 6. Best Price / MOQ (2 params)
      lead.product_id, // best_price
      lead.product_id, // best_moq

      // 7. is_hard_match (7 params)
      leadWidth, leadWidth,
      leadThickness, leadThickness,
      lead.product_type || 'NA', lead.product_type || 'NA',
      lead.product_id,

      // 8. hard_match_info JSON (7 params)
      leadWidth, leadWidth,
      leadThickness, leadThickness,
      lead.product_type || 'NA', lead.product_type || 'NA',
      lead.product_id,

      // 9. Assignment status
      lead.id, // is_assigned

      // 10. WHERE EXISTS filter (2 params)
      lead.category_id,
      lead.product_id
    ];

    const [sellers] = await pool.query(query, params);

    // ── 3. Enrich top-5 with real road metrics + attach total_score & match_tag ──
    const enrichedSellers = await Promise.all(
      sellers.map(async (seller, idx) => {
        // Real road distance/duration only for top 5 (saves API quota)
        if (idx < 5 && bLat && bLng && seller.seller_lat && seller.seller_lng) {
          const roadMetrics = await getRoadMetrics(
            bLat, bLng, seller.seller_lat, seller.seller_lng
          );
          if (roadMetrics) Object.assign(seller, roadMetrics);
        }

        // Weighted total score
        const deliveryBonus =
          seller.best_delivery_hours <= 24 ? 150 :
          seller.best_delivery_hours <= 48 ? 100 :
          seller.best_delivery_hours <= 72 ?  50 : 0;

        seller.total_score = Math.round(
          seller.location_score * 0.40 +
          seller.product_score  * 0.40 +
          deliveryBonus         * 0.20
        );

        // Human-readable match tag for frontend badge
        if (seller.total_score >= 300)       seller.match_tag = "Best Match";
        else if (seller.distance_km < 50)    seller.match_tag = "Nearest";
        else if (seller.price_match)         seller.match_tag = "Best Price";
        else if (seller.best_delivery_hours <= 24) seller.match_tag = "Fast Delivery";
        else                                 seller.match_tag = null;

        return seller;
      })
    );

    res.status(200).json({
      success: true,
      recommendations: enrichedSellers,
      leadLocation: { city: lead.city, state: lead.state },
      leadRequirements: {
        qty:       leadQty,
        thickness: leadThickness,
        width:     leadWidth,
      },
    });
  } catch (error) {
    console.error("Error in getRecommendedSellers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 18. Add product for a seller (Admin - Phase 2 Dual Insert)
// Helper for dynamic entity resolution (Category, SubCategory, Tag)
const resolveEntityId = async (connection, table, nameField, value, parentField = null, parentValue = null) => {
  if (!value) return null;
  
  // Check if value is an existing ID (numeric)
  const isId = !isNaN(value) && value !== "";
  if (isId) {
    const [exists] = await connection.query(`SELECT id FROM ${table} WHERE id = ?`, [value]);
    if (exists.length > 0) return value;
  }

  // Search by name
  let sql = `SELECT id FROM ${table} WHERE ${nameField} = ?`;
  let params = [value];
  if (parentField && parentValue) {
    sql += ` AND ${parentField} = ?`;
    params.push(parentValue);
  }

  const [rows] = await connection.query(sql, params);
  if (rows.length > 0) return rows[0].id;

  // Create new record
  let insertSql, insertParams;
  if (table === 'categories') {
    const codePrefix = value.substring(0, 3).toUpperCase();
    insertSql = `INSERT INTO categories (name, code_prefix) VALUES (?, ?)`;
    insertParams = [value, codePrefix];
  } else if (parentField && parentValue) {
    insertSql = `INSERT INTO ${table} (${nameField}, ${parentField}) VALUES (?, ?)`;
    insertParams = [value, parentValue];
  } else {
    insertSql = `INSERT INTO ${table} (${nameField}) VALUES (?)`;
    insertParams = [value];
  }

  const [result] = await connection.query(insertSql, insertParams);
  return result.insertId;
};

// 18. Add product for a seller (Admin - Phase 2 Dual Insert)
export const addProductForSeller = async (req, res) => {
  const { sellerUserId } = req.params;
  const { 
    name, display_name, product_group_id, category, subcategory, tag, thickness, width, 
    minPrice, maxPrice, unit, description, img, stock, minOrder, applications,
    delivery_hours, payment_terms, color, productType, productCode
  } = req.body;

  const parsedHours = parseInt(delivery_hours);
  if (isNaN(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ success: false, message: "Delivery time must be a valid number of hours (> 0)" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get seller_id and verification status from user_id
    const [sellerRows] = await connection.query(
      "SELECT id, is_verified FROM sellers WHERE user_id = ?",
      [sellerUserId]
    );

    if (sellerRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }

    const { id: sellerId, is_verified } = sellerRows[0];

    // BLOCK if seller is not verified
    if (!is_verified) {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        message: "Action Blocked: This seller is not yet verified. Please verify the seller from the 'Pending Sellers' section first." 
      });
    }

    // 2. Resolve Category, SubCategory, and Tag (Dynamic Creation if needed)
    const resolvedCategoryId = await resolveEntityId(connection, 'categories', 'name', category);
    const subCategoryId = await resolveEntityId(connection, 'sub_categories', 'name', subcategory, 'category_id', resolvedCategoryId);
    const resolvedTagId = await resolveEntityId(connection, 'tags', 'tag_name', tag);

    if (!subCategoryId) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Could not resolve or create category/subcategory" });
    }

    const [catRows] = await connection.query("SELECT code_prefix FROM categories WHERE id = ?", [resolvedCategoryId]);
    const catPrefix = catRows[0]?.code_prefix || "PRD";

    // --- AUTO GEN group_key if missing (Matches Excel Pattern: CAT_COLOR_THICK_TYPE) ---
    let finalGroupKey = req.body.group_key;
    if (!finalGroupKey) {
      const catPart = category ? category.toString().toUpperCase().replace(/\s+/g, '_') : 'PRD';
      const colorPart = color ? color.toString().toUpperCase().replace(/\s+/g, '_') : 'NA';
      const thickPart = (thickness || "X").toString().replace(/\s+/g, '');
      const typePart = (productType || color || "NA").toString().substring(0, 3).toUpperCase();
      finalGroupKey = `${catPart}_${colorPart}_${thickPart}_${typePart}`;
    }

    // 3. Create new Master Product (Always create new for unique specs/images)
    console.log(`🚀 Creating New Product Record for Seller: ${sellerId}`);
    const [productResult] = await connection.query(
      `INSERT INTO products 
       (product_group_id, sub_category_id, tag_id, seller_id, name, display_name, group_key, product_code, thickness, width, color, product_type, unit, description, image_url, applications) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_group_id || null, subCategoryId, resolvedTagId || null, sellerId, name, display_name, finalGroupKey, productCode, thickness, width, color, productType,
        unit || 'kg', description, img, JSON.stringify(applications || [])
      ]
    );
    let productId = productResult.insertId;

    // 4. Insert into seller_products (Seller Listing)
    await connection.query(
      `INSERT INTO seller_products 
       (product_id, seller_id, price_min, price_max, moq, stock_qty, stock, width, delivery_hours, payment_terms) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       price_min = VALUES(price_min), price_max = VALUES(price_max), moq = VALUES(moq), 
       stock_qty = VALUES(stock_qty), stock = VALUES(stock), delivery_hours = VALUES(delivery_hours)`,
      [
        productId, sellerId, minPrice, maxPrice, minOrder || 100, stock || 0,
        (stock > 0 ? 'Available' : 'Out of Stock'), width, parsedHours, payment_terms
      ]
    );

    // 5. Keep product_stocks in sync for legacy compatibility (Optional)
    await connection.query(
      `INSERT INTO product_stocks (product_id, quantity, min_order) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), min_order = VALUES(min_order)`,
      [productId, stock, minOrder]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Product added to Seller successfully",
      productId: productId
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in addProductForSeller:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const imageUrl = `/uploads/product_images/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Failed to upload image" });
  }
};

// 20. Add Seller by Admin (Auto-Verified)
export const addSellerAdmin = async (req, res) => {
  const { 
    ownerName, email, password, mobile, companyName, businessType,
    gstNumber, city, state, pincode, businessAddress, yearEstablished, description
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Validation
    if (!ownerName || !email || !password || !companyName) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // 2. Check if user already exists
    const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    // 3. Create User (Verified)
    const hashedPassword = await bcrypt.hash(password, 10);
    const [userResult] = await connection.query(
      "INSERT INTO users (name, email, mobile, password, role, is_verified) VALUES (?, ?, ?, ?, 'seller', 1)",
      [ownerName, email, mobile, hashedPassword]
    );
    const userId = userResult.insertId;

    // 4. Create Seller Profile
    const sellerUID = `PB-S-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const gstCertificate = req.file ? `/uploads/gst_certificates/${req.file.filename}` : null;
    
    // Get fresh coordinates for registration
    const coords = await getCoordinates(pincode, true); // SYNC with API for new seller
    
    // Handle businessType if it's an array
    const businessTypeString = Array.isArray(businessType) 
      ? businessType.join(", ") 
      : (typeof businessType === 'string' && businessType.startsWith('[') 
          ? JSON.parse(businessType).join(", ") 
          : businessType);

    await connection.query(
      `INSERT INTO sellers 
      (user_id, mobile, status, seller_uid, company_name, business_type, gst_number, gst_certificate, city, state, pincode, business_address, year_established, description, is_verified) 
      VALUES (?, ?, 'verified', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, mobile, sellerUID, companyName, businessTypeString, gstNumber, gstCertificate, coords?.city || city, coords?.state || state, pincode, businessAddress, yearEstablished || null, description || null]
    );

    await connection.commit();

    // 5. Send Welcome Email to Seller
    try {
      const subject = "Welcome to PackagingBazaar - Seller Account Created";
      const loginUrl = (process.env.FRONTEND_URL || "https://packagingbazaar.co.in") + "/login";
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
          <div style="background: #FF5722; padding: 20px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 24px;">Welcome to PackagingBazaar!</h1>
          </div>
          <div style="padding: 30px;">
            <p>Hello <strong>${ownerName}</strong>,</p>
            <p>Your seller account for <strong>${companyName}</strong> has been successfully created by the administrator.</p>
            
            <div style="background: #FFF3E0; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #FF5722;">
              <h3 style="margin-top: 0; color: #E64A19;">Your Login Credentials</h3>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
              <p style="font-size: 12px; color: #666; margin-top: 10px;">* Please change your password after your first login for security.</p>
            </div>

            <p>You can now log in to your seller dashboard to manage your products, track orders, and receive direct business leads.</p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${loginUrl}" style="background: #FF5722; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(255,87,34,0.2);">Login to Dashboard</a>
            </div>

            <p style="font-size: 14px; color: #777;">If you have any questions, feel free to reply to this email or contact our support team.</p>
          </div>
          <div style="background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} PackagingBazaar. All rights reserved.</p>
          </div>
        </div>
      `;
      
      await sendEmail(email, subject, `Welcome to PackagingBazaar! Your account has been created. Login with: ${email} / ${password}`, html);
    } catch (mailErr) {
      console.error("Failed to send welcome email:", mailErr);
    }

    res.status(201).json({ 
      success: true, 
      message: "Seller account created and verified successfully!",
      sellerUID
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in addSellerAdmin:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// 21. Update Seller Details by Admin
export const updateSellerDetailsAdmin = async (req, res) => {
  const { id } = req.params; // Expecting seller user_id
  const { 
    ownerName, email, mobile, companyName, businessType,
    gstNumber, city, state, pincode, businessAddress, yearEstablished, description
  } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update User Table
    if (ownerName || email || mobile) {
      await connection.query(
        "UPDATE users SET name = ?, email = ?, mobile = ? WHERE id = ?",
        [ownerName, email, mobile, id]
      );
    }

    // 2. Handle GST Certificate if uploaded
    let gstCertificate = req.body.existingGstCertificate || null;
    if (req.file) {
      // NEW: Delete old file if it exists and a new one is uploaded
      if (req.body.existingGstCertificate) {
        try {
          const oldPath = path.join(process.cwd(), req.body.existingGstCertificate);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (fsErr) {
          console.error("Failed to delete old GST certificate:", fsErr);
          // We continue anyway so the update isn't blocked by a file system error
        }
      }
      gstCertificate = `/uploads/gst_certificates/${req.file.filename}`;
    }

    // 3. Update Seller Table
    await connection.query(
      `UPDATE sellers SET 
        company_name = ?, 
        business_type = ?, 
        gst_number = ?, 
        gst_certificate = ?,
        city = ?, 
        state = ?, 
        pincode = ?, 
        business_address = ?,
        mobile = ?,
        year_established = ?,
        description = ?
      WHERE user_id = ?`,
      [companyName, businessType, gstNumber, gstCertificate, city, state, pincode, businessAddress, mobile, yearEstablished || null, description || null, id]
    );

    await connection.commit();
    res.status(200).json({ success: true, message: "Seller details updated successfully!" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in updateSellerDetailsAdmin:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

export const getInquiryAssignedSellers = async (req, res) => {
  const { id } = req.params;
  try {
    const [sellers] = await pool.query(
      `SELECT s.id, s.company_name, u.mobile as phone 
       FROM sellers s
       JOIN users u ON s.user_id = u.id
       JOIN lead_assignments la ON s.id = la.seller_id
       WHERE la.inquiry_id = ?`,
      [id]
    );
    res.status(200).json({ success: true, sellers });
  } catch (error) {
    console.error("Error in getInquiryAssignedSellers:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateInquiryStatus = async (req, res) => {
  const { id } = req.params;
  const { status, wonSellerId, lostReason, adminNotes } = req.body;
  try {
    await pool.query(
      `UPDATE inquiries SET 
        status = ?, 
        won_seller_id = ?, 
        lost_reason = ?, 
        admin_notes = COALESCE(?, admin_notes)
       WHERE id = ?`,
      [status, wonSellerId || null, lostReason || null, adminNotes || null, id]
    );
    res.status(200).json({ success: true, message: `Lead marked as ${status}` });
  } catch (error) {
    console.error("Error in updateInquiryStatus:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 24. Export Data to CSV
export const exportDataAdmin = async (req, res) => {
  const { entity } = req.params;
  try {
    let data = [];
    let filename = `export_${entity}_${new Date().toISOString().split('T')[0]}.csv`;

    if (entity === "leads" || entity === "inquiries") {
      const [rows] = await pool.query(`
        SELECT i.id as LeadID, i.created_at as Date, i.status as Status,
               COALESCE(u.name, i.buyer_name) as BuyerName,
               COALESCE(u.mobile, i.phone) as BuyerPhone,
               COALESCE(u.email, i.buyer_email) as BuyerEmail,
               p.name as Product, p.product_code as ProductCode,
               i.quantity_required as Qty, i.thickness, i.width,
               i.city, i.state, i.pincode, i.address,
               i.message as Requirements,
               COALESCE(
                 (SELECT GROUP_CONCAT(s2.company_name SEPARATOR ', ') 
                  FROM lead_assignments la 
                  JOIN sellers s2 ON la.seller_id = s2.id 
                  WHERE la.inquiry_id = i.id),
                 'Not Assigned'
               ) as AssignedToSellers,
               i.lost_reason as LostReason, i.admin_notes as AdminNotes
        FROM inquiries i
        LEFT JOIN users u ON i.buyer_id = u.id
        JOIN products p ON i.product_id = p.id
        LEFT JOIN sellers ws ON i.won_seller_id = ws.id
        ORDER BY i.id DESC
      `);
      data = rows;
    } else if (entity === "sellers") {
      const [rows] = await pool.query(`
        SELECT s.id as SellerID, s.seller_uid as SellerUID, s.company_name as Company, 
               u.name as Owner, u.email, s.mobile as Phone, s.gst_number as GST,
               s.business_type as BusinessType, s.year_established as EstYear,
               s.city, s.state, s.pincode, s.business_address as Address,
               s.description as Description, s.status as Status,
               u.is_verified as IsVerified, s.created_at as JoinedDate
        FROM sellers s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.id DESC
      `);
      data = rows;
    } else if (entity === "products") {
      const [rows] = await pool.query(`
        SELECT p.id as ProductID, p.name as ProductName, p.display_name as DisplayName,
               p.product_code as ProductCode, p.group_key as GroupKey,
               c.name as Category, sc.name as SubCategory,
               p.product_type as Type, p.thickness, 
               COALESCE(NULLIF(sp.width, ''), p.width) as Width, 
               p.color, p.unit,
               COALESCE(sp.price_min, p.min_price, 0) as PriceMin, 
               COALESCE(sp.price_max, p.max_price, 0) as PriceMax,
               COALESCE(sp.moq, 0) as MOQ,
               p.is_trending as Trending, p.is_hot_deal as HotDeal,
               COALESCE(NULLIF(p.delivery_time, ''), CONCAT(sp.delivery_hours, ' Hours')) as DeliveryTime, 
               s.id as SellerID, s.company_name as SellerName,
               p.applications as Applications
        FROM products p
        JOIN sub_categories sc ON p.sub_category_id = sc.id
        JOIN categories c ON sc.category_id = c.id
        LEFT JOIN seller_products sp ON p.id = sp.product_id
        LEFT JOIN sellers s ON COALESCE(sp.seller_id, p.seller_id) = s.id
        ORDER BY p.id DESC
      `);
      data = rows;
    } else if (entity === "inventory") {
      const [rows] = await pool.query(`
        SELECT sp.id as InventoryID, s.id as SellerID, s.company_name as Seller, s.seller_uid as SellerUID,
               p.name as Product, p.product_code as ProductCode,
               sp.price_min as MinPrice, sp.price_max as MaxPrice, 
               sp.stock_qty as Stock, sp.moq as MOQ,
               sp.delivery_hours as DeliveryHours, sp.status as ListingStatus,
               p.thickness, COALESCE(NULLIF(sp.width, ''), p.width) as Width, p.color, p.unit
        FROM seller_products sp
        JOIN sellers s ON sp.seller_id = s.id
        JOIN products p ON sp.product_id = p.id
        ORDER BY s.company_name ASC
      `);
      data = rows;
    } else {
      return res.status(400).json({ success: false, message: "Invalid entity" });
    }

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: "No data found to export" });
    }

    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        let val = row[header] === null ? "" : row[header];
        
        // Fix for Excel: If string has commas but no spaces, add spaces to prevent numeric misinterpretation
        if (typeof val === 'string' && val.includes(',') && !val.includes(', ')) {
          val = val.replace(/,/g, ', ');
        }

        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvString = csvRows.join("\n");

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvString);

  } catch (error) {
    console.error(`Error exporting ${entity}:`, error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 25. Bulk Upload Products via CSV + Images
export const bulkUploadProducts = async (req, res) => {
  const { sellerUserId } = req.params;
  const files = req.files;

  if (!files || !files.csvFile) {
    return res.status(400).json({ success: false, message: "CSV file is required" });
  }

  const csvPath = files.csvFile[0].path;
  const imageFiles = files.images || [];
  const results = [];
  let successCount = 0;
  let errorCount = 0;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get seller_id and verification status from user_id
    const [sellerRows] = await connection.query("SELECT id, is_verified FROM sellers WHERE user_id = ?", [sellerUserId]);
    if (sellerRows.length === 0) {
      return res.status(404).json({ success: false, message: "Seller profile not found" });
    }
    const { id: sellerId, is_verified } = sellerRows[0];

    // BLOCK if seller is not verified
    if (!is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: "Bulk Upload Blocked: This seller is not verified. Please approve the seller first." 
      });
    }

    // 2. Parse CSV
    const rows = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // 3. Process each row
    for (const row of rows) {
      try {
        const {
          Category, SubCategory, Tag, ProductName, DisplayName, 
          Thickness, Width, Color, ProductType, ProductCode, 
          Unit, MinPrice, MaxPrice, Stock, MOQ, DeliveryHours, 
          Description, ImageName, Applications
        } = row;

        if (!Category || !SubCategory || !ProductName) continue;

        // Resolve Category/Sub/Tag
        const catId = await resolveEntityId(connection, 'categories', 'name', Category);
        const subCatId = await resolveEntityId(connection, 'sub_categories', 'name', SubCategory, 'category_id', catId);
        const tagId = await resolveEntityId(connection, 'tags', 'tag_name', Tag);

        // Find matched image
        let finalImageUrl = null;
        if (ImageName) {
          const matchedImg = imageFiles.find(f => f.originalname === ImageName.trim());
          if (matchedImg) {
            // Move/Rename is handled by multer to product_images? 
            // Usually multer saves to a temp or specific dir. 
            // We need to ensure it's in the PUBLIC path.
            finalImageUrl = `/uploads/product_images/${matchedImg.filename}`;
          }
        }

        // group_key logic
        const catPart = Category ? Category.toString().toUpperCase().replace(/\s+/g, '_') : 'PRD';
        const colorPart = Color ? Color.toString().toUpperCase().replace(/\s+/g, '_') : 'NA';
        const thickPart = (Thickness || "X").toString().replace(/\s+/g, '');
        const typePart = (ProductType || Color || "NA").toString().substring(0, 3).toUpperCase();
        const groupKey = `${catPart}_${colorPart}_${thickPart}_${typePart}`;

        // Insert Master Product
        const [pResult] = await connection.query(
          `INSERT INTO products 
           (sub_category_id, tag_id, seller_id, name, display_name, group_key, product_code, thickness, width, color, product_type, unit, description, image_url, applications) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [subCatId, tagId || null, sellerId, ProductName, DisplayName || ProductName, groupKey, ProductCode || null, Thickness || null, Width || null, Color || null, ProductType || null, Unit || 'kg', Description || null, finalImageUrl, JSON.stringify(Applications ? Applications.split(',') : [])]
        );
        const productId = pResult.insertId;

        // Insert Seller Product
        await connection.query(
          `INSERT INTO seller_products 
           (product_id, seller_id, price_min, price_max, moq, stock_qty, stock, width, delivery_hours) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [productId, sellerId, parseFloat(MinPrice) || 0, parseFloat(MaxPrice) || 0, parseInt(MOQ) || 100, parseInt(Stock) || 0, (parseInt(Stock) > 0 ? 'Available' : 'Out of Stock'), Width || null, parseInt(DeliveryHours) || 24]
        );

        // Keep product_stocks in sync
        await connection.query(
          `INSERT INTO product_stocks (product_id, quantity, min_order) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), min_order = VALUES(min_order)`,
          [productId, parseInt(Stock) || 0, parseInt(MOQ) || 100]
        );

        successCount++;
      } catch (rowErr) {
        console.error("Error processing CSV row:", rowErr);
        errorCount++;
      }
    }

    await connection.commit();
    
    // Clean up CSV file (safe delete)
    try { fs.unlinkSync(csvPath); } catch (_) {}

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${successCount} success, ${errorCount} errors.`,
      summary: { success: successCount, errors: errorCount }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Bulk upload error:", error);
    res.status(500).json({ success: false, message: "Bulk upload failed" });
  } finally {
    if (connection) connection.release();
  }
};

