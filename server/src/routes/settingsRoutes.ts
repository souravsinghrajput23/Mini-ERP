import { Router } from 'express';
import { getSystemSettings } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getSystemSettings);

export default router;
