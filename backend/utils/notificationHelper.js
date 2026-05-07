import pool from "../config/db.js";
import { getIO, getReceiverSocketId } from "../socket.js";
import { sendEmail } from "./mailHelper.js";

export const sendNotification = async ({ userId, userRole, title, message, type, link }) => {
  try {
    // 1. Save to Database
    const [result] = await pool.query(
      "INSERT INTO notifications (user_id, user_role, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, userRole, title, message, type, link]
    );

    // 2. Fetch User Email for Nodemailer (if not provided)
    const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
    const userEmail = userRows[0]?.email;

    // 3. Emit via Socket.io
    const io = getIO();
    const receiverSocketId = getReceiverSocketId(userId);
    
    const notificationData = {
      id: result.insertId,
      title,
      message,
      type,
      link,
      is_read: 0,
      created_at: new Date()
    };

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("new_notification", notificationData);
    }

    // 4. Send Email
    if (userEmail && !arguments[0].skipEmail) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #2563eb;">PackagingBazaar Update</h2>
          <p><strong>${title}</strong></p>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
          <p style="font-size: 12px; color: #777;">You received this because real-time notifications are enabled on your account.</p>
        </div>
      `;
      
      await sendEmail(userEmail, title, message, emailHtml);
    }

    return result.insertId;
  } catch (error) {
    console.error("Error in sendNotification:", error);
  }
};
