import pool from "../config/db.js";
import { getIO, getReceiverSocketId } from "../socket.js";
import { sendEmail } from "./mailHelper.js";

export const sendNotification = async ({ userId, userRole, title, message, type, link }) => {
  try {
    // 1. Check if an unread notification of the same type already exists for this user
    const [existing] = await pool.query(
      "SELECT id, notification_count FROM notifications WHERE user_id = ? AND type = ? AND is_read = 0 AND is_dismissed = 0 LIMIT 1",
      [userId, type]
    );

    let notificationId;
    let finalTitle = title;
    let finalMessage = message;
    let finalCount = 1;

    if (existing.length > 0) {
      notificationId = existing[0].id;
      finalCount = (existing[0].notification_count || 1) + 1;

      // Customize grouping messages for common types
      if (type === 'registration') {
        finalTitle = `${finalCount} New Seller Registrations`;
        finalMessage = `There are ${finalCount} new seller registrations pending approval.`;
      } else if (type === 'lead') {
        finalTitle = `${finalCount} New Leads Received`;
        finalMessage = `You have received ${finalCount} new business leads.`;
      } else {
        // Fallback for other types
        finalTitle = `${finalCount} Notifications: ${title}`;
      }

      await pool.query(
        "UPDATE notifications SET title = ?, message = ?, notification_count = ?, created_at = NOW() WHERE id = ?",
        [finalTitle, finalMessage, finalCount, notificationId]
      );
    } else {
      // Create new notification
      const [result] = await pool.query(
        "INSERT INTO notifications (user_id, user_role, title, message, type, link, notification_count) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [userId, userRole, title, message, type, link, 1]
      );
      notificationId = result.insertId;
    }

    // 2. Fetch User Email for Nodemailer (if not provided)
    const [userRows] = await pool.query("SELECT email FROM users WHERE id = ?", [userId]);
    const userEmail = userRows[0]?.email;

    // 3. Emit via Socket.io
    const io = getIO();
    const receiverSocketId = getReceiverSocketId(userId);
    
    const notificationData = {
      id: notificationId,
      title: finalTitle,
      message: finalMessage,
      type,
      link,
      notification_count: finalCount,
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
