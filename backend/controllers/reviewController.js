// import pool from '../config/db.js';
// import crypto from 'crypto';

// // 1. Get Review
// export const getAllReviews = async (req, res) => {
//     const { product_id, status } = req.query;
//     try {
//         let sql = `
//             SELECT
//                 pr.id,
//                 pr.rating,
//                 pr.comment,
//                 pr.status,
//                 pr.reviewer_name,
//                 pr.created_at,
//                 u.name AS user_name,
//                 p.name AS product_name
//             FROM product_reviews pr
//             LEFT JOIN users u ON pr.user_id = u.id
//             JOIN products p ON pr.product_id = p.id
//         `;
//         let params = [];
//         let conditions = [];

//         if (product_id) {
//             conditions.push('pr.product_id = ?');
//             params.push(product_id);
//         }

//         if (status) {
//             conditions.push('pr.status = ?');
//             params.push(status);
//         }

//         if (conditions.length > 0) {
//             sql += ' WHERE ' + conditions.join(' AND ');
//         }

//         sql += ' ORDER BY pr.created_at DESC';

//         const [rows] = await pool.query(sql, params);
//         res.status(200).json(rows);
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 2. New Review POST
// export const addReview = async (req, res) => {
//     const { product_id, rating, comment } = req.body;
//     const user_id = req.user.id;

//     // Basic Validation
//     if (!product_id || !rating) {
//         return res.status(400).json({ message: "Product aur Rating fields zaroori hain!" });
//     }

//     try {
//         // Fetch user's name from database to ensure high integrity
//         const [userRows] = await pool.query("SELECT name FROM users WHERE id = ?", [user_id]);
//         const reviewer_name = userRows.length > 0 ? userRows[0].name : "Verified Buyer";

//         const sql = 'INSERT INTO product_reviews (product_id, user_id, reviewer_name, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?)';
//         const [result] = await pool.query(sql, [
//             product_id,
//             user_id,
//             reviewer_name,
//             rating,
//             comment || '',
//             'approved' // Default accepted/approved instantly
//         ]);

//         res.status(201).json({
//             success: true,
//             message: "Review successfully add ho gaya!",
//             reviewId: result.insertId
//         });
//     } catch (error) {
//         console.error("Review Error:", error);
//         res.status(500).json({ success: false, message: "Server error. Please try again." });
//     }
// };

// // 3. Review DELETE
// export const deleteReview = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const [result] = await pool.query('DELETE FROM product_reviews WHERE id = ?', [id]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "Review nahi mila!" });
//         }

//         res.status(200).json({ success: true, message: "Review delete kar diya gaya." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 4. Update Review Status (Approve/Pending)
// export const updateReviewStatus = async (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body;
//     try {
//         const [result] = await pool.query('UPDATE product_reviews SET status = ? WHERE id = ?', [status, id]);

//         if (result.affectedRows === 0) {
//             return res.status(404).json({ message: "Review nahi mila!" });
//         }

//         res.status(200).json({ success: true, message: `Review status updated to ${status}.` });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // ── BRAND NEW: SITE REVIEWS & TOKEN SECURITY CONTROLLERS ──

// // 5. Get Approved Site Reviews (Public)
// export const getSiteReviews = async (req, res) => {
//     try {
//         const [rows] = await pool.query("SELECT * FROM site_reviews WHERE status = 'approved' ORDER BY created_at DESC");
//         res.status(200).json(rows);
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 6. Get All Site Reviews (Admin)
// export const getAdminSiteReviews = async (req, res) => {
//     try {
//         const [rows] = await pool.query("SELECT * FROM site_reviews ORDER BY created_at DESC");
//         res.status(200).json(rows);
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 7. Verify Review Token (Public)
// export const verifySiteReviewToken = async (req, res) => {
//     const { token } = req.query;
//     if (!token) {
//         return res.status(400).json({ success: false, valid: false, message: "Token missing!" });
//     }
//     try {
//         const [rows] = await pool.query("SELECT * FROM review_tokens WHERE token = ?", [token]);
//         if (rows.length === 0) {
//             return res.status(400).json({ success: false, valid: false, message: "Invalid Review Link!" });
//         }
//         if (rows[0].is_used === 1) {
//             return res.status(400).json({ success: false, valid: false, message: "Review link has already been used!" });
//         }
//         res.status(200).json({ success: true, valid: true, message: "Valid review link!" });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 8. Submit Site Review & Burn Token (Public)
// export const addSiteReview = async (req, res) => {
//     const { token, reviewer_name, company_name, designation, rating, comment } = req.body;

//     if (!reviewer_name || !rating || !comment) {
//         return res.status(400).json({ success: false, message: "Name, Rating and Comment are required!" });
//     }

//     try {
//         // If a token is provided, verify it first!
//         if (token) {
//             const [tokenRows] = await pool.query("SELECT * FROM review_tokens WHERE token = ?", [token]);
//             if (tokenRows.length === 0) {
//                 return res.status(400).json({ success: false, message: "Invalid Review Link!" });
//             }
//             if (tokenRows[0].is_used === 1) {
//                 return res.status(400).json({ success: false, message: "Review link has already been used!" });
//             }
//         }

//         // Insert into site_reviews (status = 'approved' by default)
//         const sql = `
//             INSERT INTO site_reviews (reviewer_name, company_name, designation, rating, comment, status)
//             VALUES (?, ?, ?, ?, ?, 'approved')
//         `;
//         const [result] = await pool.query(sql, [
//             reviewer_name,
//             company_name || null,
//             designation || null,
//             rating,
//             comment
//         ]);

//         // Burn the token if it was provided
//         if (token) {
//             await pool.query("UPDATE review_tokens SET is_used = 1 WHERE token = ?", [token]);
//         }

//         res.status(201).json({
//             success: true,
//             message: "Review successfully submitted! Thank you!",
//             reviewId: result.insertId
//         });
//     } catch (error) {
//         console.error("Site Review Error:", error);
//         res.status(500).json({ success: false, message: "Server error. Please try again." });
//     }
// };

// // 9. Generate One-Time Review Token (Admin Only)
// export const generateReviewToken = async (req, res) => {
//     try {
//         const token = crypto.randomBytes(16).toString('hex');
//         await pool.query("INSERT INTO review_tokens (token) VALUES (?)", [token]);
//         res.status(201).json({
//             success: true,
//             message: "Review token generated successfully!",
//             token: token
//         });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 10. List All Generated Review Tokens (Admin Only)
// export const getReviewTokens = async (req, res) => {
//     try {
//         const [rows] = await pool.query("SELECT * FROM review_tokens ORDER BY created_at DESC");
//         res.status(200).json(rows);
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 11. Update Site Review Status (Admin Only)
// export const updateSiteReviewStatus = async (req, res) => {
//     const { id } = req.params;
//     const { status } = req.body;
//     try {
//         const [result] = await pool.query("UPDATE site_reviews SET status = ? WHERE id = ?", [status, id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: "Site review not found!" });
//         }
//         res.status(200).json({ success: true, message: `Review status updated to ${status}.` });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

// // 12. Delete Site Review (Admin Only)
// export const deleteSiteReview = async (req, res) => {
//     const { id } = req.params;
//     try {
//         const [result] = await pool.query("DELETE FROM site_reviews WHERE id = ?", [id]);
//         if (result.affectedRows === 0) {
//             return res.status(404).json({ success: false, message: "Site review not found!" });
//         }
//         res.status(200).json({ success: true, message: "Site review successfully deleted." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

import pool from "../config/db.js";
import crypto from "crypto";

// 1. Get Review
export const getAllReviews = async (req, res) => {
  const { product_id, status } = req.query;
  try {
    let sql = `
            SELECT 
                pr.id, 
                pr.rating, 
                pr.comment, 
                pr.status,
                pr.reviewer_name,
                pr.created_at,
                u.name AS user_name,
                p.name AS product_name
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.id
            JOIN products p ON pr.product_id = p.id
        `;
    let params = [];
    let conditions = [];

    if (product_id) {
      conditions.push("pr.product_id = ?");
      params.push(product_id);
    }

    if (status) {
      conditions.push("pr.status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY pr.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. New Review POST
export const addReview = async (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_id = req.user.id;

  // Basic Validation
  if (!product_id || !rating) {
    return res
      .status(400)
      .json({ message: "Product aur Rating fields zaroori hain!" });
  }

  try {
    // Fetch user's name from database to ensure high integrity
    const [userRows] = await pool.query("SELECT name FROM users WHERE id = ?", [
      user_id,
    ]);
    const reviewer_name =
      userRows.length > 0 ? userRows[0].name : "Verified Buyer";

    const sql =
      "INSERT INTO product_reviews (product_id, user_id, reviewer_name, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?)";
    const [result] = await pool.query(sql, [
      product_id,
      user_id,
      reviewer_name,
      rating,
      comment || "",
      "approved", // Default accepted/approved instantly
    ]);

    res.status(201).json({
      success: true,
      message: "Review successfully add ho gaya!",
      reviewId: result.insertId,
    });
  } catch (error) {
    console.error("Review Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

// 3. Review DELETE
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM product_reviews WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Review nahi mila!" });
    }

    res
      .status(200)
      .json({ success: true, message: "Review delete kar diya gaya." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update Review Status (Approve/Pending)
export const updateReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE product_reviews SET status = ? WHERE id = ?",
      [status, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Review nahi mila!" });
    }

    res
      .status(200)
      .json({ success: true, message: `Review status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── BRAND NEW: SITE REVIEWS & TOKEN SECURITY CONTROLLERS ──

// 5. Get Approved Site Reviews (Public)
export const getSiteReviews = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM site_reviews WHERE status = 'approved' ORDER BY created_at DESC",
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get All Site Reviews (Admin)
export const getAdminSiteReviews = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM site_reviews ORDER BY created_at DESC",
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Verify Review Token (Public)
export const verifySiteReviewToken = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, valid: false, message: "Token missing!" });
  }
  try {
    const [rows] = await pool.query(
      "SELECT * FROM review_tokens WHERE token = ?",
      [token],
    );
    if (rows.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          valid: false,
          message: "Invalid Review Link!",
        });
    }
    if (rows[0].is_used === 1) {
      return res
        .status(400)
        .json({
          success: false,
          valid: false,
          message: "Review link has already been used!",
        });
    }
    res
      .status(200)
      .json({ success: true, valid: true, message: "Valid review link!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Submit Site Review & Burn Token (Public)
export const addSiteReview = async (req, res) => {
  const { token, reviewer_name, company_name, designation, rating, comment } =
    req.body;

  if (!reviewer_name || !rating || !comment) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Name, Rating and Comment are required!",
      });
  }

  try {
    // If a token is provided, verify it first!
    if (token) {
      const [tokenRows] = await pool.query(
        "SELECT * FROM review_tokens WHERE token = ?",
        [token],
      );
      if (tokenRows.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Review Link!" });
      }
      if (tokenRows[0].is_used === 1) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Review link has already been used!",
          });
      }
    }

    // Insert into site_reviews (status = 'approved' by default)
    const sql = `
            INSERT INTO site_reviews (reviewer_name, company_name, designation, rating, comment, status) 
            VALUES (?, ?, ?, ?, ?, 'approved')
        `;
    const [result] = await pool.query(sql, [
      reviewer_name,
      company_name || null,
      designation || null,
      rating,
      comment,
    ]);

    // Burn the token if it was provided
    if (token) {
      await pool.query("UPDATE review_tokens SET is_used = 1 WHERE token = ?", [
        token,
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Review successfully submitted! Thank you!",
      reviewId: result.insertId,
    });
  } catch (error) {
    console.error("Site Review Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
};

// 9. Generate One-Time Review Token (Admin Only)
export const generateReviewToken = async (req, res) => {
  try {
    const token = crypto.randomBytes(16).toString("hex");
    await pool.query("INSERT INTO review_tokens (token) VALUES (?)", [token]);
    res.status(201).json({
      success: true,
      message: "Review token generated successfully!",
      token: token,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. List All Generated Review Tokens (Admin Only)
export const getReviewTokens = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM review_tokens ORDER BY created_at DESC",
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Update Site Review Status (Admin Only)
export const updateSiteReviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE site_reviews SET status = ? WHERE id = ?",
      [status, id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Site review not found!" });
    }
    res
      .status(200)
      .json({ success: true, message: `Review status updated to ${status}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Delete Site Review (Admin Only)
export const deleteSiteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM site_reviews WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Site review not found!" });
    }
    res
      .status(200)
      .json({ success: true, message: "Site review successfully deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
