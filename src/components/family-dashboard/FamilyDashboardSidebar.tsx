import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Home, 
  MapPin, 
  Bell, 
  User, 
  Shield, 
  Phone,
  Heart,
  LogOut,
  Activity
} from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { cn } from '@/lib/utils';

const FamilyDashboardSidebar = () => {
  const location = useLocation();
  const { signOut } = useOptimizedAuth();
  const { data: familyRole } = useFamilyRole();

  const navigation = [
    {
      name: 'Home',
      href: '/family-dashboard',
      icon: Home,
      current: location.pathname === '/family-dashboard'
    },
    {
      name: 'Emergency Map',
      href: '/family-dashboard/emergency-map',
      icon: MapPin,
      current: location.pathname === '/family-dashboard/emergency-map',
      badge: 'Live'
    },
    {
      name: 'Live Tracking',
      href: '/family-dashboard/live-map',
      icon: Activity,
      current: location.pathname === '/family-dashboard/live-map',
      badge: 'New'
    },
    {
      name: 'Notifications',
      href: '/family-dashboard/notifications',
      icon: Bell,
      current: location.pathname === '/family-dashboard/notifications'
    },
    {
      name: 'Emergency Information',
      href: '/family-dashboard/profile',
      icon: User,
      current: location.pathname === '/family-dashboard/profile'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-border flex-shrink-0">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center h-16 px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Family Emergency</h1>
              <p className="text-xs text-muted-foreground">Safety Network</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  item.current
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <Badge 
                    variant={item.current ? "secondary" : "outline"} 
                    className="text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Family Status Card */}
        <div className="px-4 pb-4">
          <Card className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <Heart className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {familyRole?.role === 'owner' ? 'Account Owner' : 'Family Member'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {familyRole?.role === 'owner' ? 'Emergency System Manager' : 'Protected & Connected'}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3" />
                <span>Emergency alerts enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>
                  {familyRole?.role === 'owner' ? 'Full SOS control' : 'Quick SOS response'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboardSidebar;