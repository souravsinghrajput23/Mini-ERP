import { Router } from 'express';
import { login, getMe, getUsers, createUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema, createUserSchema } from '../schemas/authSchema.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getMe);
router.get('/users', authenticate, getUsers);
router.post('/users', authenticate, authorizeRoles('ADMIN'), validateBody(createUserSchema), createUser);

export default router;
