import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Send, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { supabase } from '@/integrations/supabase/client';

interface SystemHealth {
  gmail: boolean;
  resend: boolean;
  automation: boolean;
  scheduler: boolean;
  templates: number;
  queueSize: number;
}

export const EmailSystemStatus: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    gmail: false,
    resend: false,
    automation: false,
    scheduler: false,
    templates: 0,
    queueSize: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();
  const { testEmailSystem } = useEmailAutomation();

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    try {
      // Check Gmail connection
      const { data: { user } } = await supabase.auth.getUser();
      let gmailConnected = false;
      
      if (user) {
        const { data: gmailData } = await supabase
          .from('gmail_tokens')
          .select('*')
          .eq('user_id', user.id)
          .single();
        gmailConnected = !!gmailData;
      }

      // Check email templates
      const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true);

      // Check email queue
      const { data: queueData } = await supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending');

      // Test Resend and automation services
      const healthResults = await testEmailSystem();

      setSystemHealth({
        gmail: gmailConnected,
        resend: healthResults.queue,
        automation: healthResults.queue,
        scheduler: healthResults.scheduler,
        templates: templates?.length || 0,
        queueSize: queueData?.length || 0
      });

    } catch (error) {
      console.error('Error checking system health:', error);
      toast({
        title: "Health Check Failed",
        description: "Unable to check email system status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSystemTest = async () => {
    setIsTesting(true);
    try {
      const results = await testEmailSystem();
      
      if (results.queue && results.scheduler) {
        toast({
          title: "System Test Passed",
          description: "All email systems are functioning correctly",
        });
      } else {
        toast({
          title: "System Test Issues",
          description: "Some email services may need attention",
          variant: "destructive"
        });
      }
      
      await checkSystemHealth();
    } catch (error) {
      console.error('Error running system test:', error);
      toast({
        title: "Test Failed",
        description: "Unable to complete system test",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const processEmailQueue = async () => {
    try {
      const { error } = await supabase.functions.invoke('email-automation', {
        body: { action: 'process_queue' }
      });

      if (error) throw error;

      toast({
        title: "Queue Processing",
        description: "Email queue processing has been triggered",
      });
      
      // Refresh system health after processing
      setTimeout(() => {
        checkSystemHealth();
      }, 2000);
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process email queue",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return (
      <Badge variant={status ? "default" : "destructive"}>
        {status ? "Online" : "Offline"}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallHealth = systemHealth.gmail && systemHealth.resend && systemHealth.automation;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Email System Status
          {getStatusBadge(overallHealth)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!overallHealth && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some email services are not functioning properly. Please check the configuration below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gmail Integration</span>
              {getStatusIcon(systemHealth.gmail)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resend Service</span>
              {getStatusIcon(systemHealth.resend)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email Automation</span>
              {getStatusIcon(systemHealth.automation)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Scheduler</span>
              {getStatusIcon(systemHealth.scheduler)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Templates</span>
              <Badge variant="outline">{systemHealth.templates}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Queue Size</span>
              <Badge variant={systemHealth.queueSize > 0 ? "default" : "outline"}>
                {systemHealth.queueSize}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkSystemHealth}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runSystemTest}
            disabled={isTesting}
          >
            {isTesting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Run Test
          </Button>
          
          {systemHealth.queueSize > 0 && (
            <Button 
              size="sm" 
              onClick={processEmailQueue}
            >
              <Send className="h-4 w-4 mr-2" />
              Process Queue ({systemHealth.queueSize})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};