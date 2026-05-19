import pool from '../config/db.js';
import path from 'path';

// Helper: generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

// GET all published blogs
export const getPublishedBlogs = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image, image_type, author, category, tags, created_at
       FROM blogs WHERE status = 'published' ORDER BY created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getPublishedBlogs error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET single blog by slug
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM blogs WHERE slug = ? AND status = 'published'`,
      [slug]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getBlogBySlug error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET all blogs (admin — includes drafts)
export const getAllBlogsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, excerpt, cover_image, image_type, author, category, status, created_at
       FROM blogs ORDER BY id ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getAllBlogsAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST create blog
export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, author, category, tags, status, image_url, meta_title, meta_description, meta_keywords, custom_slug } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Determine cover image
    let cover_image = null;
    let image_type = 'url';

    if (req.file) {
      // Uploaded file
      cover_image = `uploads/blog_images/${req.file.filename}`;
      image_type = 'upload';
    } else if (image_url) {
      cover_image = image_url;
      image_type = 'url';
    }

    // Generate unique slug (allow custom_slug override)
    let slug = custom_slug ? generateSlug(custom_slug) : generateSlug(title);
    const [existing] = await pool.query('SELECT id FROM blogs WHERE slug = ?', [slug]);
    if (existing.length) {
      slug = `${slug}-${Date.now()}`;
    }

    const [result] = await pool.query(
      `INSERT INTO blogs (title, slug, excerpt, content, cover_image, image_type, author, category, tags, meta_title, meta_description, meta_keywords, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, excerpt || '', content, cover_image, image_type,
       author || 'PackagingBazaar Team', category || 'General', tags || '', 
       meta_title || null, meta_description || null, meta_keywords || null, status || 'draft']
    );

    res.status(201).json({ success: true, message: 'Blog created', id: result.insertId, slug });
  } catch (err) {
    console.error('createBlog error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, excerpt, content, author, category, tags, status, image_url, meta_title, meta_description, meta_keywords, custom_slug } = req.body;

    const [existing] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Blog not found' });

    let cover_image = existing[0].cover_image;
    let image_type = existing[0].image_type;

    if (req.file) {
      cover_image = `uploads/blog_images/${req.file.filename}`;
      image_type = 'upload';
    } else if (image_url !== undefined && image_url !== '') {
      cover_image = image_url;
      image_type = 'url';
    }

    // Regenerate slug if title or custom_slug changed
    let slug = existing[0].slug;
    if (custom_slug && custom_slug !== existing[0].slug) {
      slug = generateSlug(custom_slug);
      const [dup] = await pool.query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [slug, id]);
      if (dup.length) slug = `${slug}-${Date.now()}`;
    } else if (title && title !== existing[0].title && !custom_slug) {
      slug = generateSlug(title);
      const [dup] = await pool.query('SELECT id FROM blogs WHERE slug = ? AND id != ?', [slug, id]);
      if (dup.length) slug = `${slug}-${Date.now()}`;
    }

    await pool.query(
      `UPDATE blogs SET title=?, slug=?, excerpt=?, content=?, cover_image=?, image_type=?, author=?, category=?, tags=?, meta_title=?, meta_description=?, meta_keywords=?, status=?, updated_at=NOW()
       WHERE id=?`,
      [title, slug, excerpt || '', content, cover_image, image_type,
       author || 'PackagingBazaar Team', category || 'General', tags || '', 
       meta_title || null, meta_description || null, meta_keywords || null, status || 'draft', id]
    );

    res.json({ success: true, message: 'Blog updated', slug });
  } catch (err) {
    console.error('updateBlog error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id FROM blogs WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blog not found' });
    await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) {
    console.error('deleteBlog error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Toggle blog status (Published <-> Draft)
export const toggleBlogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT status FROM blogs WHERE id = ?', [id]);
    
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blog not found' });
    
    const currentStatus = rows[0].status;
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    
    await pool.query('UPDATE blogs SET status = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);
    
    res.json({ success: true, message: `Blog status changed to ${newStatus}`, newStatus });
  } catch (err) {
    console.error('toggleBlogStatus error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET single blog by ID (for admin edit form)
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM blogs WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getBlogById error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
