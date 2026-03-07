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

  console.log('🔐 RegionalProtectedRoute:', {
    user: user?.id || 'none',
    role: roleData?.role || 'none',
    loading,
    roleLoading,
    isAdmin,
    currentPath: window.location.pathname,
    isRegionalOperator: roleData?.isRegionalOperator,
    isRegionalSupervisor: roleData?.isRegionalSupervisor,
    isPlatformAdmin: roleData?.isPlatformAdmin
  });

  // Show loading while checking authentication and role
  if (loading || roleLoading) {
    console.log('🔐 RegionalProtectedRoute: Still loading, showing spinner');
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying regional access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    console.log('🔐 RegionalProtectedRoute: No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Check if user has regional access (including platform admins)
  const hasRegionalAccess = isAdmin || 
                            roleData?.isRegionalOperator || 
                            roleData?.isRegionalSupervisor || 
                            roleData?.isPlatformAdmin;

  if (!hasRegionalAccess) {
    console.log('🔐 RegionalProtectedRoute: User lacks regional access, redirecting to dashboard');
    return <Navigate to="/member-dashboard" replace />;
  }

  return <>{children}</>;
};

export default RegionalProtectedRoute;