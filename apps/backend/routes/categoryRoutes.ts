import { Router } from 'express';
import {
  getAllCategories,
  createCategory,
  deleteCategory
} from '../controllers/CategoryController.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllCategories);
router.post('/', adminMiddleware, createCategory);
router.delete('/:id', adminMiddleware, deleteCategory);

export default router;
