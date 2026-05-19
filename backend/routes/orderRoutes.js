import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Customer
router.post('/',     protect, createOrder);
router.get('/mine',  protect, getMyOrders);
router.get('/:id',   protect, getOrderById);

// Admin
router.get('/',            protect, adminOnly, getAllOrders);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

export default router;
