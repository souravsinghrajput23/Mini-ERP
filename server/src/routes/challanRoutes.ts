import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
  previewStock,
} from '../controllers/challanController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { challanCreateSchema, challanCancelSchema } from '../schemas/challanSchema.js';

const router = Router();

router.use(authenticate);

// View Challans (Admin, Sales, Accounts)
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getChallans);

// Stock preview before creating/confirming challan (Admin, Sales)
router.post('/preview-stock', authorizeRoles('ADMIN', 'SALES'), previewStock);

// Get single Challan
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getChallanById);

// Create Challan (Admin, Sales)
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateBody(challanCreateSchema), createChallan);

// Confirm Challan (Admin, Sales)
router.post('/:id/confirm', authorizeRoles('ADMIN', 'SALES'), confirmChallan);

// Cancel Challan (Admin, Sales, Accounts)
router.post('/:id/cancel', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), validateBody(challanCancelSchema), cancelChallan);

export default router;
