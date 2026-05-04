export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const priorityColor: Record<string, string> = {
  P0: 'bg-red-100 text-red-700',
  P1: 'bg-orange-100 text-orange-700',
  P2: 'bg-yellow-100 text-yellow-700',
  P3: 'bg-green-100 text-green-700',
};

export const statusColor: Record<string, string> = {
  'todo': 'bg-surface-100 text-surface-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  'review': 'bg-amber-100 text-amber-700',
  'done': 'bg-green-100 text-green-700',
  'active': 'bg-green-100 text-green-700',
  'pending': 'bg-amber-100 text-amber-700',
  'expired': 'bg-surface-100 text-surface-500',
  'draft': 'bg-surface-100 text-surface-500',
  'paid': 'bg-green-100 text-green-700',
  'overdue': 'bg-red-100 text-red-700',
  'open': 'bg-red-100 text-red-700',
  'resolved': 'bg-green-100 text-green-700',
  'closed': 'bg-surface-100 text-surface-500',
  'suspended': 'bg-red-100 text-red-700',
  'inactive': 'bg-surface-100 text-surface-500',
  'on-leave': 'bg-amber-100 text-amber-700',
  'approved': 'bg-green-100 text-green-700',
  'rejected': 'bg-red-100 text-red-700',
  'completed': 'bg-green-100 text-green-700',
  'failed': 'bg-red-100 text-red-700',
  'credit': 'bg-green-100 text-green-700',
  'debit': 'bg-red-100 text-red-700',
};

export const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
