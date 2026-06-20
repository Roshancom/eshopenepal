import { Router } from 'express';
import { getAllCustomers } from '../controllers/CustomerController.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', adminMiddleware, getAllCustomers);

export default router;
