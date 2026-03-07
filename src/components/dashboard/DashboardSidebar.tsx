import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  User,
  Settings,
  CreditCard,
  Activity,
  MapPin,
  Users,
  Shield,
  Bell,
  HelpCircle,
  Package,
  Smartphone,
  Map,
  Navigation,
  History,
  UserPlus
} from "lucide-react";
import { useTranslation } from 'react-i18next';

const useDashboardItems = () => {
  const { t } = useTranslation();
  
  const dashboardItems = [
    {
      title: t('dashboard.overview'),
      url: "/member-dashboard",
      icon: LayoutDashboard
    },
    {
      title: t('dashboard.profile'),
      url: "/member-dashboard/profile",
      icon: User
    },
    {
      title: t('dashboard.myProducts'),
      url: "/member-dashboard/products",
      icon: Package
    },
    {
      title: t('dashboard.activity'),
      url: "/member-dashboard/activity",
      icon: Activity
    },
    {
      title: t('dashboard.mobileApp'),
      url: "/member-dashboard/mobile-app",
      icon: Smartphone
    }
  ];

  const familyCircleItems = [
    {
      title: "Family Connections",
      url: "/member-dashboard/connections",
      icon: UserPlus
    },
    {
      title: t('dashboard.liveFamilyMap'),
      url: "/member-dashboard/live-map",
      icon: Map
    },
    {
      title: t('dashboard.myCircles'),
      url: "/member-dashboard/circles",
      icon: Users
    },
    {
      title: t('dashboard.placesGeofences'),
      url: "/member-dashboard/places",
      icon: Navigation
    },
    {
      title: t('dashboard.locationHistory'),
      url: "/member-dashboard/location-history",
      icon: History
    }
  ];

  const settingsItems = [
    {
      title: t('dashboard.subscription'),
      url: "/member-dashboard/subscription",
      icon: CreditCard
    },
    {
      title: t('dashboard.notifications'),
      url: "/member-dashboard/notifications",
      icon: Bell
    },
    {
      title: t('dashboard.security'),
      url: "/member-dashboard/security",
      icon: Shield
    },
    {
      title: t('dashboard.settings'),
      url: "/member-dashboard/settings",
      icon: Settings
    },
    {
      title: t('dashboard.support'),
      url: "/member-dashboard/support",
      icon: HelpCircle
    }
  ];
  
  return { dashboardItems, familyCircleItems, settingsItems };
};

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { t } = useTranslation();
  const { dashboardItems, familyCircleItems, settingsItems } = useDashboardItems();

  const isActive = (path: string) => {
    if (path === '/member-dashboard') {
      return currentPath === '/member-dashboard';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => {
    const active = isActive(path);
    return active 
      ? "bg-sidebar-accent/50 border border-sidebar-primary/20" 
      : "hover:bg-sidebar-accent/30 border border-transparent";
  };

  return (
    <Sidebar
      className={collapsed ? "w-16" : "w-64"}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar-background border-sidebar-border">
        {/* Logo/Brand */}
        <div className="p-4 border-b border-sidebar-border/50">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-emergency rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-sidebar-foreground">LifeLink Sync</h2>
                <p className="text-sm text-sidebar-muted-foreground font-medium">{t('dashboard.memberPortal')}</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-emergency rounded-xl flex items-center justify-center mx-auto shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Main Dashboard Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('dashboard.overview')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {dashboardItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                     <NavLink 
                        to={item.url} 
                        end={item.url === '/member-dashboard'}
                       className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${getNavCls(item.url)}`}
                     >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                          : 'bg-sidebar-muted text-sidebar-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                       {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${
                            isActive(item.url) ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                       )}
                      {!collapsed && isActive(item.url) && (
                        <div className="w-1 h-8 bg-sidebar-primary rounded-full"></div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Separator */}
        <div className="mx-4 h-px bg-sidebar-border/50"></div>

        {/* Family Circle Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            Family Circle
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {familyCircleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${getNavCls(item.url)}`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                          : 'bg-sidebar-muted text-sidebar-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                       {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${
                            isActive(item.url) ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                       )}
                      {!collapsed && isActive(item.url) && (
                        <div className="w-1 h-8 bg-sidebar-primary rounded-full"></div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Separator */}
        <div className="mx-4 h-px bg-sidebar-border/50"></div>

        {/* Settings Navigation */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('dashboard.settings')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${getNavCls(item.url)}`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive(item.url) 
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
                          : 'bg-sidebar-muted text-sidebar-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                       {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${
                            isActive(item.url) ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                          }`}>
                            {item.title}
                          </span>
                        </div>
                       )}
                      {!collapsed && isActive(item.url) && (
                        <div className="w-1 h-8 bg-sidebar-primary rounded-full"></div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}