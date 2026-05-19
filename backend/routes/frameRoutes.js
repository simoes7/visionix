import { Router } from 'express';
import {
  getFrameStyles, createFrameStyle, updateFrameStyle, deleteFrameStyle,
  getMaterials, createMaterial, updateMaterial, deleteMaterial
} from '../controllers/frameController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Public reads
router.get('/frame-styles', getFrameStyles);
router.get('/materials', getMaterials);

// Admin CRUD
router.post('/frame-styles', protect, adminOnly, createFrameStyle);
router.put('/frame-styles/:id', protect, adminOnly, updateFrameStyle);
router.delete('/frame-styles/:id', protect, adminOnly, deleteFrameStyle);

router.post('/materials', protect, adminOnly, createMaterial);
router.put('/materials/:id', protect, adminOnly, updateMaterial);
router.delete('/materials/:id', protect, adminOnly, deleteMaterial);

export default router;
