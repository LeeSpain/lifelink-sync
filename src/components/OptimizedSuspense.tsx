import React, { Suspense, ComponentType, ReactNode } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import EnhancedErrorBoundary from './EnhancedErrorBoundary';

interface OptimizedSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
  skeletonType?: 'card' | 'table' | 'list' | 'dashboard' | 'analytics' | 'form';
  skeletonCount?: number;
  errorFallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

const OptimizedSuspense: React.FC<OptimizedSuspenseProps> = ({
  children,
  fallback,
  skeletonType = 'card',
  skeletonCount = 1,
  errorFallback,
  onError
}) => {
  const defaultFallback = fallback || (
    <LoadingSkeleton 
      type={skeletonType} 
      count={skeletonCount}
      className="animate-pulse"
    />
  );

  return (
    <EnhancedErrorBoundary fallback={errorFallback} onError={onError}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </EnhancedErrorBoundary>
  );
};

// Higher-order component for lazy loading with optimized suspense
export function withOptimizedSuspense<P extends object>(
  Component: ComponentType<P>,
  options?: {
    skeletonType?: 'card' | 'table' | 'list' | 'dashboard' | 'analytics' | 'form';
    skeletonCount?: number;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <OptimizedSuspense {...options}>
        <Component {...props} />
      </OptimizedSuspense>
    );
  };
}

export default OptimizedSuspense;