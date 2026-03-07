import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNativeMobile } from '@/hooks/useNativeMobile';
import { useNativeCapabilities } from '@/hooks/useNativeCapabilities';
import { 
  Smartphone, 
  Battery, 
  Wifi, 
  Camera, 
  Share2, 
  Clipboard,
  HardDrive,
  Settings,
  Vibrate,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export function MobileStatus() {
  const { deviceInfo, appState, isNative, loading, triggerHaptic } = useNativeMobile();
  const { capabilities } = useNativeCapabilities();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading device information...</div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (available: boolean) => (
    available ? (
      <Badge variant="default" className="bg-success/10 text-success-foreground">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Available
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Unavailable
      </Badge>
    )
  );

  const testHaptics = async () => {
    try {
      await triggerHaptic();
    } catch (error) {
      console.error('Haptics test failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Device Information
          </CardTitle>
          <CardDescription>
            Current device and platform details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Platform</div>
              <div className="text-muted-foreground">{deviceInfo?.platform || 'Web'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Operating System</div>
              <div className="text-muted-foreground">{deviceInfo?.operatingSystem || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">OS Version</div>
              <div className="text-muted-foreground">{deviceInfo?.osVersion || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Model</div>
              <div className="text-muted-foreground">{deviceInfo?.model || 'Unknown'}</div>
            </div>
          </div>

          {deviceInfo?.batteryLevel !== undefined && (
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
              <Battery className="h-4 w-4" />
              <span className="text-sm">
                Battery: {Math.round(deviceInfo.batteryLevel * 100)}%
                {deviceInfo.isCharging && ' (Charging)'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm">Native App Mode</span>
            {isNative ? (
              <Badge variant="default" className="bg-success/10 text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Web Mode
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mobile Capabilities
          </CardTitle>
          <CardDescription>
            Available native device features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="text-sm">Camera Access</span>
              </div>
              {getStatusBadge(capabilities.camera)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="text-sm">File System</span>
              </div>
              {getStatusBadge(capabilities.filesystem)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Native Sharing</span>
              </div>
              {getStatusBadge(capabilities.share)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clipboard className="h-4 w-4" />
                <span className="text-sm">Clipboard Access</span>
              </div>
              {getStatusBadge(capabilities.clipboard)}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4" />
                <span className="text-sm">Haptic Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(isNative)}
                {isNative && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testHaptics}
                    className="h-6 px-2 text-xs"
                  >
                    Test
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            App State
          </CardTitle>
          <CardDescription>
            Current application status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">App Active</span>
            {appState.isActive ? (
              <Badge variant="default" className="bg-success/10 text-success-foreground">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                Background
              </Badge>
            )}
          </div>

          {appState.urlOpen && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="text-sm font-medium">Last URL Opened</div>
              <div className="text-xs text-muted-foreground break-all">
                {appState.urlOpen}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}