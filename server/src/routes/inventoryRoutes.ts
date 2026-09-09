import { Router } from 'express';
import { getStockMovements, adjustStock } from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { stockAdjustmentSchema } from '../schemas/inventorySchema.js';

const router = Router();

router.use(authenticate);

// View movements (Admin, Warehouse, Accounts)
router.get('/movements', authorizeRoles('ADMIN', 'WAREHOUSE', 'ACCOUNTS'), getStockMovements);

// Manual stock adjustment / Inward PO receipt (Admin, Warehouse)
router.post('/adjust', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(stockAdjustmentSchema), adjustStock);

export default router;
