import type { Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';
import type { AuthRequest } from '../types';
import { sendError } from '../utils/response';

/**
 * RBAC middleware: restrict access to specific roles.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, `Access denied. Required role(s): ${roles.join(', ')}`, 403);
      return;
    }
    next();
  };
};
