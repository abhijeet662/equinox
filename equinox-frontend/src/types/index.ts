export type UserRole = 'admin' | 'provider' | 'buyer' | 'employee' | 'guest';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type ContractStatus = 'active' | 'pending' | 'expired' | 'draft';

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status?: string;
  company?: string;
}

export interface Breadcrumb {
  label: string;
  path?: string;
}
