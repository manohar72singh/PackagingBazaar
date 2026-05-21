import pool from "../config/db.js";
import { sendNotification } from "../utils/notificationHelper.js";

// 1. Checkout (Create Order)
export const checkout = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = req.user.id;
    const { addressId, paymentMethod, items, totalPrice } = req.body;

    if (!addressId || !items || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Incomplete checkout data" });
    }

    // Create Order
    const [orderResult] = await connection.query(
      "INSERT INTO orders (user_id, address_id, total_price, payment_method, status) VALUES (?, ?, ?, ?, 'Pending')",
      [userId, addressId, totalPrice, paymentMethod || "COD"]
    );
    const orderId = orderResult.insertId;

    // Track unique sellers to notify
    const sellerIdsToNotify = new Set();

    // Create Order Items with Specifications
     for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, seller_id, quantity, price_at_time, thickness, width, brand, specific_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.seller_id, item.quantity, item.price, item.thickness || null, item.width || null, item.brand || null, item.specific_message || item.specificMessage || null]
      );
      if (item.seller_id) sellerIdsToNotify.add(item.seller_id);
    }
    // Clear user cart after successful checkout
    await connection.query("DELETE FROM cart_items WHERE user_id = ?", [userId]);

    await connection.commit();

    // Notify Sellers (after commit to be safe)
    try {
      for (const sellerId of sellerIdsToNotify) {
        const [sellerUserRows] = await pool.query("SELECT user_id FROM sellers WHERE id = ?", [sellerId]);
        if (sellerUserRows.length > 0) {
          await sendNotification({
            userId: sellerUserRows[0].user_id,
            userRole: 'seller',
            title: 'New Order Received!',
            message: `Congratulations! You have received a new order #${orderId}. Check your dashboard for details.`,
            type: 'order',
            link: '/seller/orders'
          });
        }
      }
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    res.status(201).json({ success: true, message: "Order placed successfully!", orderId });
  } catch (err) {
    await connection.rollback();
    console.error("Error in checkout:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    connection.release();
  }
};

// 2. Get Order History (User)
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT o.*, 
       (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'name', p.name, 
            'qty', oi.quantity, 
            'price', oi.price_at_time,
            'thickness', oi.thickness,
            'width', oi.width,
            'brand', oi.brand,
            'specific_message', oi.specific_message,
            'seller_id', oi.seller_id
          )
        ) 
        FROM order_items oi 
        JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = o.id) as items
       FROM orders o 
       WHERE o.user_id = ? 
       ORDER BY o.order_date DESC`,
      [userId]
    );
    res.status(200).json({ success: true, orders: rows });
  } catch (err) {
    console.error("Error in getMyOrders:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// 3. Update Order Status (Admin/Seller)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Notify Buyer
    try {
      const [orderRows] = await pool.query("SELECT user_id FROM orders WHERE id = ?", [id]);
      if (orderRows.length > 0) {
        await sendNotification({
          userId: orderRows[0].user_id,
          userRole: 'user',
          title: 'Order Status Updated',
          message: `Your order #${id} status has been updated to: ${status}.`,
          type: 'order',
          link: '/my-orders'
        });
      }
    } catch (notifErr) {
      console.error("Notification Error:", notifErr);
    }

    res.status(200).json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) {
    console.error("Error in updateOrderStatus:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
