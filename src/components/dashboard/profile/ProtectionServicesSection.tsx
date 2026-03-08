import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Phone, 
  MapPin, 
  Users, 
  Smartphone, 
  Heart,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  ArrowRight,
  Star,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

interface ProtectionServicesSectionProps {
  profile: any;
}

const ProtectionServicesSection = ({ profile }: ProtectionServicesSectionProps) => {
  const { t } = useTranslation();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [familyConnections, setFamilyConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProtectionData();
  }, []);

  const loadProtectionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load subscription data
      const { data: subscription } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Load emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      // Load family connections
      const { data: family } = await supabase
        .from('family_memberships')
        .select('*, family_groups(*)')
        .eq('user_id', user.id);

      setSubscriptionData(subscription);
      setEmergencyContacts(contacts || []);
      setFamilyConnections(family || []);
    } catch (error) {
      console.error('Error loading protection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProtectionScore = () => {
    let score = 0;
    
    // Subscription tier scoring
    if (subscriptionData?.subscribed) {
      if (subscriptionData.subscription_tier === 'Enterprise') score += 40;
      else if (subscriptionData.subscription_tier === 'Premium') score += 30;
      else score += 20;
    }

    // Emergency contacts scoring
    score += Math.min(emergencyContacts.length * 10, 30);

    // Family connections scoring
    score += Math.min(familyConnections.length * 10, 20);

    // Profile completion scoring
    const profileFields = [
      profile?.first_name,
      profile?.last_name,
      profile?.phone,
      profile?.address,
      profile?.country
    ].filter(Boolean);
    score += Math.min(profileFields.length * 2, 10);

    return Math.min(score, 100);
  };

  const services = [
    {
      id: 'emergency_sos',
      name: t('profileSection.emergencySos'),
      description: t('profileSection.emergencySosDesc'),
      icon: Phone,
      status: emergencyContacts.length > 0 ? 'active' : 'setup_required',
      data: t('profileSection.contactsOfMax', { count: emergencyContacts.length }),
      premium: false
    },
    {
      id: 'family_circle',
      name: t('profileSection.familyCircle'),
      description: t('profileSection.familyCircleDesc'),
      icon: Users,
      status: familyConnections.length > 0 ? 'active' : 'available',
      data: t('profileSection.membersCount', { count: familyConnections.length }),
      premium: true
    },
    {
      id: 'location_services',
      name: t('profileSection.locationServices'),
      description: t('profileSection.locationServicesDesc'),
      icon: MapPin,
      status: profile?.country ? 'active' : 'setup_required',
      data: profile?.country || t('profileSection.notConfigured'),
      premium: false
    },
    {
      id: 'regional_center',
      name: t('profileSection.regionalCallCenter'),
      description: t('profileSection.regionalCallCenterDesc'),
      icon: Globe,
      status: profile?.country === 'ES' ? 'active' : 'not_available',
      data: profile?.country === 'ES' ? t('profileSection.spainCenter') : t('profileSection.notInCoverageArea'),
      premium: true
    },
    {
      id: 'health_profile',
      name: t('profileSection.medicalProfile'),
      description: t('profileSection.medicalProfileDesc'),
      icon: Heart,
      status: (profile?.blood_type || profile?.allergies?.length || profile?.medications?.length) ? 'active' : 'setup_required',
      data: t('profileSection.itemsCount', { count: [profile?.blood_type, ...(profile?.allergies || []), ...(profile?.medications || [])].filter(Boolean).length }),
      premium: false
    },
    {
      id: 'device_integration',
      name: t('profileSection.deviceIntegration'),
      description: t('profileSection.deviceIntegrationDesc'),
      icon: Smartphone,
      status: 'available',
      data: t('profileSection.noDevicesConnected'),
      premium: true
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />{t('profileSection.active')}</Badge>;
      case 'setup_required':
        return <Badge variant="outline" className="gap-1 border-orange-200 text-orange-700"><Clock className="h-3 w-3" />{t('profileSection.setupRequired')}</Badge>;
      case 'available':
        return <Badge variant="secondary" className="gap-1">{t('profileSection.available')}</Badge>;
      case 'not_available':
        return <Badge variant="outline" className="gap-1 border-muted text-muted-foreground">{t('profileSection.notAvailable')}</Badge>;
      default:
        return <Badge variant="outline">{t('profileSection.unknown')}</Badge>;
    }
  };

  const protectionScore = getProtectionScore();

  return (
    <div className="space-y-6">
      {/* Protection Score Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{t('profileSection.protectionScore')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('profileSection.emergencyPreparednessLevel')}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{protectionScore}</div>
              <div className="text-sm text-muted-foreground">{t('profileSection.outOf100')}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={protectionScore} className="h-3 mb-4" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {protectionScore >= 80 ? t('profileSection.excellentProtection') :
               protectionScore >= 60 ? t('profileSection.goodProtection') :
               protectionScore >= 40 ? t('profileSection.basicProtection') : t('profileSection.needsImprovement')}
            </span>
            {protectionScore < 100 && (
              <Button variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                {t('profileSection.improveScore')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Subscription */}
      {subscriptionData?.subscribed && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    LifeLink Sync {subscriptionData.subscription_tier}
                    <Badge variant="default">{t('profileSection.active')}</Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {subscriptionData.subscription_end && 
                      t('profileSection.validUntil', { date: new Date(subscriptionData.subscription_end).toLocaleDateString() })
                    }
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t('profileSection.manage')}
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Services Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('profileSection.yourProtectionServices')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.premium && (
                          <Badge variant="outline" className="text-xs">{t('profileSection.premium')}</Badge>
                        )}
                        {getStatusBadge(service.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{service.data}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {protectionScore < 100 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              {t('profileSection.recommendationsToImprove')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {emergencyContacts.length === 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{t('profileSection.addEmergencyContacts')}</p>
                    <p className="text-xs text-muted-foreground">{t('profileSection.addUpTo5Contacts')}</p>
                  </div>
                  <Button size="sm" variant="outline">{t('profileSection.setup')}</Button>
                </div>
              )}
              {!subscriptionData?.subscribed && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{t('profileSection.upgradeToPremium')}</p>
                    <p className="text-xs text-muted-foreground">{t('profileSection.accessAdvancedFeatures')}</p>
                  </div>
                  <Button size="sm">{t('profileSection.upgrade')}</Button>
                </div>
              )}
              {familyConnections.length === 0 && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{t('profileSection.connectFamilyMembers')}</p>
                    <p className="text-xs text-muted-foreground">{t('profileSection.shareLocationWithFamily')}</p>
                  </div>
                  <Button size="sm" variant="outline">{t('profileSection.connect')}</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProtectionServicesSection;