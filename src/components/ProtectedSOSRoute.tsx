import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedSOSRouteProps {
  children: React.ReactNode;
}

const ProtectedSOSRoute = ({ children }: ProtectedSOSRouteProps) => {
  const { user, loading } = useOptimizedAuth();

  // Dev bypass only in actual development mode — NEVER in production
  const isDevMode = import.meta.env.DEV;

  if (loading && !isDevMode) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Emergency App...</p>
        </div>
      </div>
    );
  }

  if (!user && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedSOSRoute;
