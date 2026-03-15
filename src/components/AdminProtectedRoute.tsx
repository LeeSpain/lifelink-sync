import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Navigate, useLocation } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading, isAdmin, role } = useOptimizedAuth();
  const location = useLocation();

  // Dev bypass only in actual development mode — NEVER in production
  const isDevMode = import.meta.env.DEV;

  // Show loading while checking authentication and role
  const isClaraPersonal = location.pathname === '/clara-personal';

  if (loading && !isDevMode) {
    // CLARA Personal gets dark loading screen to prevent white flash
    if (isClaraPersonal) {
      return (
        <div style={{ width: '100vw', height: '100dvh', background: '#0a0812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, #9060ff, #3a1a8a)', animation: 'claraLoadPulse 1.5s infinite' }} />
          <style>{`@keyframes claraLoadPulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }`}</style>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in — pass return URL via both query and state
  if (!user && !isDevMode) {
    const returnTo = encodeURIComponent(location.pathname);
    return <Navigate to={`/auth?next=${returnTo}`} state={{ from: location.pathname }} replace />;
  }

  // Server-side role verification via Supabase RLS
  const isDefinitelyAdmin = role === 'admin' || isAdmin;

  if (!isDefinitelyAdmin && !isDevMode) {
    return <Navigate to="/member-dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
