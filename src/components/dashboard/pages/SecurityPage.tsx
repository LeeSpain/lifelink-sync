import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SecurityPage() {
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
      device: "Current Browser Session",
      location: "Location unavailable",
      lastActive: "Current session",
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
        title: "Security settings saved",
        description: "Your security preferences have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: "There was an error updating your security settings. Please try again.",
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
          <h1 className="text-2xl font-bold tracking-tight">Security</h1>
          <p className="text-muted-foreground">Manage your account security and privacy settings</p>
        </div>
        <Button 
          onClick={saveSecuritySettings} 
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

        {/* Security Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Score
            </CardTitle>
            <CardDescription>
              Your overall account security rating based on current settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{securityScore}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-2 bg-muted rounded-full flex-1">
                    <div 
                      className={`h-full rounded-full ${securityScore >= 80 ? 'bg-green-500' : securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${securityScore}%` }}
                    ></div>
                  </div>
                  <Badge variant={getSecurityScoreBadge(securityScore) as "default" | "secondary" | "destructive"}>
                    {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your security score is calculated based on password strength, two-factor authentication, and other security features.
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
              Password & Authentication
            </CardTitle>
            <CardDescription>
              Manage your password and authentication methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
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
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={handlePasswordChange}>Update Password</Button>
            </div>

            {/* Two-Factor Authentication */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handleTwoFactorToggle}
                />
              </div>
              
              {!twoFactorEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Recommended</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Enable two-factor authentication to significantly improve your account security.
                  </p>
                </div>
              )}
            </div>

            {/* Biometric Authentication */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Biometric Authentication</h3>
                  <p className="text-xs text-muted-foreground">
                    Use fingerprint or face recognition for quick access
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
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage devices that are currently signed in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loginSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        {session.device}
                        {session.isCurrent && (
                          <Badge variant="outline" className="text-xs">
                            Current
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
                      Terminate
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
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control how your data is used and shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Data Collection</h3>
                <p className="text-xs text-muted-foreground">
                  Allow collection of usage data to improve the app
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Location History</h3>
                <p className="text-xs text-muted-foreground">
                  Store location history for better emergency response
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Third-party Sharing</h3>
                <p className="text-xs text-muted-foreground">
                  Share data with emergency services when needed
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}