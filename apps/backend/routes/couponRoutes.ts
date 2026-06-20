import { Router } from 'express';
import {
  applyCoupon,
  createCoupon,
  getAllCoupons,
  toggleCoupon
} from '../controllers/CouponController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', adminMiddleware, getAllCoupons);
router.post('/apply', authMiddleware, applyCoupon);
router.post('/', adminMiddleware, createCoupon);
router.put('/:id/toggle', adminMiddleware, toggleCoupon);

export default router;
