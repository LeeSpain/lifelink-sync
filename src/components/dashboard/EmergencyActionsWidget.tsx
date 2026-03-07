import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle,
  Bell,
  MapPin,
  Activity,
  Wifi,
  WifiOff,
  Loader2
} from "lucide-react";

interface EmergencyActionsWidgetProps {
  profile: any;
  subscription: any;
}

const EmergencyActionsWidget = ({ profile, subscription }: EmergencyActionsWidgetProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [testingSystem, setTestingSystem] = useState(false);
  const [testResults, setTestResults] = useState<string | null>(null);
  const [isConnected] = useState(true);
  const { toast } = useToast();
  const { contacts } = useEmergencyContacts();

  const emergencyContactsCount = contacts?.length || 0;
  const protectionActive = subscription?.subscribed;
  const profileComplete = (profile?.profile_completion_percentage || 0) >= 80;

  const handleEmergencyTest = async () => {
    setTestingSystem(true);
    setTestResults(null);

    try {
      toast({
        title: t('emergencyActions.testingTitle'),
        description: t('emergencyActions.testingDesc'),
        duration: 3000
      });

      await new Promise(resolve => setTimeout(resolve, 3000));

      const allSystemsGood = protectionActive && emergencyContactsCount > 0 && profileComplete;

      setTestResults(allSystemsGood ? t('emergencyActions.allOperational') : t('emergencyActions.issuesDetected'));

      toast({
        title: allSystemsGood ? t('emergencyActions.systemsHealthy') : t('emergencyActions.issuesFound'),
        description: allSystemsGood
          ? t('emergencyActions.systemsOk')
          : t('emergencyActions.reviewProfile'),
        variant: allSystemsGood ? "default" : "destructive",
        duration: 5000
      });
    } catch (error) {
      setTestResults(t('emergencyActions.testFailed'));
      toast({
        title: t('emergencyActions.testFailedTitle'),
        description: t('emergencyActions.testFailedDesc'),
        variant: "destructive"
      });
    } finally {
      setTestingSystem(false);
    }
  };

  const handleQuickCall = () => {
    if (emergencyContactsCount === 0) {
      toast({
        title: t('emergencyActions.noEmergencyContacts'),
        description: t('emergencyActions.addContactsFirst'),
        variant: "destructive"
      });
      return;
    }

    if (contacts && contacts[0]?.phone) {
      toast({
        title: t('emergencyActions.callingContact'),
        description: `${contacts[0].name}...`,
        duration: 3000
      });
      window.open(`tel:${contacts[0].phone}`, '_self');
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://maps.google.com?q=${latitude},${longitude}`;

          if (navigator.share) {
            navigator.share({
              title: 'My Emergency Location',
              text: 'Here is my current location for emergency purposes',
              url: mapsUrl
            });
          } else {
            navigator.clipboard.writeText(mapsUrl);
            toast({
              title: t('emergencyActions.locationCopied'),
              description: t('emergencyActions.locationCopiedDesc'),
              duration: 3000
            });
          }
        },
        () => {
          toast({
            title: t('emergencyActions.locationDenied'),
            description: t('emergencyActions.enableLocationAccess'),
            variant: "destructive"
          });
        }
      );
    }
  };

  const emergencyActions = [
    {
      title: t('emergencyActions.systemCheck'),
      description: testResults || (testingSystem ? t('emergencyActions.testingSystems') : t('emergencyActions.testAllSystems')),
      icon: testingSystem ? Loader2 : Shield,
      action: handleEmergencyTest,
      disabled: testingSystem,
      status: testResults ? (testResults.includes(t('emergencyActions.allOperational')) ? "success" : "warning") : null
    },
    {
      title: t('emergencyActions.quickCall'),
      description: emergencyContactsCount > 0
        ? `${contacts?.[0]?.name || t('liveStatus.familyMember')}`
        : t('emergencyActions.noContactsAvailable'),
      icon: Phone,
      action: handleQuickCall,
      disabled: emergencyContactsCount === 0
    },
    {
      title: t('emergencyActions.shareLocation'),
      description: t('emergencyActions.sendLocation'),
      icon: MapPin,
      action: handleShareLocation
    }
  ];

  const nextSteps = [];

  if (!protectionActive) {
    nextSteps.push({
      title: t('emergencyActions.activateProtection'),
      description: t('emergencyActions.subscribeServices'),
      icon: Shield,
      action: () => navigate('/member-dashboard/subscription'),
      priority: "high"
    });
  }

  if (emergencyContactsCount < 3) {
    nextSteps.push({
      title: t('emergencyActions.addEmergencyContacts'),
      description: `${3 - emergencyContactsCount} more`,
      icon: Phone,
      action: () => navigate('/member-dashboard/connections'),
      priority: "medium"
    });
  }

  if (!profileComplete) {
    nextSteps.push({
      title: t('emergencyActions.completeProfile'),
      description: t('emergencyActions.fillDetails'),
      icon: CheckCircle,
      action: () => navigate('/member-dashboard/profile'),
      priority: "low"
    });
  }

  return (
    <div className="space-y-4">
      {/* Emergency Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {t('emergencyActions.title')}
            <div className="ml-auto flex items-center gap-1.5">
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-destructive" />
              )}
              <Activity className="h-3 w-3 text-green-500 animate-pulse" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {emergencyActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              disabled={action.disabled}
              className={`w-full justify-start h-auto p-3 transition-all ${
                action.status === 'success' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
                action.status === 'warning' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' : ''
              }`}
              size="sm"
            >
              <action.icon className={`h-4 w-4 mr-3 flex-shrink-0 ${
                testingSystem && action.icon === Loader2 ? 'animate-spin' : 'text-muted-foreground'
              }`} />
              <div className="text-left flex-1">
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
              {action.status && (
                <div className="ml-2">
                  {action.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('emergencyActions.nextSteps')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextSteps.slice(0, 2).map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={step.action}
              >
                <div className="p-1.5 rounded-lg bg-muted">
                  <step.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Safety Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('emergencyActions.systemStatus')}
            {testResults && (
              <Badge variant={testResults.includes(t('emergencyActions.allOperational')) ? "default" : "destructive"} className="ml-auto text-xs">
                {testResults.includes(t('emergencyActions.allOperational')) ? t('emergencyActions.ok') : t('emergencyActions.attention')}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('emergencyActions.protection')}</span>
            <Badge variant={protectionActive ? "default" : "outline"} className="text-xs">
              {protectionActive ? t('emergencyActions.activeStatus') : t('emergencyActions.inactiveStatus')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('emergencyActions.contacts')}</span>
            <div className="flex items-center gap-1.5">
              {emergencyContactsCount >= 3 ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
              <span className="text-xs text-muted-foreground">{emergencyContactsCount}/5</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('emergencyActions.profile')}</span>
            <div className="flex items-center gap-1.5">
              {profileComplete ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
              <span className="text-xs text-muted-foreground">{profile?.profile_completion_percentage || 0}%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">{t('emergencyActions.connectionLabel')}</span>
            <div className="flex items-center gap-1.5">
              {isConnected ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? t('emergencyActions.online') : t('emergencyActions.offline')}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyActionsWidget;
