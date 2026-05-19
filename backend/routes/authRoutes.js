import { Router } from 'express';
import { register, login, getMe, googleLogin } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register',     register);
router.post('/login',        login);
router.post('/google-login', googleLogin);
router.get('/me',            protect, getMe);

export default router;
