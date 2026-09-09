import { Router } from 'express';
import { getDashboardStats, getDashboardAlerts } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/alerts', getDashboardAlerts);

export default router;
