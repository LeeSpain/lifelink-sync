import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bell, Smartphone, Mail, MessageSquare, AlertTriangle, Users, MapPin, Save, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emergencyAlerts: true,
    familyUpdates: true,
    locationAlerts: true,
    systemUpdates: false,
    marketingEmails: false,
    
    emergencyMethod: "all",
    familyMethod: "push",
    locationMethod: "push",
    systemMethod: "email",
    
    quietHours: true,
    quietStart: "22:00",
    quietEnd: "07:00"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('communication_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setSettings(prev => ({
            ...prev,
            marketingEmails: data.marketing_emails || false,
            emergencyMethod: data.preferred_channel || "all"
          }));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('communication_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: settings.emergencyAlerts || settings.familyUpdates || settings.locationAlerts || settings.systemUpdates,
          marketing_emails: settings.marketingEmails,
          preferred_channel: settings.emergencyMethod,
          whatsapp_notifications: settings.emergencyMethod === "all" || settings.emergencyMethod === "sms"
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: t('notifications.saved'),
        description: t('notifications.savedDescription'),
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: t('notifications.errorSaving'),
        description: t('notifications.errorSavingDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      id: "emergency",
      title: t('notifications.emergencyAlerts'),
      description: t('notifications.emergencyAlertsDescription'),
      icon: AlertTriangle,
      setting: "emergencyAlerts",
      methodSetting: "emergencyMethod",
      color: "text-emergency"
    },
    {
      id: "family",
      title: t('notifications.familyUpdates'),
      description: t('notifications.familyUpdatesDescription'),
      icon: Users,
      setting: "familyUpdates",
      methodSetting: "familyMethod",
      color: "text-primary"
    },
    {
      id: "location",
      title: t('notifications.locationNotifications'),
      description: t('notifications.locationNotificationsDescription'),
      icon: MapPin,
      setting: "locationAlerts",
      methodSetting: "locationMethod",
      color: "text-accent"
    },
    {
      id: "system",
      title: t('notifications.systemUpdates'),
      description: t('notifications.systemUpdatesDescription'),
      icon: Bell,
      setting: "systemUpdates",
      methodSetting: "systemMethod",
      color: "text-muted-foreground"
    }
  ];

  const deliveryMethods = [
    { value: "all", label: t('notifications.pushEmailSms') },
    { value: "push", label: t('notifications.pushOnly') },
    { value: "email", label: t('notifications.emailOnly') },
    { value: "sms", label: t('notifications.smsOnly') },
    { value: "none", label: t('notifications.disabled') }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('notifications.title')}</h1>
          <p className="text-muted-foreground">{t('notifications.subtitle')}</p>
        </div>
        <Button
          onClick={savePreferences}
          disabled={isSaving || isLoading}
          size="sm"
        >
          {isSaving ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              {t('notifications.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('notifications.savePreferences')}
            </>
          )}
        </Button>
      </div>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('notifications.categories')}</CardTitle>
            <CardDescription>
              {t('notifications.categoriesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.id} className="space-y-3 pb-6 border-b last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <type.icon className={`h-5 w-5 ${type.color}`} />
                    <div>
                      <h3 className="text-sm font-semibold">{type.title}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[type.setting as keyof typeof settings] as boolean}
                    onCheckedChange={(checked) => updateSetting(type.setting, checked)}
                  />
                </div>
                
                {settings[type.setting as keyof typeof settings] && (
                  <div className="ml-13 pt-2">
                    <label className="text-sm font-medium text-muted-foreground">{t('notifications.deliveryMethod')}</label>
                    <Select
                      value={settings[type.methodSetting as keyof typeof settings] as string}
                      onValueChange={(value) => updateSetting(type.methodSetting, value)}
                    >
                      <SelectTrigger className="w-full max-w-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deliveryMethods.map((method) => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications.quietHours')}
            </CardTitle>
            <CardDescription>
              {t('notifications.quietHoursDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t('notifications.enableQuietHours')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.emergencyStillComeThrough')}
                </p>
              </div>
              <Switch
                checked={settings.quietHours}
                onCheckedChange={(checked) => updateSetting("quietHours", checked)}
              />
            </div>
            
            {settings.quietHours && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium">{t('notifications.startTime')}</label>
                  <Select
                    value={settings.quietStart}
                    onValueChange={(value) => updateSetting("quietStart", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t('notifications.endTime')}</label>
                  <Select
                    value={settings.quietEnd}
                    onValueChange={(value) => updateSetting("quietEnd", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, '0');
                        return (
                          <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('notifications.deliveryChannels')}</CardTitle>
            <CardDescription>
              {t('notifications.deliveryChannelsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">{t('notifications.pushNotifications')}</h3>
                  <p className="text-xs text-muted-foreground">{t('notifications.mobileAppAlerts')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">{t('notifications.email')}</h3>
                  <p className="text-xs text-muted-foreground">{t('notifications.emailNotifications')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">{t('notifications.sms')}</h3>
                  <p className="text-xs text-muted-foreground">{t('notifications.textMessages')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{t('notifications.marketingCommunications')}</CardTitle>
            <CardDescription>
              {t('notifications.marketingDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">{t('notifications.promotionalEmails')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('notifications.promotionalEmailsDescription')}
                </p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
              />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}