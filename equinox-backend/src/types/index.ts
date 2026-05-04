import type { Request } from 'express';
import type { UserRole } from '@prisma/client';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
