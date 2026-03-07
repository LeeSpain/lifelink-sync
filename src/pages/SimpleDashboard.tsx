import React, { useEffect } from "react";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";

const SimpleDashboard = () => {
  const { user, loading: authLoading, isAdmin } = useOptimizedAuth();
  const { isLoading: dashboardLoading, loadingStates } = useDashboardData();

  // Optimize loading - show content as soon as we have basic auth
  const loading = authLoading;

  // Show loading while checking authentication and role
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if no user (shouldn't happen with ProtectedRoute)
  if (!user) {
    console.error('❌ SimpleDashboard: No authenticated user found');
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <p>Authentication required. Please log in.</p>
        </div>
      </div>
    );
  }

  // Redirect admin users to admin dashboard
  if (isAdmin) {
    console.log('🏠 SimpleDashboard: Admin user detected, redirecting to admin dashboard');
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Render member dashboard with simplified interface
  return (
    <div>
      <div className="container mx-auto px-4 pt-4">
        <EmailVerificationBanner />
      </div>
      <Dashboard />
    </div>
  );
};

export default SimpleDashboard;