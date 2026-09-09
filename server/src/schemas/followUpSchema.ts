import { z } from 'zod';

export const followUpCreateSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  assignedToId: z.string().min(1, 'Assigned user ID is required'),
  reason: z.string().min(3, 'Follow-up reason/agenda is required'),
  dueDate: z.string().or(z.date()),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['PENDING', 'COMPLETED', 'RESCHEDULED']).default('PENDING'),
  notes: z.string().optional().or(z.literal('')),
});

export const followUpStatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'RESCHEDULED']),
  notes: z.string().optional(),
  rescheduledDate: z.string().optional(),
});
