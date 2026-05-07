import pool from "../config/db.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const showAll = req.query.all === 'true';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE user_id = ?";
    if (!showAll) {
      whereClause += " AND is_dismissed = 0";
    }

    const [rows] = await pool.query(
      `SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      [userId]
    );

    res.json({ 
      success: true, 
      notifications: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    if (notificationId === "all") {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
    } else {
      await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [
        notificationId,
        userId,
      ]);
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getUnreadCount = async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await pool.query(
        "SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = 0",
        [userId]
      );
      res.json({ success: true, unreadCount: rows[0].unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  };

export const broadcastNotification = async (req, res) => {
    try {
        const { title, message, role, type, link } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required" });
        }

        let query = "SELECT id, role FROM users WHERE is_verified = 1";
        const params = [];
        
        if (role && role !== 'all') {
            query += " AND role = ?";
            params.push(role);
        }

        const [users] = await pool.query(query, params);

        // Send immediate response to admin
        res.json({ 
            success: true, 
            message: `Broadcast started for ${users.length} users. It will be processed in the background.` 
        });

        // Run the actual broadcasting in the background (Non-blocking)
        (async () => {
            try {
                const { sendNotification } = await import("../utils/notificationHelper.js");
                const { includeEmail } = req.body;

                for (const user of users) {
                    await sendNotification({
                        userId: user.id,
                        userRole: user.role,
                        title,
                        message,
                        type: type || 'info',
                        link: link || '#',
                        skipEmail: !includeEmail // Logic to skip email if not requested
                    });
                    
                    // Small delay to prevent CPU spike
                    if (users.length > 50) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                console.log(`✅ Background broadcast finished for ${users.length} users.`);
            } catch (bgError) {
                console.error("Error in background broadcast:", bgError);
            }
        })();
    } catch (error) {
        console.error("Error broadcasting notification:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const dismissNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        await pool.query("UPDATE notifications SET is_dismissed = 1 WHERE user_id = ?", [userId]);
        res.json({ success: true, message: "Panel cleared" });
    } catch (error) {
        console.error("Error dismissing notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { ids } = req.body; // Expecting an array of IDs

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No IDs provided" });
        }

        await pool.query("DELETE FROM notifications WHERE user_id = ? AND id IN (?)", [userId, ids]);
        res.json({ success: true, message: "Notifications deleted" });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
