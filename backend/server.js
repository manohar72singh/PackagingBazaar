import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import reviewRoutes from "./routes/reviewRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import inquiryRoutes from './routes/inquiryRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import sitemapRoutes from './routes/sitemapRoutes.js';

import { createServer } from 'http';
import { initSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Ensure upload directories exist
const folders = ['uploads/gst_certificates', 'uploads/product_images', 'uploads/product_pdfs', 'uploads/others', 'uploads/blog_images'];
folders.forEach(folder => {
  const dir = path.join(__dirname, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://packagingbazaar.co.in", 
  "http://localhost:5173", 
  "http://localhost:5000", 
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Explicitly serve static files with CORS headers for images
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
}, express.static(uploadsPath));

// Routes
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/blogs', blogRoutes);

// SEO Routes (Dynamic Sitemap)
app.use('/', sitemapRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));