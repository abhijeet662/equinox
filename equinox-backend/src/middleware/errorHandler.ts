import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler — catches any unhandled errors in route/middleware chain.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Create a structured operational error.
 */
export const createError = (message: string, statusCode = 400): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};
