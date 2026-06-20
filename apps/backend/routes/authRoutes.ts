import { Router } from 'express';
import {
  register,
  login,
  registerAdmin,
  adminLogin,
  googleLogin,
  getCurrentUser,
  logout
} from '../controllers/AuthController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', adminLogin);
router.post('/google', googleLogin);
router.get('/me', authMiddleware, getCurrentUser);
router.post('/logout', logout);

export default router;
