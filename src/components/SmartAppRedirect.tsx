import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { Navigate } from 'react-router-dom';

const SmartAppRedirect = () => {
  const { user, loading: authLoading } = useOptimizedAuth();
  const { data: familyRole, isLoading: roleLoading } = useFamilyRole();

  console.log('🔄 SmartAppRedirect:', {
    user: user?.id || 'none',
    userEmail: user?.email,
    familyRole: familyRole?.role,
    isOwner: familyRole?.isOwner,
    isFamilyMember: familyRole?.isFamilyMember,
    authLoading,
    roleLoading,
    currentPath: window.location.pathname,
  });

  // Show loading while checking authentication and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading your app...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on family role
  if (familyRole?.isOwner || familyRole?.role === 'none') {
    // Owners and users without family setup get the SOS app
    return <Navigate to="/sos-app" replace />;
  } else if (familyRole?.isFamilyMember) {
    // Family members get the tracking app
    return <Navigate to="/family-app" replace />;
  }

  // Default fallback to SOS app
  return <Navigate to="/sos-app" replace />;
};

export default SmartAppRedirect;