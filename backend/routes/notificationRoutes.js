import express from "express";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";
import { getNotifications, markAsRead, getUnreadCount, broadcastNotification, dismissNotifications, deleteNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.get("/unread-count", verifyToken, getUnreadCount);
router.put("/mark-as-read/:notificationId", verifyToken, markAsRead);
router.put("/dismiss-all", verifyToken, dismissNotifications);
router.delete("/bulk-delete", verifyToken, deleteNotifications);
router.post("/broadcast", verifyToken, isAdmin, broadcastNotification);

export default router;
