import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.number().positive('Unit price must be positive').optional(),
});

export const challanCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required in the challan'),
  notes: z.string().optional().or(z.literal('')),
  terms: z.string().optional().or(z.literal('')),
  dispatchThrough: z.string().optional().or(z.literal('')),
  vehicleNumber: z.string().optional().or(z.literal('')),
  taxRate: z.number().min(0).max(100).default(18.0),
});

export const challanUpdateSchema = challanCreateSchema.partial();

export const challanCancelSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason is required for audit compliance'),
});
