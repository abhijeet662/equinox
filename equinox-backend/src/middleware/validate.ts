import { validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Express-validator result checker — returns 422 if any validation errors exist.
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(res, 'Validation failed', 422, JSON.stringify(errors.array()));
    return;
  }
  next();
};
