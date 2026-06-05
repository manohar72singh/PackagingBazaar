import pool from '../config/db.js';

export const generateSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'https://packagingbazaar.co.in';
    
    // Fetch active products
    const [products] = await pool.query(
      `SELECT slug, updated_at FROM products ORDER BY id DESC LIMIT 1000`
    );

    // Fetch published blogs
    const [blogs] = await pool.query(
      `SELECT slug, updated_at FROM blogs WHERE status = 'published' ORDER BY created_at DESC LIMIT 500`
    );

    // Static Routes
    const staticRoutes = [
      '',
      '/about',
      '/contact',
      '/policies',
      '/become-a-seller',
      '/products',
      '/blogs'
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static URLs
    staticRoutes.forEach(route => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Product URLs
    products.forEach(product => {
      const date = product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    });

    // Blog URLs
    blogs.forEach(blog => {
      const date = blog.updated_at ? new Date(blog.updated_at).toISOString() : new Date().toISOString();
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/blog/${blog.slug}</loc>\n`;
      xml += `    <lastmod>${date}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err) {
    console.error('generateSitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
};
