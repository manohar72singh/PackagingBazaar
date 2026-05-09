import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'others';
    if (file.fieldname === 'gst_certificate') {
      folder = 'gst_certificates';
    } else if (file.fieldname === 'product_image' || file.fieldname === 'images') {
      folder = 'product_images';
    } else if (file.fieldname === 'csvFile') {
      folder = 'csv_uploads';
    }
    
    const dir = path.resolve(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    let prefix = 'file-';
    if (file.fieldname === 'product_image' || file.fieldname === 'images') prefix = 'prod-';
    else if (file.fieldname === 'gst_certificate') prefix = 'gst-';
    else if (file.fieldname === 'csvFile') prefix = 'csv-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - allows images, PDF, and CSV
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'text/csv',
    'application/vnd.ms-excel',
    'application/csv',
    'text/plain'  // some browsers send CSV as text/plain
  ];

  // Also allow by extension for CSV (browser mimetype can vary)
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || ext === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, PNG, and CSV are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB (increased for bulk CSV + images)
  }
});

export default upload;
