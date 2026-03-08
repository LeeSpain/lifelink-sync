import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Globe, Clock, Download, Trash2, RefreshCw, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export function SettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: "system",
    language: "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    autoSync: true,
    soundEffects: true,
    hapticFeedback: true,
    autoUpdates: true,
    dataSaver: false
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportData = () => {
    // TODO: Implement data export
    console.log("Exporting user data");
  };

  const handleClearCache = () => {
    // TODO: Implement cache clearing
    console.log("Clearing app cache");
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log("Account deletion requested");
  };

  const themes = [
    { value: "light", label: t('settings.themeLight') },
    { value: "dark", label: t('settings.themeDark') },
    { value: "system", label: t('settings.themeSystem') }
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" }
  ];

  const timezones = [
    { value: "America/New_York", label: t('settings.easternTime') },
    { value: "America/Chicago", label: t('settings.centralTime') },
    { value: "America/Denver", label: t('settings.mountainTime') },
    { value: "America/Los_Angeles", label: t('settings.pacificTime') },
    { value: "UTC", label: "UTC" }
  ];

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t('settings.saved'),
        description: t('settings.savedDescription'),
      });
    } catch (error) {
      toast({
        title: t('settings.errorSaving'),
        description: t('settings.errorSavingDescription'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              {t('settings.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('settings.saveSettings')}
            </>
          )}
        </Button>
      </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.appearanceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('settings.theme')}</label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('settings.language')}</label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting("language", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('settings.timezone')}</label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSetting("timezone", value)}
              >
                <SelectTrigger className="md:w-1/2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* App Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('settings.appBehavior')}
            </CardTitle>
            <CardDescription>
              {t('settings.appBehaviorDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.autoSync')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.autoSyncDescription')}
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting("autoSync", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.soundEffects')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.soundEffectsDescription')}
                </p>
              </div>
              <Switch
                checked={settings.soundEffects}
                onCheckedChange={(checked) => updateSetting("soundEffects", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.hapticFeedback')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.hapticFeedbackDescription')}
                </p>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={(checked) => updateSetting("hapticFeedback", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.autoUpdates')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.autoUpdatesDescription')}
                </p>
              </div>
              <Switch
                checked={settings.autoUpdates}
                onCheckedChange={(checked) => updateSetting("autoUpdates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.dataSaver')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.dataSaverDescription')}
                </p>
              </div>
              <Switch
                checked={settings.dataSaver}
                onCheckedChange={(checked) => updateSetting("dataSaver", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('settings.dataManagement')}
            </CardTitle>
            <CardDescription>
              {t('settings.dataManagementDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.exportData')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.exportDataDescription')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                {t('settings.export')}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('settings.clearCache')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings.clearCacheDescription')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('settings.clearCacheButton')}
              </Button>
            </div>

            <Separator />

            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{t('settings.deleteAccount')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.deleteAccountDescription')}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('settings.delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.appInformation')}</CardTitle>
            <CardDescription>
              {t('settings.appInformationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('settings.appVersion')}:</span>
                <span className="ml-2 font-medium">2.1.0</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.buildNumber')}:</span>
                <span className="ml-2 font-medium">1024</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.lastUpdated')}:</span>
                <span className="ml-2 font-medium">Dec 15, 2024</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t('settings.platform')}:</span>
                <span className="ml-2 font-medium">Web</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}