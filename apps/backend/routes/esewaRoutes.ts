import { Router } from 'express';
import {
  initiatePayment,
  paymentSuccess,
  paymentFailure,
  verifyPaymentManual,
  cleanupOrder,
} from '../controllers/esewaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Initiate eSewa payment (requires auth)
router.post('/initiate', authMiddleware, initiatePayment);

// eSewa callbacks (no auth — eSewa redirects here)
router.get('/success', paymentSuccess);
router.get('/failure', paymentFailure);

// Manual verification endpoint (requires auth)
router.post('/verify', authMiddleware, verifyPaymentManual);
router.post('/cleanup', authMiddleware, cleanupOrder);

export default router;
