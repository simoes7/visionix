import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Publicly readable? Usually yes, but admin only to update
router.get('/', getSettings);
router.post('/', protect, adminOnly, updateSettings);

export default router;
