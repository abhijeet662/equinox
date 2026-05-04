import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeLabel, icon, iconBg, suffix }) => {
  const isPositive = change !== undefined && change >= 0;
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-surface-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {value}{suffix && <span className="text-lg text-surface-500 font-medium ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{isPositive ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-surface-400 font-normal">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-primary-50'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
