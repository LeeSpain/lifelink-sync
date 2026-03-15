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
  Users,
  Shield,
  HelpCircle,
  Package,
  LogOut,
  Home,
  Gift,
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const useDashboardItems = () => {
  const { t } = useTranslation();

  const mySafetyItems = [
    { title: t('dashboard.overview'),   url: "/member-dashboard",          icon: LayoutDashboard },
    { title: t('dashboard.profile'),    url: "/member-dashboard/profile",   icon: User },
    { title: t('dashboard.myProducts'), url: "/member-dashboard/products",  icon: Package },
  ];

  const familyCircleItems = [
    { title: t('dashboard.myFamily', { defaultValue: 'My Family' }), url: "/member-dashboard/family", icon: Users },
  ];

  const referralItems = [
    { title: t('referral.navTitle', { defaultValue: 'Refer & Earn' }), url: "/member-dashboard/referrals", icon: Gift },
  ];

  const accountItems = [
    { title: t('dashboard.subscription'), url: "/member-dashboard/subscription", icon: CreditCard },
    { title: t('dashboard.settings'),     url: "/member-dashboard/settings",     icon: Settings },
    { title: t('dashboard.support'),      url: "/member-dashboard/support",      icon: HelpCircle },
  ];

  return { mySafetyItems, familyCircleItems, referralItems, accountItems };
};

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { t } = useTranslation();
  const { mySafetyItems, familyCircleItems, referralItems, accountItems } = useDashboardItems();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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

  const renderItems = (items: { title: string; url: string; icon: React.ElementType }[]) =>
    items.map((item) => (
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
              <div className="w-1 h-8 bg-sidebar-primary rounded-full" />
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
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

        {/* MY SAFETY */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('dashboard.mySafety', { defaultValue: 'My Safety' })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderItems(mySafetyItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 h-px bg-sidebar-border/50" />

        {/* FAMILY CIRCLE */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('dashboard.familyCircleLabel')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderItems(familyCircleItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 h-px bg-sidebar-border/50" />

        {/* REFER & EARN */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('referral.sidebarLabel', { defaultValue: 'Refer & Earn' })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderItems(referralItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 h-px bg-sidebar-border/50" />

        {/* ACCOUNT */}
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-semibold text-xs uppercase tracking-wider mb-3">
            {t('dashboard.account', { defaultValue: 'Account' })}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {renderItems(accountItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-4 h-px bg-sidebar-border/50" />

        {/* Home + Sign Out */}
        <SidebarGroup className="px-3 py-4 mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group hover:bg-sidebar-accent/30 border border-transparent"
                  >
                    <div className="p-1.5 rounded-lg transition-colors bg-sidebar-muted text-sidebar-muted-foreground group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground">
                      <Home className="h-4 w-4" />
                    </div>
                    {!collapsed && (
                      <span className="text-sm font-medium text-sidebar-foreground group-hover:text-sidebar-accent-foreground">
                        {t('dashboard.home')}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent w-full"
                  >
                    <div className="p-1.5 rounded-lg transition-colors bg-sidebar-muted text-sidebar-muted-foreground group-hover:bg-red-100 group-hover:text-red-600 dark:group-hover:bg-red-950/30">
                      <LogOut className="h-4 w-4" />
                    </div>
                    {!collapsed && (
                      <span className="text-sm font-medium text-sidebar-foreground group-hover:text-red-600">
                        {t('dashboard.signOut')}
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
