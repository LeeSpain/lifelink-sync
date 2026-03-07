import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Globe, MapPin, Save, X } from 'lucide-react';

interface RegionalSettingsControlProps {
  userId: string;
  locationSharingEnabled: boolean;
  subscriptionRegional: boolean;
  hasSpainCallCenter: boolean;
  country?: string;
  countryCode?: string;
}

export function RegionalSettingsControl({
  userId,
  locationSharingEnabled,
  subscriptionRegional,
  hasSpainCallCenter,
  country,
  countryCode,
}: RegionalSettingsControlProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [settings, setSettings] = useState({
    location_sharing_enabled: locationSharingEnabled,
    subscription_regional: subscriptionRegional,
    has_spain_call_center: hasSpainCallCenter,
    country: country || '',
    country_code: countryCode || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Regional settings updated successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating regional settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update regional settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings({
      location_sharing_enabled: locationSharingEnabled,
      subscription_regional: subscriptionRegional,
      has_spain_call_center: hasSpainCallCenter,
      country: country || '',
      country_code: countryCode || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>Manage location and regional services</CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" size="sm" disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Sharing */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="location-sharing">Location Sharing</Label>
            <p className="text-sm text-muted-foreground">
              Allow real-time location tracking
            </p>
          </div>
          <Switch
            id="location-sharing"
            checked={settings.location_sharing_enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, location_sharing_enabled: checked })
            }
            disabled={!isEditing || isSaving}
          />
        </div>

        {/* Regional Subscription */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="regional-subscription">Regional Subscription</Label>
            <p className="text-sm text-muted-foreground">
              Access to regional emergency services
            </p>
          </div>
          <Switch
            id="regional-subscription"
            checked={settings.subscription_regional}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, subscription_regional: checked })
            }
            disabled={!isEditing || isSaving}
          />
        </div>

        {/* Spain Call Center */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="spain-call-center">Spain Call Center</Label>
            <p className="text-sm text-muted-foreground">
              Access to Spain-based emergency call center
            </p>
          </div>
          <Switch
            id="spain-call-center"
            checked={settings.has_spain_call_center}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, has_spain_call_center: checked })
            }
            disabled={!isEditing || isSaving}
          />
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          {isEditing ? (
            <Input
              id="country"
              value={settings.country}
              onChange={(e) => setSettings({ ...settings, country: e.target.value })}
              placeholder="e.g., Spain"
              disabled={isSaving}
            />
          ) : (
            <p className="text-sm">{settings.country || 'Not specified'}</p>
          )}
        </div>

        {/* Country Code */}
        <div className="space-y-2">
          <Label htmlFor="country-code">Country Code</Label>
          {isEditing ? (
            <Input
              id="country-code"
              value={settings.country_code}
              onChange={(e) => setSettings({ ...settings, country_code: e.target.value })}
              placeholder="e.g., ES"
              maxLength={2}
              disabled={isSaving}
            />
          ) : (
            <p className="text-sm">{settings.country_code || 'Not specified'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
