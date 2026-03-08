import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export function SecurityPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const loginSessions = [
    {
      id: 1,
      device: t('security.currentBrowserSession'),
      location: t('security.locationUnavailable'),
      lastActive: t('security.currentSession'),
      isCurrent: true
    }
  ];

  // Calculate security score based on settings
  const calculateSecurityScore = () => {
    let score = 50; // Base score
    if (twoFactorEnabled) score += 25;
    if (biometricEnabled) score += 15;
    if (passwordForm.current || passwordForm.new) score += 10; // If password is being managed
    return Math.min(score, 100);
  };

  const securityScore = calculateSecurityScore();

  const handlePasswordChange = () => {
    // TODO: Implement password change
    console.log("Changing password");
    setPasswordForm({ current: "", new: "", confirm: "" });
  };

  const handleTwoFactorToggle = (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    // TODO: Implement 2FA setup/disable
  };

  const terminateSession = (sessionId: number) => {
    // TODO: Implement session termination
    console.log("Terminating session:", sessionId);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSecurityScoreBadge = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const saveSecuritySettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: t('security.saved'),
        description: t('security.savedDescription'),
      });
    } catch (error) {
      toast({
        title: t('security.errorSaving'),
        description: t('security.errorSavingDescription'),
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
          <h1 className="text-2xl font-bold tracking-tight">{t('security.title')}</h1>
          <p className="text-muted-foreground">{t('security.subtitle')}</p>
        </div>
        <Button
          onClick={saveSecuritySettings}
          disabled={isSaving}
          size="sm"
        >
          {isSaving ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
              {t('security.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('security.saveSettings')}
            </>
          )}
        </Button>
      </div>

        {/* Security Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('security.securityScore')}
            </CardTitle>
            <CardDescription>
              {t('security.securityScoreDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{securityScore}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 bg-muted rounded-full flex-1">
                    <div
                      className={`h-full rounded-full ${securityScore >= 80 ? 'bg-primary' : securityScore >= 60 ? 'bg-muted-foreground' : 'bg-destructive'}`}
                      style={{ width: `${securityScore}%` }}
                    ></div>
                  </div>
                  <Badge variant={getSecurityScoreBadge(securityScore) as "default" | "secondary" | "destructive"}>
                    {securityScore >= 80 ? t('security.excellent') : securityScore >= 60 ? t('security.good') : t('security.needsImprovement')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('security.scoreExplanation')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('security.passwordAuthentication')}
            </CardTitle>
            <CardDescription>
              {t('security.passwordAuthenticationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">{t('security.changePassword')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-password">{t('security.currentPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="new-password">{t('security.newPassword')}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="confirm-password">{t('security.confirmNewPassword')}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={handlePasswordChange}>{t('security.updatePassword')}</Button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">{t('security.twoFactorAuth')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('security.twoFactorAuthDescription')}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
              </div>
              
              {!twoFactorEnabled && (
                <div className="bg-muted/50 border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{t('security.recommended')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('security.enable2faMessage')}
                  </p>
                </div>
              )}
            </div>

            {/* Biometric Authentication */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">{t('security.biometricAuth')}</h3>
                  <p className="text-xs text-muted-foreground">
                    {t('security.biometricAuthDescription')}
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={setBiometricEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {t('security.activeSessions')}
            </CardTitle>
            <CardDescription>
              {t('security.activeSessionsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        {session.device}
                        {session.isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            {t('security.current')}
                          </Badge>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">{session.location}</p>
                      <p className="text-xs text-muted-foreground">{session.lastActive}</p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => terminateSession(session.id)}
                    >
                      {t('security.terminate')}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('security.privacySettings')}</CardTitle>
            <CardDescription>
              {t('security.privacySettingsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('security.dataCollection')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('security.dataCollectionDescription')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('security.locationHistory')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('security.locationHistoryDescription')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">{t('security.thirdPartySharing')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('security.thirdPartySharingDescription')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}