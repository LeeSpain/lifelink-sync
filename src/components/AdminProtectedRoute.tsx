import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin, role } = useOptimizedAuth();

  // Allow access in development mode or with dev bypass
  const isDevMode = import.meta.env.DEV || localStorage.getItem('dev_bypass') === '1';

  // Show loading while checking authentication and role
  if (loading && !isDevMode) {
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
  if (!user && !isDevMode) {
    return <Navigate to="/auth" replace />;
  }

  // Server-side role verification via Supabase RLS
  const isDefinitelyAdmin = role === 'admin' || isAdmin;

  if (!isDefinitelyAdmin && !isDevMode) {
    return <Navigate to="/member-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
