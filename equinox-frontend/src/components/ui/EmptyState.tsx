import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There are no items to display.',
  icon,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-surface-400">
      {icon || <SearchX size={24} />}
    </div>
    <p className="text-surface-700 font-semibold text-base">{title}</p>
    <p className="text-surface-400 text-sm mt-1 max-w-xs">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
