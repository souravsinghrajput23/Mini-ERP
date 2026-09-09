import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(3, 'Unique SKU is required (e.g. SKU-HDW-1001)'),
  categoryId: z.string().min(1, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative').default(0),
  minStockQuantity: z.number().int().min(1, 'Minimum stock quantity must be at least 1').default(10),
  warehouseId: z.string().min(1, 'Warehouse location is required'),
  unit: z.string().default('PCS'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
});

export const productUpdateSchema = productCreateSchema.partial();
