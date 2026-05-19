import pool from "../config/db.js";
import { validateMobile } from "../utils/validation.js";
import { getCoordinates } from "../utils/geoUtils.js";

// 1. Get Logged-in User Profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT id, name, email, mobile, role, is_verified, created_at FROM users WHERE id = ?", [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    res.status(200).json({ success: true, user: rows[0] });
  } catch (err) {
    console.error("Error in getUserProfile:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Update User Profile (Name & Mobile)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mobile } = req.body;

    if (!name) return res.status(400).json({ success: false, message: "Name is required" });
    if (mobile && !validateMobile(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number. Must be 10 digits." });
    }

    // Check Existing Mobile belonging to another user
    if (mobile) {
      const formattedMobile = String(mobile).trim();
      const [existingMobile] = await pool.query("SELECT id FROM users WHERE mobile = ? AND id != ?", [formattedMobile, userId]);
      if (existingMobile.length > 0) {
        return res.status(400).json({ success: false, message: "This mobile number is already registered to another account." });
      }
    }

    await pool.query("UPDATE users SET name = ?, mobile = ? WHERE id = ?", [name, mobile || null, userId]);

    res.status(200).json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Error in updateUserProfile:", err);
    if (err.code === "ER_DUP_ENTRY") {
      let dupMessage = "This information is already registered to another account.";
      const errStr = String(err.message || "").toLowerCase();
      if (errStr.includes("mobile")) {
        dupMessage = "This mobile number is already registered to another account.";
      }
      return res.status(400).json({ success: false, message: dupMessage });
    }
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Get All Addresses
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC", [userId]);

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("Error in getAddresses:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. Add New Address
export const addAddress = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { tag, address_line, city, state, pincode, is_default } = req.body;

    // If this is the first address, or is_default is true, unset others
    if (is_default) {
      await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const [result] = await connection.query(
      "INSERT INTO user_addresses (user_id, tag, address_line, city, state, pincode, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, tag || "Home", address_line, city, state, pincode, is_default ? 1 : 0]
    );

    await connection.commit();

    // Background update of coordinates to ensure DB accuracy
    if (pincode) {
      getCoordinates(pincode, true).catch(err => console.error("Error updating buyer coordinates:", err));
    }

    res.status(201).json({ success: true, message: "Address added successfully!", addressId: result.insertId });
  } catch (err) {
    await connection.rollback();
    console.error("Error in addAddress:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 5. Update Address
export const updateAddress = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { id } = req.params;
    const { tag, address_line, city, state, pincode, is_default } = req.body;

    if (is_default) {
      await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    }

    const [result] = await connection.query(
      "UPDATE user_addresses SET tag=?, address_line=?, city=?, state=?, pincode=?, is_default=? WHERE id=? AND user_id=?",
      [tag, address_line, city, state, pincode, is_default ? 1 : 0, id, userId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
    }

    await connection.commit();

    // Background update of coordinates
    if (pincode) {
      getCoordinates(pincode, true).catch(err => console.error("Error updating buyer coordinates:", err));
    }

    res.status(200).json({ success: true, message: "Address updated successfully!" });
  } catch (err) {
    await connection.rollback();
    console.error("Error in updateAddress:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 6. Delete Address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM user_addresses WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Address deleted successfully!" });
  } catch (err) {
    console.error("Error in deleteAddress:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 7. Set Default Address
export const setDefaultAddress = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { id } = req.params;

    await connection.query("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [userId]);
    const [result] = await connection.query("UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?", [id, userId]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Address not found or unauthorized" });
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Default address updated!" });
  } catch (err) {
    await connection.rollback();
    console.error("Error in setDefaultAddress:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};
