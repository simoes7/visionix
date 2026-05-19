import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../controllers/productController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Public
router.get('/',           getAllProducts);
router.get('/categories', getCategories);
router.get('/:id',        getProductById);

// Admin only
router.post('/',    protect, adminOnly, createProduct);
router.put('/:id',  protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
