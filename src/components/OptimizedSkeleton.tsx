import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'avatar' | 'button';
  lines?: number;
}

export const OptimizedSkeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'card',
  lines = 1 
}) => {
  const baseClasses = 'animate-pulse bg-muted rounded';
  
  const variantClasses = {
    card: 'h-32 w-full',
    text: 'h-4 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={`${baseClasses} ${variantClasses.text}`}
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-center space-x-4">
      <OptimizedSkeleton variant="avatar" />
      <div className="space-y-2">
        <OptimizedSkeleton variant="text" />
        <OptimizedSkeleton variant="text" className="w-1/2" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <OptimizedSkeleton key={i} variant="card" />
      ))}
    </div>
  </div>
);