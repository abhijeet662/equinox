import type { Response } from 'express';
import type { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  pagination?: ApiResponse<T>['pagination']
): void => {
  const response: ApiResponse<T> = { success: true, data, message };
  if (pagination) response.pagination = pagination;
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: string
): void => {
  const response: ApiResponse = { success: false, message, error };
  res.status(statusCode).json(response);
};

export const getPagination = (page = 1, limit = 20) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
