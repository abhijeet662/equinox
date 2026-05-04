import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

/**
 * Middleware: verify JWT access token and attach user to request.
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};
