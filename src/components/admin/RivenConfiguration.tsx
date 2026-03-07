import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Key, 
  Shield, 
  Globe, 
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Server,
  Database
} from 'lucide-react';

export const RivenConfiguration: React.FC = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: { configured: true, status: 'active' },
    anthropic: { configured: false, status: 'inactive' },
    stability: { configured: true, status: 'active' },
    elevenlabs: { configured: false, status: 'inactive' }
  });

  const [systemSettings, setSystemSettings] = useState({
    maxConcurrentJobs: 5,
    defaultTimeout: 300,
    retryAttempts: 3,
    enableLogging: true,
    enableAnalytics: true,
    autoBackup: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    enableRateLimit: true,
    maxRequestsPerHour: 1000,
    enableIpWhitelist: false,
    enableApiKeyRotation: true,
    sessionTimeout: 3600
  });

  return (
    <div className="space-y-6">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">Core System</span>
              </div>
              <Badge className="bg-green-100 text-green-700">Operational</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                <span className="font-medium">Database</span>
              </div>
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="font-medium">AI Services</span>
              </div>
              <Badge className="bg-orange-100 text-orange-700">Partial</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Keys & Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(apiKeys).map(([service, config]) => (
            <div key={service} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${config.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                <div>
                  <h4 className="font-medium capitalize">{service}</h4>
                  <p className="text-sm text-muted-foreground">
                    {config.configured ? 'API key configured' : 'No API key configured'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={config.status === 'active' ? 'default' : 'secondary'}>
                  {config.status}
                </Badge>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Max Concurrent Jobs</Label>
              <Input 
                type="number" 
                value={systemSettings.maxConcurrentJobs}
                onChange={(e) => setSystemSettings({
                  ...systemSettings, 
                  maxConcurrentJobs: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Timeout (seconds)</Label>
              <Input 
                type="number" 
                value={systemSettings.defaultTimeout}
                onChange={(e) => setSystemSettings({
                  ...systemSettings, 
                  defaultTimeout: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Retry Attempts</Label>
              <Input 
                type="number" 
                value={systemSettings.retryAttempts}
                onChange={(e) => setSystemSettings({
                  ...systemSettings, 
                  retryAttempts: parseInt(e.target.value)
                })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable System Logging</Label>
                <p className="text-xs text-muted-foreground">Log system events and errors</p>
              </div>
              <Switch 
                checked={systemSettings.enableLogging}
                onCheckedChange={(checked) => setSystemSettings({
                  ...systemSettings, 
                  enableLogging: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Analytics</Label>
                <p className="text-xs text-muted-foreground">Track usage and performance metrics</p>
              </div>
              <Switch 
                checked={systemSettings.enableAnalytics}
                onCheckedChange={(checked) => setSystemSettings({
                  ...systemSettings, 
                  enableAnalytics: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-xs text-muted-foreground">Automatically backup system data</p>
              </div>
              <Switch 
                checked={systemSettings.autoBackup}
                onCheckedChange={(checked) => setSystemSettings({
                  ...systemSettings, 
                  autoBackup: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Max Requests Per Hour</Label>
              <Input 
                type="number" 
                value={securitySettings.maxRequestsPerHour}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings, 
                  maxRequestsPerHour: parseInt(e.target.value)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label>Session Timeout (seconds)</Label>
              <Input 
                type="number" 
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings({
                  ...securitySettings, 
                  sessionTimeout: parseInt(e.target.value)
                })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Rate Limiting</Label>
                <p className="text-xs text-muted-foreground">Limit API requests per hour</p>
              </div>
              <Switch 
                checked={securitySettings.enableRateLimit}
                onCheckedChange={(checked) => setSecuritySettings({
                  ...securitySettings, 
                  enableRateLimit: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>IP Whitelist</Label>
                <p className="text-xs text-muted-foreground">Restrict access to specific IP addresses</p>
              </div>
              <Switch 
                checked={securitySettings.enableIpWhitelist}
                onCheckedChange={(checked) => setSecuritySettings({
                  ...securitySettings, 
                  enableIpWhitelist: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>API Key Rotation</Label>
                <p className="text-xs text-muted-foreground">Automatically rotate API keys</p>
              </div>
              <Switch 
                checked={securitySettings.enableApiKeyRotation}
                onCheckedChange={(checked) => setSecuritySettings({
                  ...securitySettings, 
                  enableApiKeyRotation: checked
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>
        <Button variant="outline" className="flex-1">
          <RefreshCw className="h-4 w-4 mr-2" />
          Restart Services
        </Button>
      </div>
    </div>
  );
};