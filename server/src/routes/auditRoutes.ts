import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

// Audit logs are accessible by Admin and Accounts
router.get('/', authorizeRoles('ADMIN', 'ACCOUNTS'), getAuditLogs);

export default router;
