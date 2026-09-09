import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(
          res,
          400,
          'Validation failed. Please verify input fields.',
          errorMessages,
          'VALIDATION_ERROR'
        );
      }
      return sendError(res, 400, 'Invalid request payload', error, 'VALIDATION_ERROR');
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await schema.parseAsync(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(
          res,
          400,
          'Query parameter validation failed',
          errorMessages,
          'VALIDATION_ERROR'
        );
      }
      return sendError(res, 400, 'Invalid query parameters', error, 'VALIDATION_ERROR');
    }
  };
}
