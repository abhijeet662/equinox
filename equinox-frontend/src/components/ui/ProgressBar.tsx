import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'bg-primary-500',
  height = 'h-2',
  showLabel = false,
  className,
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-surface-500 mb-1">
          <span>{value}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-surface-100 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
