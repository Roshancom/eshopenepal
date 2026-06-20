import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus
} from '../controllers/OrderController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/place', authMiddleware, placeOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/', adminMiddleware, getAllOrders);
router.get('/:id', authMiddleware, getOrderDetails);
router.put('/:id/status', adminMiddleware, updateOrderStatus);

export default router;
