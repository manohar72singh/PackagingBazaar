import express from "express";
const router = express.Router();

import { 
  getSellerProfile, 
  getSellerProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  updateSellerProfile, 
  getSellerOrders,
  getSellerStats 
} from "../controllers/sellerController.js";
import { getSellerLeads, updateAssignmentStatus } from "../controllers/inquiryController.js";
import { verifyToken, isSeller } from "../middlewares/authMiddleware.js";

// All routes require authentication and seller role
router.get("/me", verifyToken, isSeller, getSellerProfile);
router.get("/stats", verifyToken, isSeller, getSellerStats);
router.get("/products", verifyToken, isSeller, getSellerProducts);
router.get("/orders", verifyToken, isSeller, getSellerOrders);
router.get("/leads", verifyToken, isSeller, getSellerLeads);
router.patch("/leads/:assignmentId/status", verifyToken, isSeller, updateAssignmentStatus);
router.post("/products", verifyToken, isSeller, createProduct);
router.put("/products/:id", verifyToken, isSeller, updateProduct);
router.delete("/products/:id", verifyToken, isSeller, deleteProduct);
router.put("/profile", verifyToken, isSeller, updateSellerProfile);

export default router;
