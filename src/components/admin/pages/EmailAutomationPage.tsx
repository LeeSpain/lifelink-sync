import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Calendar, 
  Users, 
  Settings, 
  Play, 
  Pause,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { EmailSystemTest } from "../EmailSystemTest";

interface EmailAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  is_enabled: boolean;
  email_template: string;
  recipient_filter: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

interface EmailQueueItem {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  priority: number;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  email_type: string;
  status: string;
  created_at: string;
  error_message: string | null;
}

export default function EmailAutomationPage() {
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [queueItems, setQueueItems] = useState<EmailQueueItem[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [automationsResponse, queueResponse, logsResponse] = await Promise.all([
        supabase.from('email_automation_settings').select('*').order('created_at', { ascending: false }),
        supabase.from('email_queue').select('*').order('scheduled_at', { ascending: true }).limit(50),
        supabase.from('email_logs').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      if (automationsResponse.data) setAutomations(automationsResponse.data);
      if (queueResponse.data) setQueueItems(queueResponse.data);
      if (logsResponse.data) setEmailLogs(logsResponse.data);
    } catch (error) {
      console.error('Error loading email automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load email automation data",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const toggleAutomation = async (automationId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('email_automation_settings')
        .update({ is_enabled: enabled })
        .eq('id', automationId);

      if (error) throw error;

      setAutomations(prev => 
        prev.map(auto => 
          auto.id === automationId ? { ...auto, is_enabled: enabled } : auto
        )
      );

      toast({
        title: "Success",
        description: `Automation ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('Error toggling automation:', error);
      toast({
        title: "Error",
        description: "Failed to update automation",
        variant: "destructive"
      });
    }
  };

  const processEmailQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-automation', {
        body: { action: 'process_queue' }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Processed ${data.totalProcessed || 0} emails from queue`
      });

      // Reload queue and logs
      await loadData();
    } catch (error) {
      console.error('Error processing email queue:', error);
      toast({
        title: "Error",
        description: "Failed to process email queue",
        variant: "destructive"
      });
    }
    setProcessing(false);
  };

  const testAutomation = async (automationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const automation = automations.find(a => a.id === automationId);
      if (!automation) throw new Error('Automation not found');

      const { data, error } = await supabase.functions.invoke('email-automation', {
        body: {
          action: 'trigger',
          trigger_type: automation.trigger_type,
          user_id: user.id,
          data: { test: true }
        }
      });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: `Test email queued for automation: ${automation.name}`
      });

      await loadData();
    } catch (error) {
      console.error('Error testing automation:', error);
      toast({
        title: "Error",
        description: "Failed to test automation",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Automation</h1>
          <p className="text-muted-foreground">Manage automated email sequences and campaigns</p>
        </div>
        <Button 
          onClick={processEmailQueue} 
          disabled={processing}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          {processing ? 'Processing...' : 'Process Queue'}
        </Button>
      </div>

      {/* Email System Test Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 text-yellow-800">System Health Check</h2>
        <EmailSystemTest />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Automations</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.is_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {automations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued Emails</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queueItems.filter(q => q.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready to send
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sent</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs.filter(log => 
                log.status === 'sent' && 
                new Date(log.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Emails delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailLogs.length > 0 ? 
                Math.round((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="automations" className="space-y-4">
          <div className="grid gap-4">
            {automations.map((automation) => (
              <Card key={automation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{automation.name}</CardTitle>
                      <CardDescription>{automation.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{automation.trigger_type}</Badge>
                      <Badge variant="outline">{automation.recipient_filter}</Badge>
                      <Switch 
                        checked={automation.is_enabled}
                        onCheckedChange={(checked) => toggleAutomation(automation.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Template: {automation.email_template}</span>
                      {automation.last_run_at && (
                        <span>Last run: {new Date(automation.last_run_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testAutomation(automation.id)}
                      disabled={!automation.is_enabled}
                    >
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {queueItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">{item.recipient_email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.scheduled_at).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {emailLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">{log.subject}</p>
                        <p className="text-sm text-muted-foreground">{log.recipient_email}</p>
                        {log.error_message && (
                          <p className="text-xs text-red-600">{log.error_message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.email_type}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}