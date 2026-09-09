import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  getCustomer360,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addCustomerNote,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/rbac.js';
import { validateBody } from '../middleware/validate.js';
import {
  customerCreateSchema,
  customerUpdateSchema,
  customerNoteSchema,
} from '../schemas/customerSchema.js';

const router = Router();

router.use(authenticate);

// List Customers (Admin, Sales, Accounts)
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomers);

// Customer 360 Deep View (Admin, Sales, Accounts)
router.get('/:id/360', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomer360);

// Get Customer by ID
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), getCustomerById);

// Create Customer (Admin, Sales)
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateBody(customerCreateSchema), createCustomer);

// Update Customer (Admin, Sales)
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), validateBody(customerUpdateSchema), updateCustomer);

// Delete Customer (Admin only)
router.delete('/:id', authorizeRoles('ADMIN'), deleteCustomer);

// Add Note to Customer (Admin, Sales, Accounts)
router.post('/:id/notes', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), validateBody(customerNoteSchema), addCustomerNote);

export default router;
