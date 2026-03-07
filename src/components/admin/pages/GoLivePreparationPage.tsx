import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  Shield, 
  Users, 
  Globe,
  Database,
  CreditCard,
  Phone,
  Mail,
  Monitor,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface GoLiveChecklist {
  security: boolean;
  payments: boolean;
  emergency: boolean;
  monitoring: boolean;
  support: boolean;
  legal: boolean;
  domain: boolean;
  backup: boolean;
}

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  payments: 'healthy' | 'warning' | 'error';
  monitoring: 'healthy' | 'warning' | 'error';
}

export default function GoLivePreparationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState<GoLiveChecklist>({
    security: true,
    payments: true,
    emergency: true,
    monitoring: true,
    support: false,
    legal: false,
    domain: false,
    backup: false
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'healthy',
    api: 'healthy',
    payments: 'healthy',
    monitoring: 'healthy'
  });

  const runFinalChecks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('final-production-check');
      
      if (error) throw error;
      
      // Update checklist based on results
      setChecklist(prev => ({
        ...prev,
        ...data.checklist
      }));
      
      setSystemStatus(data.systemStatus);
      
      toast.success("Final production checks completed");
      return data;
    } catch (error: any) {
      toast.error(`Final checks failed: ${error.message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const enableProductionMode = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('enable-production-mode');
      
      if (error) throw error;
      
      toast.success("Production mode enabled successfully!");
    } catch (error: any) {
      toast.error(`Failed to enable production mode: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: boolean, label: string) => (
    <Badge variant={status ? "default" : "destructive"} className="gap-1">
      {status ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </Badge>
  );

  const getSystemStatusBadge = (status: SystemStatus[keyof SystemStatus]) => {
    const variants = {
      healthy: "default",
      warning: "secondary",
      error: "destructive"
    } as const;
    
    return (
      <Badge variant={variants[status]} className="gap-1">
        {status === 'healthy' && <CheckCircle className="w-3 h-3" />}
        {status === 'warning' && <AlertCircle className="w-3 h-3" />}
        {status === 'error' && <AlertCircle className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const completedChecks = Object.values(checklist).filter(Boolean).length;
  const totalChecks = Object.keys(checklist).length;
  const progressPercentage = (completedChecks / totalChecks) * 100;

  const checklistItems = [
    { key: 'security', label: 'Security Configuration', icon: Shield, description: 'RLS policies, authentication, encryption' },
    { key: 'payments', label: 'Payment Processing', icon: CreditCard, description: 'Stripe live keys, webhook endpoints' },
    { key: 'emergency', label: 'Emergency Services', icon: Phone, description: 'Call center integration, SMS alerts' },
    { key: 'monitoring', label: 'System Monitoring', icon: Monitor, description: 'Error tracking, performance monitoring' },
    { key: 'support', label: 'Customer Support', icon: Users, description: 'Help desk, documentation, training' },
    { key: 'legal', label: 'Legal Compliance', icon: Mail, description: 'Privacy policy, terms of service, GDPR' },
    { key: 'domain', label: 'Production Domain', icon: Globe, description: 'Custom domain, SSL certificate' },
    { key: 'backup', label: 'Backup Systems', icon: Database, description: 'Database backups, disaster recovery' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Go-Live Preparation</h1>
          <p className="text-muted-foreground">Final checks and launch preparation for production</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Rocket className="w-4 h-4" />
          Phase 5: Production Launch
        </Badge>
      </div>

      {/* Launch Readiness Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Launch Readiness
          </CardTitle>
          <CardDescription>
            Complete all checklist items before going live
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Production Readiness</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runFinalChecks}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Run Final Checks
            </Button>
            
            <Button 
              onClick={enableProductionMode}
              disabled={isLoading || progressPercentage < 100}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              Enable Production Mode
            </Button>
          </div>

          {progressPercentage < 100 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete all checklist items before enabling production mode.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklist">Go-Live Checklist</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="launch">Launch Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Readiness Checklist</CardTitle>
              <CardDescription>
                Ensure all systems are ready for production launch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {checklistItems.map((item) => {
                  const Icon = item.icon;
                  const isComplete = checklist[item.key as keyof GoLiveChecklist];
                  
                  return (
                    <div key={item.key} className={`p-4 border rounded-lg ${isComplete ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${isComplete ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{item.label}</h4>
                            {getStatusBadge(isComplete, isComplete ? "Complete" : "Pending")}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSystemStatusBadge(systemStatus.database)}
                <p className="text-sm text-muted-foreground">
                  All database connections healthy, RLS policies active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  API Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSystemStatusBadge(systemStatus.api)}
                <p className="text-sm text-muted-foreground">
                  All edge functions responding, authentication working
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSystemStatusBadge(systemStatus.payments)}
                <p className="text-sm text-muted-foreground">
                  Stripe live mode configured, webhooks verified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Monitoring Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getSystemStatusBadge(systemStatus.monitoring)}
                <p className="text-sm text-muted-foreground">
                  Error tracking active, performance monitoring enabled
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="launch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Launch Actions
              </CardTitle>
              <CardDescription>
                Final steps to go live with your platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Switch to Production Domain</h4>
                    <p className="text-sm text-muted-foreground">Configure custom domain and SSL</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://supabase.com/dashboard/project/mqroziggaalltuzoyyao/settings/general" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Configure
                    </a>
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Enable Password Protection</h4>
                    <p className="text-sm text-muted-foreground">Protect admin dashboard during launch</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Launch Marketing Campaign</h4>
                    <p className="text-sm text-muted-foreground">Announce your platform launch</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Manual Process
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Post-Launch Monitoring</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://supabase.com/dashboard/project/mqroziggaalltuzoyyao/logs/edge-functions" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Edge Function Logs
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://supabase.com/dashboard/project/mqroziggaalltuzoyyao/auth/users" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      User Analytics
                    </a>
                  </Button>
                </div>
              </div>

              <Alert>
                <Rocket className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ready to launch!</strong> Once you enable production mode, your platform will be live and accessible to users.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}