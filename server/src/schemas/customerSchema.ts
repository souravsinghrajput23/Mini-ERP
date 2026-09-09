import { z } from 'zod';

export const customerCreateSchema = z.object({
  name: z.string().min(2, 'Customer / contact person name is required'),
  mobile: z.string().min(10, 'Valid 10-digit mobile number required'),
  email: z.string().email('Valid email address required').optional().or(z.literal('')),
  businessName: z.string().min(2, 'Registered business/company name is required'),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Indian GSTIN format (e.g. 27AABCU9603R1ZM)')
    .optional()
    .or(z.literal('')),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('WHOLESALE'),
  address: z.string().min(5, 'Delivery address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().optional().or(z.literal('')),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('ACTIVE'),
  followUpDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
});

export const customerUpdateSchema = customerCreateSchema.partial();

export const customerNoteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty'),
});
