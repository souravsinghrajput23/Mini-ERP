import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';

export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required', null, 'UNAUTHORIZED');
    }

    // ADMIN always has full access
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return sendError(
        res,
        403,
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required: ${allowedRoles.join(', ')}`,
        { requiredRoles: allowedRoles, currentRole: req.user.role },
        'FORBIDDEN'
      );
    }

    next();
  };
}
