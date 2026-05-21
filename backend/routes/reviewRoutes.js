// import express from 'express';
// import {
//     getAllReviews,
//     addReview,
//     deleteReview,
//     updateReviewStatus,
//     getSiteReviews,
//     getAdminSiteReviews,
//     verifySiteReviewToken,
//     addSiteReview,
//     generateReviewToken,
//     getReviewTokens,
//     updateSiteReviewStatus as updateSiteReviewStatusController,
//     deleteSiteReview
// } from '../controllers/reviewController.js';
// import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

// const router = express.Router();

// // ── PRODUCT REVIEWS ROUTES ──
// // Route: GET /api/reviews?product_id=1
// router.get('/', getAllReviews);

// // Route: POST /api/reviews/add
// router.post('/add', verifyToken, addReview);

// // Route: DELETE /api/reviews/:id
// router.delete('/:id', verifyToken, isAdmin, deleteReview);

// // Route: PUT /api/reviews/:id/status
// router.put('/:id/status', verifyToken, isAdmin, updateReviewStatus);

// // ── SITE REVIEWS & TOKENS ROUTES ──
// // Route: GET /api/reviews/site (Public - Get approved site reviews)
// router.get('/site', getSiteReviews);

// // Route: GET /api/reviews/site/verify-token?token=... (Public - Verify review token)
// router.get('/site/verify-token', verifySiteReviewToken);

// // Route: POST /api/reviews/site/add (Public - Submit site review & burn token)
// router.post('/site/add', addSiteReview);

// // Route: GET /api/reviews/site/admin (Admin - Get all site reviews)
// router.get('/site/admin', verifyToken, isAdmin, getAdminSiteReviews);

// // Route: POST /api/reviews/site/generate-token (Admin - Generate invite token)
// router.post('/site/generate-token', verifyToken, isAdmin, generateReviewToken);

// // Route: GET /api/reviews/site/tokens (Admin - Get generated tokens)
// router.get('/site/tokens', verifyToken, isAdmin, getReviewTokens);

// // Route: PUT /api/reviews/site/:id/status (Admin - Toggle status of site review)
// router.put('/site/:id/status', verifyToken, isAdmin, updateSiteReviewStatusController);

// // Route: DELETE /api/reviews/site/:id (Admin - Delete site review)
// router.delete('/site/:id', verifyToken, isAdmin, deleteSiteReview);

// export default router;

import express from "express";
import {
  getAllReviews,
  addReview,
  deleteReview,
  updateReviewStatus,
  getSiteReviews,
  getAdminSiteReviews,
  verifySiteReviewToken,
  addSiteReview,
  generateReviewToken,
  getReviewTokens,
  updateSiteReviewStatus as updateSiteReviewStatusController,
  deleteSiteReview,
} from "../controllers/reviewController.js";
import { verifyToken, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ── PRODUCT REVIEWS ROUTES ──
// Route: GET /api/reviews?product_id=1
router.get("/", getAllReviews);

// Route: POST /api/reviews/add
router.post("/add", verifyToken, addReview);

// Route: DELETE /api/reviews/:id
router.delete("/:id", verifyToken, isAdmin, deleteReview);

// Route: PUT /api/reviews/:id/status
router.put("/:id/status", verifyToken, isAdmin, updateReviewStatus);

// ── SITE REVIEWS & TOKENS ROUTES ──
// Route: GET /api/reviews/site (Public - Get approved site reviews)
router.get("/site", getSiteReviews);

// Route: GET /api/reviews/site/verify-token?token=... (Public - Verify review token)
router.get("/site/verify-token", verifySiteReviewToken);

// Route: POST /api/reviews/site/add (Public - Submit site review & burn token)
router.post("/site/add", addSiteReview);

// Route: GET /api/reviews/site/admin (Admin - Get all site reviews)
router.get("/site/admin", verifyToken, isAdmin, getAdminSiteReviews);

// Route: POST /api/reviews/site/generate-token (Admin - Generate invite token)
router.post("/site/generate-token", verifyToken, isAdmin, generateReviewToken);

// Route: GET /api/reviews/site/tokens (Admin - Get generated tokens)
router.get("/site/tokens", verifyToken, isAdmin, getReviewTokens);

// Route: PUT /api/reviews/site/:id/status (Admin - Toggle status of site review)
router.put(
  "/site/:id/status",
  verifyToken,
  isAdmin,
  updateSiteReviewStatusController,
);

// Route: DELETE /api/reviews/site/:id (Admin - Delete site review)
router.delete("/site/:id", verifyToken, isAdmin, deleteSiteReview);

export default router;
