import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin, role } = useOptimizedAuth();

  // Show loading while checking authentication and role
  if (loading) {
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
    return <Navigate to="/auth" replace />;
  }

  // Server-side role verification via Supabase RLS
  const isDefinitelyAdmin = role === 'admin' || isAdmin;

  if (!isDefinitelyAdmin) {
    return <Navigate to="/member-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
