import express from 'express';
import {
  getPublishedBlogs,
  getBlogBySlug,
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  toggleBlogStatus
} from '../controllers/blogController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.get('/', getPublishedBlogs);
router.get('/:slug', getBlogBySlug);

// ── Admin routes ────────────────────────────────────────────────────────────
router.get('/admin/all', verifyToken, isAdmin, getAllBlogsAdmin);
router.get('/admin/:id', verifyToken, isAdmin, getBlogById);
router.post('/admin', verifyToken, isAdmin, upload.single('cover_image'), createBlog);
router.put('/admin/:id', verifyToken, isAdmin, upload.single('cover_image'), updateBlog);
router.patch('/admin/:id/status', verifyToken, isAdmin, toggleBlogStatus);
router.delete('/admin/:id', verifyToken, isAdmin, deleteBlog);

export default router;
