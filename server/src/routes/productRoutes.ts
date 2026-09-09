import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getWarehouses,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { productCreateSchema, productUpdateSchema } from '../schemas/productSchema.js';

const router = Router();

router.use(authenticate);

// View catalog (All authenticated roles: Admin, Sales, Warehouse, Accounts)
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/warehouses', getWarehouses);
router.get('/:id', getProductById);

// Create product (Admin, Warehouse)
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(productCreateSchema), createProduct);

// Update product (Admin, Warehouse)
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(productUpdateSchema), updateProduct);

// Delete product (Admin only)
router.delete('/:id', authorizeRoles('ADMIN'), deleteProduct);

export default router;
