import type { TaskPriority } from '@prisma/client';

// SLA hours per blueprint Section 4.1.1
// P0=4h, P1=8h, P2=2-day(48h), P3=4-day(96h)
export const DEFAULT_SLA_HOURS: Record<TaskPriority, number> = {
  P0: 4,   // Critical: 4 hours
  P1: 8,   // High: 8 hours
  P2: 48,  // Medium: 2 days
  P3: 96,  // Low: 4 days
};

// Max concurrent ACTIVE (non-DONE) tasks per priority per assignee — blueprint Section 4.1.1
export const MAX_ACTIVE_TASKS: Record<TaskPriority, number> = {
  P0: 2,
  P1: 4,
  P2: 8,
  P3: 10,
};

/**
 * Check if a task has breached its SLA based on creation time and priority.
 */
export const checkSlaBreached = (
  createdAt: Date,
  priority: TaskPriority,
  customSlaHours?: number | null
): boolean => {
  const slaHours = customSlaHours ?? DEFAULT_SLA_HOURS[priority];
  const deadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
  return new Date() > deadline;
};

/**
 * Calculate remaining SLA time in hours.
 */
export const getSlaRemainingHours = (
  createdAt: Date,
  priority: TaskPriority,
  customSlaHours?: number | null
): number => {
  const slaHours = customSlaHours ?? DEFAULT_SLA_HOURS[priority];
  const deadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
  const remainingMs = deadline.getTime() - Date.now();
  return Math.round(remainingMs / (60 * 60 * 1000));
};

/**
 * Generate a unique invoice number.
 */
export const generateInvoiceNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
};
