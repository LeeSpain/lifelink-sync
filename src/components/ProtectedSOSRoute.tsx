import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedSOSRouteProps {
  children: React.ReactNode;
}

const ProtectedSOSRoute = ({ children }: ProtectedSOSRouteProps) => {
  const { user, loading } = useOptimizedAuth();

  console.log('🚨 ProtectedSOSRoute:', { 
    hasUser: !!user, 
    loading, 
    path: window.location.pathname 
  });

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Emergency App...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedSOSRoute;