import { Router } from 'express';
import {
  getSalesReport,
  getTopProducts
} from '../controllers/ReportController.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/sales', adminMiddleware, getSalesReport);
router.get('/top-products', adminMiddleware, getTopProducts);

export default router;
