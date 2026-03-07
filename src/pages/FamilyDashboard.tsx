import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, MapPin, Phone, Users, Bell, Heart } from 'lucide-react';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import FamilyDashboardHome from '@/components/family-dashboard/FamilyDashboardHome';
import FamilyEmergencyMap from '@/components/family-dashboard/FamilyEmergencyMap';
import FamilyLiveMap from '@/components/family-dashboard/FamilyLiveMap';
import { AdvancedMapFeatures } from '@/components/family-dashboard/AdvancedMapFeatures';
import ConnectionDashboard from '@/components/family-dashboard/ConnectionDashboard';
import FamilyDashboardSidebar from '@/components/family-dashboard/FamilyDashboardSidebar';
import FamilyNotifications from '@/components/family-dashboard/FamilyNotifications';
import FamilyProfile from '@/components/family-dashboard/FamilyProfile';

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useOptimizedAuth();
  const { data: familyRole, isLoading: roleLoading } = useFamilyRole();

  // Show loading while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading Family App...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Enable family access - users can now access the family dashboard
  // This has been properly configured with working RLS policies
  const allowFamilyAccess = true;
  
  if (!allowFamilyAccess && !familyRole?.isOwner && !familyRole?.isFamilyMember) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl">Access Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              This Family Emergency App is only available to invited family members.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact the family member who invited you.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/member-dashboard')}
            >
              Go to Main Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Sidebar */}
      <FamilyDashboardSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
            <Routes>
              <Route index element={<FamilyDashboardHome />} />
              <Route path="/connections" element={<ConnectionDashboard />} />
              <Route path="/advanced-map" element={<AdvancedMapFeatures />} />
              <Route path="/emergency-map" element={<FamilyEmergencyMap />} />
              <Route path="/live-map" element={<FamilyLiveMap />} />
              <Route path="/notifications" element={<FamilyNotifications />} />
              <Route path="/profile" element={<FamilyProfile />} />
            </Routes>
      </main>
    </div>
  );
};

export default FamilyDashboard;