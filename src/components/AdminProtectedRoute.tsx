import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin, role } = useOptimizedAuth();

  // Dev bypass: ?dev=1 sets localStorage flag, persists across navigation
  if (new URLSearchParams(window.location.search).get('dev') === '1') {
    localStorage.setItem('dev_bypass', '1');
  }
  const devBypass = localStorage.getItem('dev_bypass') === '1';

  console.log('🔐 AdminProtectedRoute - Enhanced Debug:', {
    user: user?.id || 'none',
    userEmail: user?.email,
    isAdmin,
    role,
    loading,
    devBypass,
    currentPath: window.location.pathname,
    href: window.location.href,
    shouldRedirect: !loading && user && !isAdmin,
    timestamp: new Date().toISOString()
  });

  if (devBypass) {
    return <>{children}</>;
  }

  // Show loading while checking authentication and role
  if (loading) {
    console.log('🔐 AdminProtectedRoute: Still loading auth/role, showing spinner');
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    console.log('🔐 AdminProtectedRoute: No user found, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Enhanced admin check with explicit role verification
  const isDefinitelyAdmin = role === 'admin' || isAdmin;
  console.log('🔐 AdminProtectedRoute: Admin check result:', {
    role,
    isAdmin,
    isDefinitelyAdmin,
    willRedirect: !isDefinitelyAdmin
  });

  // Only redirect if we have a definitive role and it's not admin
  if (!isDefinitelyAdmin) {
    console.log('🔐 AdminProtectedRoute: User is not admin, redirecting to member dashboard');
    return <Navigate to="/member-dashboard" replace />;
  }

  console.log('🔐 AdminProtectedRoute: Admin verified, rendering children');
  return <>{children}</>;
};

export default AdminProtectedRoute;