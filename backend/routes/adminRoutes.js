import { Router } from 'express';
import { 
  getDashboardStats, 
  getTopProducts, 
  getRecentOrders,
  getLowStockProducts,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = Router();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only high-fidelity image formats (JPEG, PNG, WEBP) are supported.'));
  }
});

// Helper to handle Multer specific errors
const uploadMiddleware = (req, res, next) => {
  const uploadArray = upload.array('images', 5);
  uploadArray(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Multer Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post('/upload', protect, adminOnly, uploadMiddleware, (req, res) => {
  console.log("Upload request received. Files:", req.files?.length);
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No visuals detected for synchronization.' });
  }
  
  try {
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    console.log("Synchronization successful:", imageUrls);
    res.json({ imageUrls });
  } catch (err) {
    console.error("Post-upload processing error:", err);
    res.status(500).json({ message: 'Error processing synchronized visuals.' });
  }
});

router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/top-products', protect, adminOnly, getTopProducts);
router.get('/recent-orders', protect, adminOnly, getRecentOrders);
router.get('/low-stock', protect, adminOnly, getLowStockProducts);

// User Management
router.get('/users', protect, adminOnly, getAllUsers);
router.post('/users', protect, adminOnly, createUser);
router.put('/users/:id', protect, adminOnly, updateUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);

export default router;
