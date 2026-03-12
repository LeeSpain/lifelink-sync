import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ── Tabbed page components ──

function ProfileTabs() {
  const { t } = useTranslation();
  return (
    <div className="p-3 sm:p-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">{t('dashboard.tabProfile', { defaultValue: 'Profile' })}</TabsTrigger>
          <TabsTrigger value="activity">{t('dashboard.tabActivity', { defaultValue: 'Activity' })}</TabsTrigger>
          <TabsTrigger value="app">{t('dashboard.tabGetApp', { defaultValue: 'Get the App' })}</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <EnhancedProfilePage />
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.activityTitle')}</h1>
            <p className="text-muted-foreground">{t('dashboard.activityDesc')}</p>
          </div>
          <ActivityCard />
        </TabsContent>
        <TabsContent value="app" className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.mobileAppTitle')}</h1>
            <p className="text-muted-foreground">{t('dashboard.mobileAppDesc')}</p>
          </div>
          <MobileAppCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductsTabs() {
  const { t } = useTranslation();
  return (
    <div className="p-3 sm:p-6">
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">{t('dashboard.tabMyProducts', { defaultValue: 'My Products' })}</TabsTrigger>
          <TabsTrigger value="devices">{t('dashboard.tabDevices', { defaultValue: 'Devices' })}</TabsTrigger>
          <TabsTrigger value="addons">{t('dashboard.tabAddOns', { defaultValue: 'Add-ons' })}</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <EnhancedMyProductsPage />
        </TabsContent>
        <TabsContent value="devices">
          <DevicesIntegrationsPage />
        </TabsContent>
        <TabsContent value="addons">
          <AddOnMarketplace />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FamilyTabs() {
  const { t } = useTranslation();
  return (
    <Tabs defaultValue="connections" className="space-y-6 p-3 sm:p-6">
      <TabsList className="flex w-full overflow-x-auto">
        <TabsTrigger value="connections" className="shrink-0">{t('dashboard.tabConnections', { defaultValue: 'Connections' })}</TabsTrigger>
        <TabsTrigger value="live-map" className="shrink-0">{t('dashboard.tabLiveMap', { defaultValue: 'Live Map' })}</TabsTrigger>
        <TabsTrigger value="circles" className="shrink-0">{t('dashboard.tabCircles', { defaultValue: 'Circles' })}</TabsTrigger>
        <TabsTrigger value="places" className="shrink-0">{t('dashboard.tabPlaces', { defaultValue: 'Places' })}</TabsTrigger>
        <TabsTrigger value="history" className="shrink-0">{t('dashboard.tabHistory', { defaultValue: 'History' })}</TabsTrigger>
      </TabsList>
      <TabsContent value="connections">
        <ConnectionsPage />
      </TabsContent>
      <TabsContent value="live-map" className="-mx-3 sm:-mx-6 -mb-3 sm:-mb-6">
        <MapScreen />
      </TabsContent>
      <TabsContent value="circles">
        <MyCirclesPage />
      </TabsContent>
      <TabsContent value="places">
        <PlacesManager />
      </TabsContent>
      <TabsContent value="history">
        <LocationHistoryPage />
      </TabsContent>
    </Tabs>
  );
}

function SettingsTabs() {
  const { t } = useTranslation();
  return (
    <div className="p-3 sm:p-6">
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">{t('dashboard.tabNotifications', { defaultValue: 'Notifications' })}</TabsTrigger>
          <TabsTrigger value="security">{t('dashboard.tabSecurity', { defaultValue: 'Security' })}</TabsTrigger>
          <TabsTrigger value="preferences">{t('dashboard.tabPreferences', { defaultValue: 'Preferences' })}</TabsTrigger>
        </TabsList>
        <TabsContent value="notifications">
          <NotificationsPage />
        </TabsContent>
        <TabsContent value="security">
          <SecurityPage />
        </TabsContent>
        <TabsContent value="preferences">
          <SettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Dashboard ──

const Dashboard = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadTimeoutRef = useRef<number | null>(null);
  const { isMobile, isTablet } = useBreakpoint();

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

      {/* Profile — 3 tabs: Profile | Activity | Get the App */}
      <Route path="profile" element={<ProfileTabs />} />

      {/* Products — 3 tabs: My Products | Devices | Add-ons */}
      <Route path="products" element={<ProductsTabs />} />

      {/* Family — 5 tabs: Connections | Live Map | Circles | Places | History */}
      <Route path="family" element={<FamilyTabs />} />

      {/* Settings — 3 tabs: Notifications | Security | Preferences */}
      <Route path="settings" element={<SettingsTabs />} />

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

      {/* Support Page */}
      <Route path="support" element={
        <div className="p-3 sm:p-6">
          <SupportPage />
        </div>
      } />

      {/* Family SOS Live View */}
      <Route path="family-sos" element={
        <div className="p-3 sm:p-6">
          <LiveSOSFamily />
        </div>
      } />

      {/* Family Setup */}
      <Route path="family-setup" element={
        <div className="p-3 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <FamilyAccessSetup />
          </div>
        </div>
      } />

      {/* Mobile Dashboard */}
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

      {/* Redirects for old routes → merged pages */}
      <Route path="activity"          element={<Navigate to="../profile"  replace />} />
      <Route path="mobile-app"        element={<Navigate to="../profile"  replace />} />
      <Route path="devices"           element={<Navigate to="../products" replace />} />
      <Route path="connections"       element={<Navigate to="../family"   replace />} />
      <Route path="live-map"          element={<Navigate to="../family"   replace />} />
      <Route path="circles"           element={<Navigate to="../family"   replace />} />
      <Route path="places"            element={<Navigate to="../family"   replace />} />
      <Route path="location-history"  element={<Navigate to="../family"   replace />} />
      <Route path="location"          element={<Navigate to="../family"   replace />} />
      <Route path="notifications"     element={<Navigate to="../settings" replace />} />
      <Route path="security"          element={<Navigate to="../settings" replace />} />
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

  // ── Desktop shell ──
  return (
    <SidebarProvider defaultOpen={!isTablet}>
      <div className="min-h-screen w-full flex bg-gradient-to-br from-muted/20 to-muted/50">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header with Sidebar Toggle + Logo */}
          <header className="h-14 sm:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/lifelink-sync-icon-192.png"
                alt="LifeLink Sync"
                className="h-7 w-7 rounded-lg"
              />
              <h1 className="text-lg sm:text-xl font-semibold truncate">{t('dashboard.title', { defaultValue: 'Dashboard' })}</h1>
            </div>
            <div className="flex-1" />
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
