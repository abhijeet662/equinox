import React from 'react';

interface AvatarProps {
  initials: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const colorClasses = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
];

const Avatar: React.FC<AvatarProps> = ({ initials, src, size = 'md', color, className }) => {
  const autoColor = colorClasses[(initials || 'U').charCodeAt(0) % colorClasses.length];
  const isImage = src && (src.startsWith('data:') || src.startsWith('http'));

  if (isImage) {
    return (
      <img
        src={src}
        alt={initials}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${className || ''}`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${color || autoColor} rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden ${className || ''}`}>
      {(initials || 'U').slice(0, 2).toUpperCase()}
    </div>
  );
};

export default Avatar;
