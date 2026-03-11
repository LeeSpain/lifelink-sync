import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Shield,
  Settings,
  AlertTriangle,
  Camera,
  Loader2,
  Check,
  Download,
  Monitor,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
}

interface NotificationPrefs {
  riven_daily_summary: boolean;
  new_member_alerts: boolean;
  emergency_alerts: boolean;
  system_health_alerts: boolean;
}

const AdminProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences state
  const [language, setLanguage] = useState(i18n.language || "en");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    riven_daily_summary: true,
    new_member_alerts: true,
    emergency_alerts: true,
    system_health_alerts: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        });
      }
    };
    load();
  }, [user]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: t('profile.profileUpdated') });
    } catch (err) {
      toast({
        title: t('profile.profileUpdateFailed'),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      setProfile((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));

      await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", user.id);

      toast({ title: t('profile.avatarUpdated') });
    } catch (err) {
      toast({
        title: t('profile.uploadFailed'),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: t('profile.passwordsMismatch'),
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: t('profile.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: t('profile.passwordUpdated') });
    } catch (err) {
      toast({
        title: t('profile.passwordUpdateFailed'),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      i18n.changeLanguage(language);

      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (theme === "light") {
        document.documentElement.classList.remove("dark");
      }

      toast({ title: t('profile.preferencesSaved') });
    } catch {
      toast({ title: t('profile.preferencesFailed'), variant: "destructive" });
    } finally {
      setSavingPrefs(false);
    }
  };

  // Export data
  const handleExportData = () => {
    const exportData = {
      profile,
      email: user?.email,
      preferences: { language, theme, notifications },
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-profile-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const initials =
    (profile.first_name?.[0] || "") + (profile.last_name?.[0] || "") || "A";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Section 1: Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> {t('profile.personalDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                  <span className="text-lg font-bold text-primary">
                    {initials}
                  </span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-medium text-sm">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="text-[10px] mt-1">
                {t('profile.administrator')}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t('profile.firstName')}</Label>
              <Input
                value={profile.first_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, first_name: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t('profile.lastName')}</Label>
              <Input
                value={profile.last_name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, last_name: e.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">{t('profile.email')}</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="mt-1 bg-muted"
            />
          </div>

          <div>
            <Label className="text-xs">{t('profile.phone')}</Label>
            <Input
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="+34 612 345 678"
              className="mt-1"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('profile.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> {t('profile.security')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">{t('profile.changePassword')}</h3>
            <Input
              type="password"
              placeholder={t('profile.currentPassword')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t('profile.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder={t('profile.confirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword || !newPassword || !confirmPassword}
              variant="outline"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {t('profile.updatePassword')}
            </Button>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm font-medium">
                {t('profile.twoFactor')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('profile.twoFactorDesc')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {t('profile.comingSoon')}
              </Badge>
              <Switch disabled />
            </div>
          </div>

          {/* Active Sessions */}
          <div>
            <h3 className="text-sm font-medium mb-2">{t('profile.activeSessions')}</h3>
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('profile.currentSession')}</p>
                  <p className="text-xs text-muted-foreground">
                    {navigator.userAgent.includes("Mac")
                      ? "macOS"
                      : navigator.userAgent.includes("Win")
                      ? "Windows"
                      : "Browser"}{" "}
                    · {t('profile.lastActiveNow')}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] text-green-600 border-green-500/20"
              >
                {t('profile.active')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> {t('profile.preferences')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{t('profile.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{t('profile.theme')}</Label>
              <Select
                value={theme}
                onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('profile.light')}</SelectItem>
                  <SelectItem value="dark">{t('profile.dark')}</SelectItem>
                  <SelectItem value="system">{t('profile.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold">
              {t('profile.emailNotifications')}
            </Label>
            {[
              {
                key: "riven_daily_summary" as const,
                label: t('profile.rivenDailySummary'),
              },
              {
                key: "new_member_alerts" as const,
                label: t('profile.newMemberAlerts'),
              },
              {
                key: "emergency_alerts" as const,
                label: t('profile.emergencyAlerts'),
              },
              {
                key: "system_health_alerts" as const,
                label: t('profile.systemHealthAlerts'),
              },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm">{label}</span>
                <Switch
                  checked={notifications[key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSavePreferences} disabled={savingPrefs}>
            {savingPrefs ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('profile.savePreferences')}
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> {t('profile.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile.deleteAccount')}</p>
              <p className="text-xs text-muted-foreground">
                {t('profile.deleteAccountDesc')}
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled title="Contact support to delete admin account">
              {t('profile.deleteAccountBtn')}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('profile.exportData')}</p>
              <p className="text-xs text-muted-foreground">
                {t('profile.exportDataDesc')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {t('profile.export')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
