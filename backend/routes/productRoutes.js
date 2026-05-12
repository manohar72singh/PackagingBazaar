import express from "express";
const router = express.Router();

import {
  getAllProducts,
  getProductById,
  getProductVariants,
  getTopSellingProducts,
  getUniqueTopSelling,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getSubCategories,
  getTags,
  getApplications,
  getHotDeals,
  getUniqueProductNames,
  getSellersByGroupKey,
  getProductsBySellers, // NEW
  getProductGroups,
  createProductGroup,
  getTrendingProducts
} from "../controllers/productController.js";
import { verifyToken, isSeller, isAdmin } from "../middlewares/authMiddleware.js";

router.get("/categories", getCategories);
router.get("/sub-categories", getSubCategories);
router.get("/tags", getTags);
router.get("/applications", getApplications);
router.get("/product-groups", getProductGroups);
router.post("/product-groups", verifyToken, isAdmin, createProductGroup);

// Static product routes MUST come before dynamic :id routes
router.get("/products", getAllProducts);
router.get("/products/sellers-view", getProductsBySellers); // NEW
router.get("/products/top-selling", getTopSellingProducts);
router.get("/products/unique-top-selling", getUniqueTopSelling);
router.get("/products/hot-deals", getHotDeals);
router.get("/products/trending", getTrendingProducts);
router.get("/products/names", getUniqueProductNames);
router.get("/products/group/:groupKey/sellers", getSellersByGroupKey); // FIXED: moved before /:id

// Dynamic routes (must be LAST)
router.get("/products/:id", getProductById);
router.get("/products/:id/variants", getProductVariants);

// Protected Routes (Admin only for Adding, Seller/Admin for Update/Delete)
router.post("/products/add", verifyToken, isAdmin, addProduct);
router.put("/products/update/:id", verifyToken, isSeller, updateProduct);
router.delete("/products/delete/:id", verifyToken, isSeller, deleteProduct);

export default router;
