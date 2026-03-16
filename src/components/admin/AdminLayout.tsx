
import React, { useState } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Users,
  MessageSquare,
  AlertTriangle,
  Activity,
  Settings,
  FileText,
  DollarSign,
  TrendingUp,
  Heart,
  Shield,
  Database,
  Bot,
  Brain,
  Package,
  MapPin,
  Mail,
  Smartphone,
  Bluetooth,
  Video,
  Map,
  Navigation,
  History,
  Phone,
  Building,
  BookOpen,
  Target,
  Send,
  LogOut,
  User,
  Home,
  Clock,
  LayoutGrid,
  LayoutDashboard,
  Settings2,
  Gift,
  Cpu,
  Gauge,
  Sliders,
  Rocket,
  HeartPulse,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LanguageCurrencySelector from '@/components/LanguageCurrencySelector';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';
import { BlogNotificationBadge } from '@/components/admin/BlogNotificationBadge';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import SupabaseSecurityReminder from '@/components/admin/SupabaseSecurityReminder';

const useAdminMenuItems = () => {
  const { t } = useTranslation();
  
  return [
    {
      title: t('admin.sidebarOverview', 'Overview'),
      items: [
        { title: t('admin.dashboard'), url: "/admin-dashboard", icon: BarChart3 },
        { title: t('admin.analytics'), url: "/admin-dashboard/analytics", icon: BarChart3 },
        { title: t('admin.videoAnalytics'), url: "/admin-dashboard/video-analytics", icon: Video },
        { title: t('admin.revenueAnalytics'), url: "/admin-dashboard/revenue", icon: DollarSign },
        { title: t('admin.userGrowth'), url: "/admin-dashboard/growth", icon: TrendingUp },
      ]
    },
    {
      title: t('admin.sidebarAI', 'AI'),
      items: [
        { title: 'Command Centre', url: "/admin-dashboard/command-centre", icon: Activity },
        { title: 'AI Overview', url: "/admin-dashboard/ai-overview", icon: LayoutDashboard },
        { title: 'Clara', url: "/admin-dashboard/clara-activity", icon: Bot },
        { title: 'Training Data', url: "/admin-dashboard/ai-training", icon: BookOpen },
        { title: 'AI Agent Config', url: "/admin-dashboard/ai-agent-config", icon: Cpu },
        { title: 'Dev Agent', url: "/admin-dashboard/dev-agent", icon: Rocket },
        { title: 'PA Dashboard', url: "/admin-dashboard/pa-dashboard", icon: CheckCircle },
        { title: t('admin.rivenMarketingAi'), url: "/admin-dashboard/riven-marketing", icon: Brain },
        { title: 'AI Settings', url: "/admin-dashboard/ai-settings", icon: Settings2 },
        { title: 'AI Analytics', url: "/admin-dashboard/ai-analytics", icon: BarChart3 },
        { title: 'AI Performance', url: "/admin-dashboard/ai-performance", icon: Gauge },
        { title: 'AI Model Settings', url: "/admin-dashboard/ai-model-settings", icon: Sliders },
        { title: 'Constitution', url: "/admin-dashboard/constitution", icon: Shield },
        { title: 'Budget Control', url: "/admin-dashboard/budget-control", icon: DollarSign },
      ]
    },
    {
      title: t('admin.sidebarCustomers', 'Customers'),
      items: [
        { title: t('admin.allCustomers'), url: "/admin-dashboard/customers", icon: Users },
        { title: t('admin.subscriptions'), url: "/admin-dashboard/subscriptions", icon: Database },
        { title: t('admin.familyAccounts'), url: "/admin-dashboard/families", icon: Heart },
      ]
    },
    {
      title: t('admin.sidebarLeads', 'Leads'),
      items: [
        { title: t('admin.leadManagement'), url: "/admin-dashboard/leads", icon: MessageSquare },
        { title: t('admin.leadIntelligence'), url: "/admin-dashboard/lead-intelligence", icon: Target },
        { title: t('admin.conversations'), url: "/admin-dashboard/conversations", icon: MessageSquare },
        { title: 'Manual Invite', url: "/admin-dashboard/manual-invite", icon: Send },
      ]
    },
    {
      title: t('admin.sidebarComms', 'Communications'),
      items: [
        { title: t('admin.contactSubmissions'), url: "/admin-dashboard/contact-submissions", icon: Mail },
        { title: t('admin.communicationCenter'), url: "/admin-dashboard/communication", icon: MessageSquare },
        { title: 'WhatsApp Settings', url: "/admin-dashboard/whatsapp", icon: Phone },
        { title: 'Email Management', url: "/admin-dashboard/email-management", icon: Mail },
      ]
    },
    {
      title: t('admin.sidebarMap', 'Map'),
      items: [
        { title: t('admin.liveMapMonitor'), url: "/admin-dashboard/live-map-monitor", icon: Map },
        { title: t('admin.circleAnalytics'), url: "/admin-dashboard/circle-analytics", icon: Users },
        { title: t('admin.geofenceManagement'), url: "/admin-dashboard/geofence-admin", icon: Navigation },
        { title: t('admin.locationData'), url: "/admin-dashboard/location-admin", icon: History },
      ]
    },
    {
      title: t('admin.sidebarEmergency', 'Emergency'),
      items: [
        { title: t('admin.emergencyIncidents'), url: "/admin-dashboard/emergencies", icon: AlertTriangle },
        { title: t('admin.safetyMonitoring'), url: "/admin-dashboard/safety", icon: Shield },
      ]
    },
    {
      title: t('admin.sidebarRegional', 'Regional'),
      items: [
        { title: t('admin.regionalHub'), url: "/admin-dashboard/regional-hub", icon: MapPin },
        { title: t('admin.regionalOrganizations'), url: "/admin-dashboard/regional-organizations", icon: Building },
        { title: t('admin.regionalUsers'), url: "/admin-dashboard/regional-users", icon: Users },
        { title: t('admin.regionalAudit'), url: "/admin-dashboard/regional-audit", icon: FileText },
        { title: 'Transfer to Care Conneqt', url: "/admin-dashboard/transfer-to-care", icon: Send },
      ]
    },
    {
      title: t('admin.sidebarProducts', 'Products'),
      items: [
        { title: t('admin.products'), url: "/admin-dashboard/products", icon: Package },
        { title: t('admin.regionalServices'), url: "/admin-dashboard/regional-services", icon: MapPin },
        { title: t('admin.subscriptionPlans'), url: "/admin-dashboard/protection-plans", icon: Shield },
        { title: 'Pricing Editor', url: "/admin-dashboard/pricing", icon: DollarSign },
        { title: 'Add-On Management', url: "/admin-dashboard/addon-management", icon: Package },
        { title: 'Trial Management', url: "/admin-dashboard/trial-management", icon: Clock },
        { title: 'Gift Management', url: "/admin-dashboard/gift-management", icon: Gift },
        { title: 'Referrals', url: "/admin-dashboard/referrals", icon: Gift },
        { title: t('admin.flickControl'), url: "/admin-dashboard/flic-control", icon: Bluetooth },
      ]
    },
    {
      title: t('admin.sidebarSystem', 'System'),
      items: [
        { title: 'Dashboards & Apps', url: "/admin-dashboard/dashboards-apps", icon: LayoutGrid },
        { title: t('admin.userActivity'), url: "/admin-dashboard/activity", icon: Activity },
        { title: t('admin.systemSettings'), url: "/admin-dashboard/settings", icon: Settings },
        { title: t('admin.reports'), url: "/admin-dashboard/reports", icon: FileText },
        { title: t('admin.appTesting'), url: "/admin-dashboard/app-testing", icon: Smartphone },
        { title: 'Health Check', url: "/admin-dashboard/health-check", icon: HeartPulse },
        { title: 'Production Check', url: "/admin-dashboard/production-check", icon: CheckCircle },
        { title: 'Go Live', url: "/admin-dashboard/go-live", icon: Rocket },
        { title: 'Stripe Setup', url: "/admin-dashboard/stripe-setup", icon: CreditCard },
        { title: 'Mobile Launch', url: "/admin-dashboard/mobile-launch", icon: Smartphone },
      ]
    }
  ];
};

function ProfileDropdown() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'AD';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium truncate">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/admin-dashboard/profile')}>
          <User className="mr-2 h-4 w-4" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();
  const adminMenuItems = useAdminMenuItems();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // State to track which sections are expanded — all collapsed by default
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isActive = (path: string) => currentPath === path;
  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} variant="sidebar">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sidebar-primary to-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            {state !== "collapsed" && (
              <div>
                <h2 className="font-bold text-lg text-sidebar-foreground">
                  {t('dashboard.iceAdmin')}
                </h2>
                <p className="text-sm text-sidebar-muted-foreground font-medium">{t('dashboard.managementDashboard')}</p>
              </div>
            )}
          </div>
        </div>

        {adminMenuItems.map((group) => {
          const isExpanded = expandedSections.has(group.title);

          return (
            <SidebarGroup key={group.title} className="px-3 py-1">
              <SidebarGroupLabel
                className={`${state === "collapsed" ? 'hidden' : 'block'} text-xs font-semibold uppercase tracking-wider px-2 py-1.5 mb-1 cursor-pointer hover:bg-white/5 rounded-md transition-colors text-white/50`}
                onClick={() => toggleSection(group.title)}
              >
                {group.title}
              </SidebarGroupLabel>

              {isExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1 mt-1">
                    {group.items.map((item, itemIndex) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="group">
                          <NavLink
                            to={item.url}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                                isActive
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'text-white/80 hover:bg-white/5 hover:text-white'
                              }`
                            }
                          >
                            <div className="p-1.5 rounded-md transition-colors">
                              <item.icon className="h-4 w-4" />
                            </div>
                            {state !== "collapsed" && (
                              <span className="font-medium text-sm">{item.title}</span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
          );
        })}

        {/* Sign Out & Home */}
        <div className="mt-auto border-t border-sidebar-border px-3 py-4">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/80 hover:bg-white/5 hover:text-white"
                >
                  <div className="p-1.5 rounded-md transition-colors">
                    <Home className="h-4 w-4" />
                  </div>
                  {state !== "collapsed" && (
                    <span className="font-medium text-sm">Home</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink
                  to="/admin-dashboard/profile"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-red-500/10 text-red-500'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <div className="p-1.5 rounded-md transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  {state !== "collapsed" && (
                    <span className="font-medium text-sm">My Profile</span>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-white/80 hover:bg-white/5 hover:text-white w-full"
                >
                  <div className="p-1.5 rounded-md transition-colors">
                    <LogOut className="h-4 w-4" />
                  </div>
                  {state !== "collapsed" && (
                    <span className="font-medium text-sm">Sign Out</span>
                  )}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminLayout() {
  console.log('🏗️ AdminLayout is rendering');
  const { t } = useTranslation();
  const { isMobile, isTablet } = useBreakpoint();
  
  // Emergency cleanup for stuck modal overlays
  React.useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && e.ctrlKey) {
        // Emergency cleanup - remove any stuck modal overlays
        const overlays = document.querySelectorAll('[data-state="open"][role="dialog"]');
        const backdrops = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        
        overlays.forEach(overlay => {
          const parent = overlay.parentElement;
          if (parent) parent.style.display = 'none';
        });
        
        backdrops.forEach(backdrop => {
          const element = backdrop as HTMLElement;
          element.style.display = 'none';
        });
        
        // Force remove any backdrop blur overlays
        const blurOverlays = document.querySelectorAll('.fixed.inset-0.z-\\[60\\]');
        blurOverlays.forEach(overlay => {
          (overlay as HTMLElement).style.display = 'none';
        });
        
        console.log('🧹 Emergency modal cleanup triggered');
      }
    };
    
    document.addEventListener('keydown', handleGlobalEscape);
    return () => document.removeEventListener('keydown', handleGlobalEscape);
  }, []);
  
  
  return (
    <SidebarProvider defaultOpen={!(isMobile || isTablet)}>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 border-b border-border/40 flex items-center px-4 md:px-6 bg-gradient-to-r from-background to-muted/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="hover:bg-muted/60 transition-colors" />
              <div className="h-6 w-px bg-border/60" />
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {t('admin.title')}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{t('admin.subtitle')}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2 md:gap-4">
              <div className="hidden sm:block"><BlogNotificationBadge /></div>
              <AdminNotificationCenter />
              <div className="hidden sm:block"><LanguageCurrencySelector compact /></div>
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-gradient-to-br from-background via-background to-muted/5 overflow-x-hidden">
            {/* Security reminder for Supabase Auth hardening */}
            <div className="max-w-5xl mx-auto mb-4">
              <SupabaseSecurityReminder />
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

