import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNativeMobile } from '@/hooks/useNativeMobile';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Smartphone,
  ShieldCheck,
  Battery,
  Camera,
  MapPin,
  Phone,
  Wifi
} from 'lucide-react';

export function MobileReadinessPanel() {
  const { deviceInfo, isNative, loading } = useNativeMobile();
  const { capabilities } = useNativeCapabilities();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Checking mobile readiness...</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate readiness score
  const checks = [
    {
      name: 'Native App Environment',
      status: isNative,
      critical: true,
      icon: Smartphone,
      description: 'Running as native mobile app'
    },
    {
      name: 'Camera Access',
      status: capabilities.camera,
      critical: true,
      icon: Camera,
      description: 'Required for emergency photo capture'
    },
    {
      name: 'Location Services',
      status: isNative, // Assume location is available in native
      critical: true,
      icon: MapPin,
      description: 'Critical for emergency location sharing'
    },
    {
      name: 'Emergency Calling',
      status: isNative && deviceInfo?.platform !== 'web',
      critical: true,
      icon: Phone,
      description: 'Native phone calling capabilities'
    },
    {
      name: 'Background Processing',
      status: isNative,
      critical: false,
      icon: Battery,
      description: 'Keep app active in background'
    },
    {
      name: 'Push Notifications',
      status: isNative,
      critical: false,
      icon: Wifi,
      description: 'Receive emergency alerts'
    },
    {
      name: 'Offline Capabilities',
      status: capabilities.filesystem,
      critical: false,
      icon: ShieldCheck,
      description: 'Store emergency data offline'
    }
  ];

  const criticalChecks = checks.filter(check => check.critical);
  const nonCriticalChecks = checks.filter(check => !check.critical);
  
  const criticalPassed = criticalChecks.filter(check => check.status).length;
  const nonCriticalPassed = nonCriticalChecks.filter(check => check.status).length;
  
  const totalPassed = criticalPassed + nonCriticalPassed;
  const totalChecks = checks.length;
  const readinessScore = Math.round((totalPassed / totalChecks) * 100);

  const getStatusIcon = (status: boolean, critical: boolean) => {
    if (status) {
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    } else if (critical) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: boolean, critical: boolean) => {
    if (status) {
      return (
        <Badge variant="default" className="bg-success/10 text-success-foreground">
          Ready
        </Badge>
      );
    } else if (critical) {
      return (
        <Badge variant="destructive">
          Critical
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          Optional
        </Badge>
      );
    }
  };

  const getReadinessColor = () => {
    if (criticalPassed === criticalChecks.length) {
      return readinessScore >= 80 ? 'text-success' : 'text-warning';
    }
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Readiness Assessment
        </CardTitle>
        <CardDescription>
          Emergency features availability for mobile deployment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Readiness Score */}
        <div className="text-center space-y-2">
          <div className={`text-3xl font-bold ${getReadinessColor()}`}>
            {readinessScore}%
          </div>
          <div className="text-sm text-muted-foreground">Mobile Ready</div>
          <Progress value={readinessScore} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {totalPassed} of {totalChecks} features available
          </div>
        </div>

        {/* Critical Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Critical Emergency Features</h4>
          <div className="space-y-2">
            {criticalChecks.map((check, index) => {
              const IconComponent = check.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status, check.critical)}
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(check.status, check.critical)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhancement Features */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Enhancement Features</h4>
          <div className="space-y-2">
            {nonCriticalChecks.map((check, index) => {
              const IconComponent = check.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status, check.critical)}
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">{check.name}</div>
                      <div className="text-xs text-muted-foreground">{check.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(check.status, check.critical)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Deployment Status */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium text-sm">Deployment Status</span>
          </div>
          {criticalPassed === criticalChecks.length ? (
            <div className="text-sm text-success">
              ✅ Ready for mobile deployment. All critical emergency features are available.
            </div>
          ) : (
            <div className="text-sm text-destructive">
              ⚠️ Not ready for mobile deployment. {criticalChecks.length - criticalPassed} critical feature(s) missing.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}