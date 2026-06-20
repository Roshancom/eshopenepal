import { Router } from 'express';
import {
  getBillingAddress,
  saveBillingAddress
} from '../controllers/BillingController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, getBillingAddress);
router.post('/', authMiddleware, saveBillingAddress);

export default router;
