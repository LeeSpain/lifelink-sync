import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  Wifi,
  Battery,
  Signal,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmergencyStatusProps {
  location: boolean;
  contacts: number;
  network: boolean;
  battery: number;
  lastUpdated?: Date;
}

interface ActiveIncidentProps {
  id: string;
  status: 'active' | 'acknowledged' | 'resolved';
  startTime: Date;
  contactsNotified: number;
  responseTime?: number;
  location?: string;
}

export const EmergencyStatus: React.FC<EmergencyStatusProps> = ({
  location,
  contacts,
  network,
  battery,
  lastUpdated = new Date()
}) => {
  const getOverallStatus = () => {
    if (!location || contacts === 0) return 'warning';
    if (!network || battery < 20) return 'error';
    return 'ready';
  };

  const status = getOverallStatus();

  const statusConfig = {
    ready: {
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: CheckCircle2,
      text: 'System Ready'
    },
    warning: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: AlertTriangle,
      text: 'Needs Attention'
    },
    error: {
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: AlertTriangle,
      text: 'Critical Issues'
    }
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <Card className={cn("border-2", statusConfig[status].border, statusConfig[status].bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Emergency System Status
          </CardTitle>
          <div className={cn("flex items-center gap-2", statusConfig[status].color)}>
            <StatusIcon className="h-5 w-5" />
            <span className="font-medium">{statusConfig[status].text}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* Location Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Location Services</span>
              </div>
              <Badge variant={location ? 'default' : 'destructive'} className="text-xs">
                {location ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            {/* Emergency Contacts */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">Emergency Contacts</span>
              </div>
              <Badge variant={contacts > 0 ? 'default' : 'secondary'} className="text-xs">
                {contacts} configured
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm">Network</span>
              </div>
              <Badge variant={network ? 'default' : 'destructive'} className="text-xs">
                {network ? 'Connected' : 'Offline'}
              </Badge>
            </div>

            {/* Battery Level */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  <span className="text-sm">Battery</span>
                </div>
                <span className="text-xs font-medium">{battery}%</span>
              </div>
              <Progress 
                value={battery} 
                className={cn(
                  "h-2",
                  battery < 20 ? "text-red-500" : battery < 50 ? "text-yellow-500" : "text-green-500"
                )} 
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last system check: {lastUpdated.toLocaleTimeString()}</span>
            <div className="flex items-center gap-1">
              <Signal className="h-3 w-3" />
              <span>Live monitoring</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ActiveIncidentPanel: React.FC<{ incident: ActiveIncidentProps }> = ({ incident }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - incident.startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [incident.startTime]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    active: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500' },
    acknowledged: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500' },
    resolved: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500' }
  };

  const config = statusConfig[incident.status];

  return (
    <Card className={cn("border-2 animate-pulse", config.border, config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className={cn("h-6 w-6", config.color)} />
            ACTIVE EMERGENCY
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">
            {incident.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Duration: {formatElapsedTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{incident.contactsNotified} contacts notified</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>Location shared</span>
            </div>
            {incident.responseTime && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>Avg response: {incident.responseTime}s</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="destructive" size="sm" className="flex-1">
            Update Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const EmergencyCommandCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-white">Emergency Command Center</h2>
      
      <EmergencyStatus
        location={true}
        contacts={3}
        network={true}
        battery={85}
      />
      
      {/* Mock active incident for demo */}
      <ActiveIncidentPanel
        incident={{
          id: 'demo-incident',
          status: 'active',
          startTime: new Date(Date.now() - 120000), // 2 minutes ago
          contactsNotified: 3,
          responseTime: 45,
          location: 'New York, NY'
        }}
      />
    </div>
  );
};

export default EmergencyCommandCenter;