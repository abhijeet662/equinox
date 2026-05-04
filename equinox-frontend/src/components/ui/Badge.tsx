import React from 'react';
import { statusColor } from '../../utils/helpers';

interface BadgeProps {
  label: string;
  className?: string;
  variant?: 'status' | 'custom';
}

const Badge: React.FC<BadgeProps> = ({ label, className, variant = 'status' }) => {
  const colorClass = variant === 'status' ? (statusColor[label.toLowerCase()] || 'bg-surface-100 text-surface-600') : '';
  return (
    <span className={`badge capitalize ${colorClass} ${className || ''}`}>
      {label.replace('-', ' ')}
    </span>
  );
};

export default Badge;
