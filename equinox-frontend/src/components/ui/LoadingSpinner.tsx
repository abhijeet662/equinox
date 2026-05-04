import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => (
  <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-surface-200 border-t-primary-600 ${className || ''}`} />
);

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>
);

export default LoadingSpinner;
