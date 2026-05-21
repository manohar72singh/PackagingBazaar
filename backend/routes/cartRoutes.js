import express from "express";
const router = express.Router();

import { getCart, addToCart, removeFromCart, syncCart, clearCart } from "../controllers/cartController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

// Cart management
router.get("/", verifyToken, getCart);
router.post("/", verifyToken, addToCart);
router.delete("/clear", verifyToken, clearCart);
router.delete("/:cartId", verifyToken, removeFromCart);
router.post("/sync", verifyToken, syncCart);

export default router;
