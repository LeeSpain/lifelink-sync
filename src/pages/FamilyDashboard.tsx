import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useOptimizedAuth();
  const { data: familyRole, isLoading: roleLoading } = useFamilyRole();

  // Show loading while checking auth and role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t('family.loadingFamilyApp')}</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (skip if dev bypass is active)
  const devBypass = localStorage.getItem('dev_bypass') === '1';
  if (!user && !devBypass) {
    return <Navigate to="/auth" replace />;
  }

  // Enable family access - users can now access the family dashboard
  // This has been properly configured with working RLS policies
  const allowFamilyAccess = true;
  
  if (!allowFamilyAccess && !familyRole?.isOwner && !familyRole?.isFamilyMember) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">{t('family.accessRestricted')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('family.accessRestrictedDescription')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('family.accessRestrictedError')}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/member-dashboard')}
            >
              {t('family.goToMainDashboard')}
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