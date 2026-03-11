import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import EmergencyActionsWidget from "@/components/dashboard/EmergencyActionsWidget";
import { FamilyCircleOverview } from "@/components/dashboard/FamilyCircleOverview";
import { LiveFamilyStatus } from "@/components/dashboard/LiveFamilyStatus";
import { EmergencyPreparedness } from "@/components/dashboard/EmergencyPreparedness";
import LiveSOSFamily from "@/components/dashboard/family/LiveSOSFamily";
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
import FamilyAccessSetup from "@/pages/FamilyAccessSetup";
import MapScreen from "@/pages/MapScreen";
import MyCirclesPage from "@/pages/MyCirclesPage";
import PlacesManager from "@/pages/PlacesManager";
import LocationHistoryPage from "@/pages/LocationHistoryPage";
import { ConnectionsPage } from "@/components/dashboard/ConnectionsPage";
import { DevicesIntegrationsPage } from "@/components/dashboard/pages/DevicesIntegrationsPage";
import AddOnMarketplace from "@/components/dashboard/AddOnMarketplace";
import { MobileDashboard } from "@/components/mobile/MobileDashboard";
import { useTranslation } from 'react-i18next';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { PWAInstallBanner } from '@/components/dashboard/PWAInstallBanner';

// Mobile shell components
import { MobileDashboardHeader } from "@/components/dashboard/mobile/MobileDashboardHeader";
import { MobileBottomNav } from "@/components/dashboard/mobile/MobileBottomNav";
import { FloatingSOSButton } from "@/components/dashboard/mobile/FloatingSOSButton";
import { MobileDashboardHome } from "@/components/dashboard/mobile/MobileDashboardHome";

const Dashboard = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadTimeoutRef = useRef<number | null>(null);
  const { isMobile } = useBreakpoint();

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Shared sub-routes used by both mobile and desktop shells ──
  const dashboardRoutes = (
    <Routes>
      {/* Main Dashboard Overview - Default route */}
      <Route
        index
        element={
          isMobile ? (
            <MobileDashboardHome
              profile={profile}
              subscription={subscription}
            />
          ) : (
            <div className="p-3 sm:p-6">
              <div className="max-w-none">
                {/* Welcome Header */}
                <div className="mb-4 sm:mb-8">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {t('dashboard.welcomeBack', { name: profile?.first_name || t('dashboard.memberFallback') })}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {t('dashboard.protectionOverview')}
                  </p>
                </div>

                <PWAInstallBanner />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="xl:col-span-2 space-y-6">
                    <FamilyCircleOverview />
                    <EmergencyPreparedness
                      profile={profile}
                      subscription={subscription}
                    />
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    <LiveFamilyStatus />
                    <EmergencyActionsWidget profile={profile} subscription={subscription} />
                  </div>
                </div>
              </div>
            </div>
          )
        }
      />

      {/* Products Page */}
       <Route path="products" element={
         <div className="p-3 sm:p-6">
          <EnhancedMyProductsPage />
        </div>
      } />

      {/* Profile Page */}
       <Route path="profile" element={
         <div className="p-3 sm:p-6">
          <EnhancedProfilePage />
        </div>
      } />

      {/* Family SOS Live View */}
       <Route path="family-sos" element={
         <div className="p-3 sm:p-6">
           <LiveSOSFamily />
         </div>
       } />

       {/* Activity Page */}
       <Route path="activity" element={
         <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
           <div>
             <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.activityTitle')}</h1>
             <p className="text-muted-foreground">{t('dashboard.activityDesc')}</p>
           </div>
           <ActivityCard />
         </div>
       } />

       {/* Subscription Page */}
       <Route path="subscription" element={
         <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
           <div>
             <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.subscriptionTitle')}</h1>
             <p className="text-muted-foreground">{t('dashboard.subscriptionDesc')}</p>
           </div>
           <SubscriptionCard subscription={subscription} />
           <AddOnMarketplace />
         </div>
       } />

       {/* Mobile App Page */}
        <Route path="mobile-app" element={
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.mobileAppTitle')}</h1>
              <p className="text-muted-foreground">{t('dashboard.mobileAppDesc')}</p>
            </div>
            <MobileAppCard />
          </div>
        } />

       {/* Mobile Dashboard Page */}
        <Route path="mobile-dashboard" element={
          <div className="p-3 sm:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.mobileDevTitle')}</h1>
              <p className="text-muted-foreground">{t('dashboard.mobileDevDesc')}</p>
            </div>
            <div className="space-y-6">
              <MobileDashboard />
            </div>
          </div>
        } />

      {/* Dashboard pages with full width */}
      <Route path="family" element={<FamilyPage />} />
       <Route path="family-setup" element={
         <div className="p-3 sm:p-6">
           <div className="max-w-4xl mx-auto">
             <FamilyAccessSetup />
           </div>
         </div>
       } />
       <Route path="location" element={<LocationPage />} />
       <Route path="notifications" element={
         <div className="p-3 sm:p-6">
           <NotificationsPage />
         </div>
       } />
       <Route path="security" element={
         <div className="p-3 sm:p-6">
           <SecurityPage />
         </div>
       } />
       <Route path="settings" element={
         <div className="p-3 sm:p-6">
           <SettingsPage />
         </div>
       } />
       <Route path="support" element={
         <div className="p-3 sm:p-6">
           <SupportPage />
         </div>
       } />

      {/* Live Map Routes */}
      <Route path="live-map" element={
        <MapScreen />
      } />
       <Route path="circles" element={
         <div className="p-3 sm:p-6">
           <MyCirclesPage />
         </div>
       } />
       <Route path="places" element={
         <div className="p-3 sm:p-6">
           <PlacesManager />
         </div>
       } />
       <Route path="location-history" element={
         <div className="p-3 sm:p-6">
           <LocationHistoryPage />
         </div>
        } />

        {/* Connections Page */}
        <Route path="connections" element={
          <div className="p-3 sm:p-6">
            <ConnectionsPage />
          </div>
        } />

        {/* Devices & Integrations Page */}
        <Route path="devices" element={
          <DevicesIntegrationsPage />
        } />
    </Routes>
  );

  // ── Mobile shell ──
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MobileDashboardHeader />
        <main className="flex-1 overflow-auto pt-12 pb-24">
          {dashboardRoutes}
        </main>
        <FloatingSOSButton />
        <MobileBottomNav />
      </div>
    );
  }

  // ── Desktop shell (unchanged) ──
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-muted/20 to-muted/50">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header with Sidebar Toggle */}
          <header className="h-14 sm:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold truncate">{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
            </div>
            <div className="hidden sm:block">
              <LanguageCurrencySelector compact />
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto">
            {dashboardRoutes}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
