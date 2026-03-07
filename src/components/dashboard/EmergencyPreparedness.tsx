import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Phone,
  Users,
  MapPin,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConnections } from '@/hooks/useConnections';
import { useTranslation } from 'react-i18next';

interface EmergencyPreparednessProps {
  profile: any;
  subscription: any;
}

export const EmergencyPreparedness = ({ profile, subscription }: EmergencyPreparednessProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: familyConnections = [] } = useConnections('family_circle');
  const { data: trustedConnections = [] } = useConnections('trusted_contact');

  const activeFamily = familyConnections.filter(c => c.status === 'active');
  const activeTrusted = trustedConnections.filter(c => c.status === 'active');

  const getPreparednessScore = () => {
    let score = 0;
    if (subscription?.subscribed) score += 30;
    if (activeTrusted.length >= 1) score += 10;
    if (activeTrusted.length >= 3) score += 15;
    if (activeFamily.length >= 1) score += 15;
    if (activeFamily.length >= 2) score += 10;
    if (profile?.first_name && profile?.last_name) score += 5;
    if (profile?.phone) score += 5;
    if (profile?.medical_conditions?.length > 0) score += 5;
    if (profile?.location_sharing_enabled) score += 5;
    return Math.min(score, 100);
  };

  const preparednessScore = getPreparednessScore();

  const preparednessItems = [
    {
      title: t('preparedness.activeProtection'),
      status: subscription?.subscribed,
      icon: Shield,
      action: () => navigate('/member-dashboard/subscription'),
      description: subscription?.subscribed ? t('preparedness.servicesActive') : t('preparedness.activateMonitoring')
    },
    {
      title: t('preparedness.emergencyContacts'),
      status: activeTrusted.length >= 3,
      icon: Phone,
      action: () => navigate('/member-dashboard/connections'),
      description: `${activeTrusted.length}/3+ ${t('preparedness.emergencyContacts').toLowerCase()}`
    },
    {
      title: t('preparedness.familyNetwork'),
      status: activeFamily.length >= 2,
      icon: Users,
      action: () => navigate('/member-dashboard/connections'),
      description: `${activeFamily.length}/2+ ${t('preparedness.familyNetwork').toLowerCase()}`
    },
    {
      title: t('preparedness.medicalInfo'),
      status: profile?.medical_conditions?.length > 0,
      icon: Heart,
      action: () => navigate('/member-dashboard/profile'),
      description: profile?.medical_conditions?.length > 0 ? t('preparedness.medicalConfigured') : t('preparedness.addMedicalInfo')
    },
    {
      title: t('preparedness.locationSharing'),
      status: profile?.location_sharing_enabled,
      icon: MapPin,
      action: () => navigate('/member-dashboard/settings'),
      description: profile?.location_sharing_enabled ? t('preparedness.locationEnabled') : t('preparedness.enableLocation')
    }
  ];

  const completedCount = preparednessItems.filter(i => i.status).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t('preparedness.title')}
          </CardTitle>
          <Badge variant={preparednessScore >= 80 ? "default" : preparednessScore >= 60 ? "secondary" : "outline"}>
            {completedCount}/{preparednessItems.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div>
            <p className="text-3xl font-bold text-foreground">{preparednessScore}%</p>
            <p className="text-xs text-muted-foreground">{t('preparedness.emergencyReady')}</p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {preparednessScore >= 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm font-medium text-foreground">
                {preparednessScore >= 80 ? t('preparedness.fullyReady') : preparednessScore >= 60 ? t('preparedness.almostReady') : t('preparedness.setupNeeded')}
              </span>
            </div>
            <Progress value={preparednessScore} className="h-2" />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {preparednessItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
              onClick={item.action}
            >
              <div className={`p-1.5 rounded-lg ${item.status ? 'bg-green-50 dark:bg-green-950/30' : 'bg-muted'}`}>
                <item.icon className={`h-4 w-4 ${item.status ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-foreground">{item.title}</p>
                  {item.status ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">{t('preparedness.actionNeeded')}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>

              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* Quick Setup */}
        {preparednessScore < 80 && (
          <Button
            onClick={() => navigate('/member-dashboard/connections')}
            className="w-full"
            size="sm"
            variant="outline"
          >
            {t('preparedness.completeSetup')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
