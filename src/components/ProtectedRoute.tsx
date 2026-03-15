import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  // Dev bypass only in actual development mode — NEVER in production
  const isDevMode = import.meta.env.DEV;

  if (loading && !isDevMode) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user && !isDevMode) {
    // Preserve the intended destination so auth redirects back after login
    const next = location.pathname !== '/auth' ? `?next=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/auth${next}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
