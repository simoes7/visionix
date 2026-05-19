import express from 'express';
import { getPageContent, updatePageContent } from '../controllers/contentController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:pageName', getPageContent);
router.post('/:pageName', protect, adminOnly, updatePageContent);

export default router;
