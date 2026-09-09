import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  warehouseId: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.enum(['PURCHASE_RECEIVED', 'MANUAL_ADJUSTMENT', 'STOCK_RETURN', 'DAMAGED_WRITE_OFF']),
  referenceNumber: z.string().optional().or(z.literal('')),
  notes: z.string().min(3, 'Adjustment justification/notes is required for audit trail'),
});
