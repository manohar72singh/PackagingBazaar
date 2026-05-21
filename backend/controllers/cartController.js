import pool from "../config/db.js";

// 1. Get Cart Items
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
     const [rows] = await pool.query(
       `SELECT c.id as cart_id, c.product_id, c.seller_id, c.quantity, p.name, 
               COALESCE(sp.price_min, p.min_price) as price, 
               s.company_name as seller_name,
               p.description, p.image_url as image,
               p.thickness, p.width, p.unit, p.color,
               c.selected_thickness, c.selected_width, c.selected_brand,
               c.inquiry_quantity, c.specific_message
        FROM cart_items c 
        JOIN products p ON c.product_id = p.id 
        LEFT JOIN seller_products sp ON p.id = sp.product_id AND c.seller_id = sp.seller_id
        LEFT JOIN sellers s ON c.seller_id = s.id
        WHERE c.user_id = ?`,
       [userId]
     );
    res.status(200).json({ success: true, cart: rows });
  } catch (err) {
    console.error("Error in getCart:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 2. Add or Update Cart Item (Updated to support specific attributes)
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, sellerId, quantity, thickness, width, brand, inquiryQuantity, specificMessage } = req.body;

    if (!productId || !sellerId) return res.status(400).json({ success: false, message: "Product ID and Seller ID required" });

    // Check if item with SAME ATTRIBUTES already exists
    const [existing] = await pool.query(
      "SELECT id, quantity, inquiry_quantity, specific_message FROM cart_items WHERE user_id = ? AND product_id = ? AND seller_id = ? AND selected_thickness <=> ? AND selected_width <=> ? AND selected_brand <=> ?", 
      [userId, productId, sellerId, thickness || null, width || null, brand || null]
    );

    const safeQty = parseInt(quantity) || 1;

    if (existing.length > 0) {
      if (safeQty <= 0) {
        await pool.query("DELETE FROM cart_items WHERE id = ?", [existing[0].id]);
      } else {
        // If specificMessage is provided in request, update it; otherwise retain existing
        const finalMessage = specificMessage !== undefined ? specificMessage : existing[0].specific_message;
        await pool.query(
          "UPDATE cart_items SET quantity = ?, inquiry_quantity = ?, specific_message = ? WHERE id = ?", 
          [safeQty, inquiryQuantity || existing[0].inquiry_quantity || null, finalMessage || null, existing[0].id]
        );
      }
    } else if (safeQty > 0) {
      await pool.query(
        "INSERT INTO cart_items (user_id, product_id, seller_id, quantity, selected_thickness, selected_width, selected_brand, inquiry_quantity, specific_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
        [userId, productId, sellerId, safeQty, thickness || null, width || null, brand || null, inquiryQuantity || null, specificMessage || null]
      );
    }

    res.status(200).json({ success: true, message: "Cart updated" });
  } catch (err) {
    console.error("Error in addToCart:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Remove Item from Cart (Updated to handle ID specifically)
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.params; // Changed from productId to cartId to be specific

    await pool.query("DELETE FROM cart_items WHERE user_id = ? AND id = ?", [userId, cartId]);
    res.status(200).json({ success: true, message: "Item removed" });
  } catch (err) {
    console.error("Error in removeFromCart:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 4. Sync Guest Cart (Merge)
export const syncCart = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { localItems } = req.body; 

    if (!localItems || !Array.isArray(localItems)) return res.status(400).json({ success: false, message: "Invalid items" });

    for (const item of localItems) {
      const [exists] = await connection.query(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND seller_id = ? AND selected_thickness <=> ? AND selected_width <=> ? AND selected_brand <=> ?", 
        [userId, item.id, item.seller_id, item.thickness || null, item.width || null, item.brand || null]
      );
      
      if (exists.length > 0) {
        await connection.query(
          "UPDATE cart_items SET quantity = 1, inquiry_quantity = ?, specific_message = ? WHERE id = ?", 
          [item.inquiry_quantity || null, item.specific_message || null, exists[0].id]
        );
      } else {
        await connection.query(
          "INSERT INTO cart_items (user_id, product_id, seller_id, quantity, selected_thickness, selected_width, selected_brand, inquiry_quantity, specific_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
          [userId, item.id, item.seller_id, 1, item.thickness || null, item.width || null, item.brand || null, item.inquiry_quantity || null, item.specific_message || null]
        );
      }
    }

    await connection.commit();
    res.status(200).json({ success: true, message: "Cart synced successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Error in syncCart:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 5. Clear Entire Cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    res.status(200).json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("Error in clearCart:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
