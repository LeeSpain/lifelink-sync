import React from 'react';
import { useRegionalRole } from '@/hooks/useRegionalRole';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface RegionalProtectedRouteProps {
  children: React.ReactNode;
}

const RegionalProtectedRoute = ({ children }: RegionalProtectedRouteProps) => {
  const { user, loading, isAdmin } = useOptimizedAuth();
  const { data: roleData, isLoading: roleLoading } = useRegionalRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying regional access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasRegionalAccess = isAdmin ||
                            roleData?.isRegionalOperator ||
                            roleData?.isRegionalSupervisor ||
                            roleData?.isPlatformAdmin;

  if (!hasRegionalAccess) {
    return <Navigate to="/member-dashboard" replace />;
  }

  return <>{children}</>;
};

export default RegionalProtectedRoute;
