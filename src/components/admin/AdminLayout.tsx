
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
  CreditCard,
  Monitor,
  Globe,
  Inbox,
  MessageCircle,
  FlaskConical
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
      title: 'Overview',
      items: [
        { title: 'Dashboard', url: "/admin-dashboard", icon: BarChart3 },
        { title: 'Live Dashboard', url: "/admin-dashboard/live-dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: 'CLARA AI',
      items: [
        { title: 'Command Centre', url: "/admin-dashboard/command-centre", icon: Monitor },
        { title: 'Clara Activity', url: "/admin-dashboard/clara-activity", icon: Activity },
        { title: 'PA Dashboard', url: "/admin-dashboard/pa-dashboard", icon: Bot },
        { title: 'AI Agent Config', url: "/admin-dashboard/ai-agent-config", icon: Settings2 },
        { title: 'AI Settings', url: "/admin-dashboard/ai-settings", icon: Sliders },
        { title: 'AI Model Settings', url: "/admin-dashboard/ai-model-settings", icon: Cpu },
        { title: 'Constitution', url: "/admin-dashboard/constitution", icon: Shield },
        { title: 'Budget Control', url: "/admin-dashboard/budget-control", icon: DollarSign },
        { title: 'Training Data', url: "/admin-dashboard/ai-training", icon: BookOpen },
        { title: 'Riven Marketing', url: "/admin-dashboard/riven-marketing", icon: Brain },
      ]
    },
    {
      title: 'Growth',
      items: [
        { title: 'Leads', url: "/admin-dashboard/leads", icon: Target },
        { title: 'Lead Intelligence', url: "/admin-dashboard/lead-intelligence", icon: Brain },
        { title: 'Manual Invite', url: "/admin-dashboard/manual-invite", icon: Send },
        { title: 'Conversations', url: "/admin-dashboard/conversations", icon: MessageSquare },
        { title: 'Referrals', url: "/admin-dashboard/referrals", icon: Gift },
      ]
    },
    {
      title: 'Customers',
      items: [
        { title: 'All Customers', url: "/admin-dashboard/customers", icon: Users },
        { title: 'Subscriptions', url: "/admin-dashboard/subscriptions", icon: Database },
        { title: 'Trials', url: "/admin-dashboard/trial-management", icon: Clock },
        { title: 'Family Accounts', url: "/admin-dashboard/families", icon: Heart },
      ]
    },
    {
      title: 'Commerce',
      items: [
        { title: 'Gift Orders', url: "/admin-dashboard/gift-management", icon: Gift },
        { title: 'Products', url: "/admin-dashboard/products", icon: Package },
        { title: 'Add-Ons & Pricing', url: "/admin-dashboard/addon-management", icon: CreditCard },
      ]
    },
    {
      title: 'Communications',
      items: [
        { title: 'Contact Submissions', url: "/admin-dashboard/contact-submissions", icon: Inbox },
        { title: 'Communication Centre', url: "/admin-dashboard/communication", icon: MessageCircle },
        { title: 'Email Management', url: "/admin-dashboard/email-management", icon: Mail },
        { title: 'Facebook', url: "/admin-dashboard/facebook", icon: Globe },
      ]
    },
    {
      title: 'Operations',
      items: [
        { title: 'Emergencies', url: "/admin-dashboard/emergencies", icon: AlertTriangle },
        { title: 'Safety Monitoring', url: "/admin-dashboard/safety", icon: Shield },
        { title: 'Live Map', url: "/admin-dashboard/live-map-monitor", icon: Map },
        { title: 'Regional Hub', url: "/admin-dashboard/regional-hub", icon: Globe },
      ]
    },
    {
      title: 'Settings',
      items: [
        { title: 'System Settings', url: "/admin-dashboard/settings", icon: Settings },
        { title: 'WhatsApp Settings', url: "/admin-dashboard/whatsapp", icon: Phone },
        { title: 'Health Monitor', url: "/admin-dashboard/health-check", icon: HeartPulse },
      ]
    },
    {
      title: 'System',
      items: [
        { title: 'User Activity', url: "/admin-dashboard/activity", icon: Clock },
        { title: 'Reports', url: "/admin-dashboard/reports", icon: FileText },
      ]
    },
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
          <main className="flex-1 overflow-y-auto min-w-0 bg-gray-50">
            {/* Security reminder for Supabase Auth hardening */}
            <div className="px-8 pt-4">
              <SupabaseSecurityReminder />
            </div>
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

