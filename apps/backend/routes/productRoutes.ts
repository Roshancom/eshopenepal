import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/ProductController.js';
import { adminMiddleware } from '../middleware/auth.js';
import { resolveBackendDir } from '../src/utils/paths.js';

const router = Router();

const uploadsDir = resolveBackendDir('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

// FIXED: Validate file type and size — reject non-image uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed (max 5MB)'));
    }
  }
});

// Multer error handler middleware
function handleUploadError(err: any, _req: any, res: any, next: any) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
}

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/', adminMiddleware, upload.single('image'), handleUploadError, createProduct);
router.put('/:id', adminMiddleware, upload.single('image'), handleUploadError, updateProduct);
router.delete('/:id', adminMiddleware, deleteProduct);

export default router;
