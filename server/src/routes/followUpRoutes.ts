import { Router } from 'express';
import {
  getFollowUps,
  createFollowUp,
  updateFollowUpStatus,
  deleteFollowUp,
} from '../controllers/followUpController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { followUpCreateSchema, followUpStatusUpdateSchema } from '../schemas/followUpSchema.js';

const router = Router();

router.use(authenticate);

// Get followups (Admin, Sales)
router.get('/', authorizeRoles('ADMIN', 'SALES'), getFollowUps);

// Create follow-up (Admin, Sales)
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateBody(followUpCreateSchema), createFollowUp);

// Update status (Admin, Sales)
router.patch('/:id/status', authorizeRoles('ADMIN', 'SALES'), validateBody(followUpStatusUpdateSchema), updateFollowUpStatus);

// Delete follow-up (Admin, Sales)
router.delete('/:id', authorizeRoles('ADMIN', 'SALES'), deleteFollowUp);

export default router;
