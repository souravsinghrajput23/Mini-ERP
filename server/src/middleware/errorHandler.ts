import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`💥 [ERROR] ${req.method} ${req.originalUrl}:`, err);

  // Prisma Unique Constraint Error (P2002)
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    return sendError(
      res,
      409,
      `A record with this ${target} already exists in the system.`,
      { target, code: err.code },
      'DUPLICATE_RESOURCE'
    );
  }

  // Prisma Record Not Found (P2025)
  if (err.code === 'P2025') {
    return sendError(
      res,
      404,
      'The requested record was not found or has been removed.',
      { code: err.code },
      'RESOURCE_NOT_FOUND'
    );
  }

  // Custom Business Logic Errors with status code
  if (err.statusCode) {
    return sendError(
      res,
      err.statusCode,
      err.message || 'Operation failed',
      err.details,
      err.errorCode || 'OPERATION_FAILED'
    );
  }

  return sendError(
    res,
    500,
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please contact system administrator.'
      : err.message || 'Internal Server Error',
    process.env.NODE_ENV === 'production' ? undefined : err.stack,
    'INTERNAL_SERVER_ERROR'
  );
}
