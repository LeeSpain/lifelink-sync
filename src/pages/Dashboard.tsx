import React, { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricsDashboard from "@/components/dashboard/MetricsDashboard";
import EmergencyActionsWidget from "@/components/dashboard/EmergencyActionsWidget";
import { FamilyCircleOverview } from "@/components/dashboard/FamilyCircleOverview";
import { LiveFamilyStatus } from "@/components/dashboard/LiveFamilyStatus";
import { EmergencyPreparedness } from "@/components/dashboard/EmergencyPreparedness";
import MyProductsWidget from "@/components/dashboard/MyProductsWidget";
import PersonalDetailsCard from "@/components/dashboard/PersonalDetailsCard";
import EmergencyContactsCard from "@/components/dashboard/EmergencyContactsCard";
import FamilyAccessPanel from "@/components/dashboard/family/FamilyAccessPanel";
import LiveSOSFamily from "@/components/dashboard/family/LiveSOSFamily";
import MedicalInfoCard from "@/components/dashboard/MedicalInfoCard";
import EnhancedProfilePage from "@/components/dashboard/pages/EnhancedProfilePage";
import EnhancedMyProductsPage from "@/components/dashboard/pages/EnhancedMyProductsPage";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import MobileAppCard from "@/components/dashboard/MobileAppCard";
import ActivityCard from "@/components/dashboard/ActivityCard";
import { FamilyPage } from "@/components/dashboard/pages/FamilyPage";
import { LocationPage } from "@/components/dashboard/pages/LocationPage";
import { NotificationsPage } from "@/components/dashboard/pages/NotificationsPage";
import { SecurityPage } from "@/components/dashboard/pages/SecurityPage";
import { SettingsPage } from "@/components/dashboard/pages/SettingsPage";
import { SupportPage } from "@/components/dashboard/pages/SupportPage";
import { FlicControlPage } from "@/components/dashboard/pages/FlicControlPage";
import FamilyAccessSetup from "@/pages/FamilyAccessSetup";
import MapScreen from "@/pages/MapScreen";
import MyCirclesPage from "@/pages/MyCirclesPage";
import PlacesManager from "@/pages/PlacesManager";
import LocationHistoryPage from "@/pages/LocationHistoryPage";
import { ConnectionsPage } from "@/components/dashboard/ConnectionsPage";
import { useTranslation } from 'react-i18next';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';

const Dashboard = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadTimeoutRef = useRef<number | null>(null);

  // Auto-scroll to top when navigating
  useScrollToTop();
  const { t } = useTranslation();

  // Setup real-time updates
  useRealTimeUpdates({
    onSubscriptionUpdate: () => checkSubscription(),
    onFamilyUpdate: () => loadDashboardData(),
    onOrderUpdate: () => loadDashboardData()
  });

  useEffect(() => {
    console.log('[Dashboard] mount -> starting initial load');
    loadDashboardData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      console.log('[Dashboard] auto-refresh tick');
      loadDashboardData();
    }, 120000);

    // Listen for page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[Dashboard] tab visible -> refresh');
        loadDashboardData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for storage events (when user completes payment in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'subscription-updated') {
        console.log('[Dashboard] storage subscription-updated -> refresh');
        loadDashboardData();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Hard timeout guard to avoid being stuck on initial loading
    initialLoadTimeoutRef.current = window.setTimeout(() => {
      console.warn('[Dashboard] initial load timeout -> forcing setLoading(false)');
      setLoading(false);
    }, 8000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      if (initialLoadTimeoutRef.current) {
        clearTimeout(initialLoadTimeoutRef.current);
        initialLoadTimeoutRef.current = null;
      }
    };
  }, []);

  const loadDashboardData = async () => {
    console.log('[Dashboard] loadDashboardData: start');
    try {
      await Promise.all([
        checkSubscription(),
        loadProfile()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      console.log('[Dashboard] loadDashboardData: finished -> setLoading(false)');
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      console.log('[Dashboard] checkSubscription: invoking function');
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      console.log('[Dashboard] checkSubscription: success', data);
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadProfile = async () => {
    try {
      console.log('[Dashboard] loadProfile: getUser');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('[Dashboard] loadProfile: no user');
        return;
      }

      console.log('[Dashboard] loadProfile: fetching profile for', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('[Dashboard] loadProfile: success');
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-page-top">
          <div className="text-center text-white">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-muted/20 to-muted/50">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with Sidebar Toggle */}
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
            </div>
            <LanguageCurrencySelector compact />
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
            <Routes>
              {/* Main Dashboard Overview - Default route */}
              <Route 
                index 
                element={
                  <div className="p-6">
                    <div className="max-w-none">
                      {/* Welcome Header */}
                      <div className="mb-6">
                        <h1 className="text-3xl font-bold">
                          Welcome back, {profile?.first_name || 'Member'}!
                        </h1>
                        <p className="text-muted-foreground mt-1">
                          Here's your protection status at a glance
                        </p>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Main Content - Family Circle Focus */}
                        <div className="xl:col-span-2 space-y-6">
                          {/* Family Circle Overview - Prominent */}
                          <FamilyCircleOverview />
                          
                          {/* Emergency Preparedness */}
                          <EmergencyPreparedness 
                            profile={profile} 
                            subscription={subscription}
                          />
                        </div>
                        
                        {/* Sidebar - Live Status & Actions */}
                        <div className="space-y-6">
                          <LiveFamilyStatus />
                          <EmergencyActionsWidget profile={profile} subscription={subscription} />
                        </div>
                      </div>
                    </div>
                  </div>
                } 
              />

              {/* Products Page */}
               <Route path="products" element={
                 <div className="p-6">
                  <EnhancedMyProductsPage />
                </div>
              } />

              {/* Profile Page */}
               <Route path="profile" element={
                 <div className="p-6">
                  <EnhancedProfilePage />
                </div>
              } />

              {/* Family SOS Live View */}
               <Route path="family-sos" element={
                 <div className="p-6">
                   <LiveSOSFamily />
                 </div>
               } />

               {/* Activity Page */}
               <Route path="activity" element={
                 <div className="p-6">
                   <ActivityCard />
                 </div>
               } />

               {/* Subscription Page */}
               <Route path="subscription" element={
                 <div className="p-6">
                   <SubscriptionCard subscription={subscription} />
                 </div>
               } />

               {/* Mobile App Page */}
                <Route path="mobile-app" element={
                  <div className="p-6">
                    <MobileAppCard />
                  </div>
                } />

               {/* Mobile Dashboard Page */}
                <Route path="mobile-dashboard" element={
                  <div className="p-6">
                    <div className="mb-6">
                      <h1 className="text-2xl font-bold">Mobile Development Dashboard</h1>
                      <p className="text-muted-foreground">Monitor mobile app readiness and native capabilities</p>
                    </div>
                    <div className="space-y-6">
                      {React.createElement(() => {
                        const { MobileDashboard } = require('@/components/mobile/MobileDashboard');
                        return React.createElement(MobileDashboard);
                      })}
                    </div>
                  </div>
                } />

              {/* Dashboard pages with full width */}
              <Route path="family" element={<FamilyPage />} />
               <Route path="family-setup" element={
                 <div className="p-6">
                   <div className="max-w-4xl mx-auto">
                     <FamilyAccessSetup />
                   </div>
                 </div>
               } />
               <Route path="location" element={<LocationPage />} />
               <Route path="notifications" element={
                 <div className="p-6">
                   <NotificationsPage />
                 </div>
               } />
               <Route path="security" element={
                 <div className="p-6">
                   <SecurityPage />
                 </div>
               } />
               <Route path="settings" element={
                 <div className="p-6">
                   <SettingsPage />
                 </div>
               } />
               <Route path="support" element={
                 <div className="p-6">
                   <SupportPage />
                 </div>
               } />
              
              {/* Live Map Routes */}
              <Route path="live-map" element={
                <div className="min-h-[calc(100vh-64px)]">
                  <MapScreen />
                </div>
              } />
               <Route path="circles" element={
                 <div className="p-6">
                   <MyCirclesPage />
                 </div>
               } />
               <Route path="places" element={
                 <div className="p-6">
                   <PlacesManager />
                 </div>
               } />
               <Route path="location-history" element={
                 <div className="p-6">
                   <LocationHistoryPage />
                 </div>
                } />
                
                {/* Connections Page */}
                <Route path="connections" element={
                  <div className="p-6">
                    <ConnectionsPage />
                  </div>
                } />
            </Routes>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;