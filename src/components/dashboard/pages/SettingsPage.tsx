import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Palette, Globe, Clock, Download, Trash2, RefreshCw, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SettingsPage() {
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
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" }
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" }
  ];

  const timezones = [
    { value: "America/New_York", label: "Eastern Time" },
    { value: "America/Chicago", label: "Central Time" },
    { value: "America/Denver", label: "Mountain Time" },
    { value: "America/Los_Angeles", label: "Pacific Time" },
    { value: "UTC", label: "UTC" }
  ];

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was an error updating your settings. Please try again.",
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
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Customize your dashboard experience and preferences</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="bg-primary hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Theme</label>
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
                <label className="text-sm font-medium mb-2 block">Language</label>
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
              <label className="text-sm font-medium mb-2 block">Timezone</label>
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
              App Behavior
            </CardTitle>
            <CardDescription>
              Configure how the app behaves and responds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Auto-sync Data</h3>
                <p className="text-xs text-muted-foreground">
                  Automatically sync your data across devices
                </p>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(checked) => updateSetting("autoSync", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Sound Effects</h3>
                <p className="text-xs text-muted-foreground">
                  Play sounds for notifications and interactions
                </p>
              </div>
              <Switch
                checked={settings.soundEffects}
                onCheckedChange={(checked) => updateSetting("soundEffects", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Haptic Feedback</h3>
                <p className="text-xs text-muted-foreground">
                  Vibrate for notifications and interactions on mobile
                </p>
              </div>
              <Switch
                checked={settings.hapticFeedback}
                onCheckedChange={(checked) => updateSetting("hapticFeedback", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Automatic Updates</h3>
                <p className="text-xs text-muted-foreground">
                  Install app updates automatically when available
                </p>
              </div>
              <Switch
                checked={settings.autoUpdates}
                onCheckedChange={(checked) => updateSetting("autoUpdates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Data Saver Mode</h3>
                <p className="text-xs text-muted-foreground">
                  Reduce data usage by limiting background sync
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
              Data Management
            </CardTitle>
            <CardDescription>
              Manage your personal data and app storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Export My Data</h3>
                <p className="text-xs text-muted-foreground">
                  Download a copy of all your data in JSON format
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Clear App Cache</h3>
                <p className="text-xs text-muted-foreground">
                  Clear temporary files to free up storage space
                </p>
              </div>
              <Button variant="outline" onClick={handleClearCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>

            <Separator />

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                  <p className="text-xs text-red-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
            <CardDescription>
              Version and system information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">App Version:</span>
                <span className="ml-2 font-medium">2.1.0</span>
              </div>
              <div>
                <span className="text-muted-foreground">Build Number:</span>
                <span className="ml-2 font-medium">1024</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-2 font-medium">Dec 15, 2024</span>
              </div>
              <div>
                <span className="text-muted-foreground">Platform:</span>
                <span className="ml-2 font-medium">Web</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}