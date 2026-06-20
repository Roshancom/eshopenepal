import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart
} from '../controllers/CartController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getCart);
router.post('/add', authMiddleware, addToCart);
router.put('/update', authMiddleware, updateCartQuantity);
router.delete('/remove/:id', authMiddleware, removeFromCart);

export default router;
