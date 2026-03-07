import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Send, Clock, CheckCircle, Settings, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';

interface EmailCampaign {
  id: string;
  subject: string;
  content: string;
  recipientEmail: string;
  sendVia: 'gmail' | 'resend';
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  campaignId?: string;
}

export const EmailWorkflowIntegration: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<EmailCampaign>>({
    subject: '',
    content: '',
    recipientEmail: '',
    sendVia: 'gmail',
    status: 'draft'
  });
  const [gmailConnected, setGmailConnected] = useState(false);
  const { toast } = useToast();
  const { triggerAutomation } = useEmailAutomation();

  useEffect(() => {
    checkGmailConnection();
    loadEmailCampaigns();
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setGmailConnected(!!data);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };

  const loadEmailCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedCampaigns: EmailCampaign[] = (data || []).map(item => ({
        id: item.id,
        subject: item.subject,
        content: item.body,
        recipientEmail: item.recipient_email,
        sendVia: 'resend', // Default for queue items
        status: item.status === 'pending' ? 'scheduled' : 
                item.status === 'sent' ? 'sent' : 'failed',
        scheduledTime: item.scheduled_at,
        campaignId: item.campaign_id
      }));

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error loading email campaigns:', error);
    }
  };

  const createEmailCampaign = async () => {
    if (!newCampaign.subject || !newCampaign.content || !newCampaign.recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      if (newCampaign.sendVia === 'gmail') {
        if (!gmailConnected) {
          toast({
            title: "Gmail Not Connected",
            description: "Please connect your Gmail account first",
            variant: "destructive"
          });
          return;
        }

        // Send via Gmail
        const { data, error } = await supabase.functions.invoke('gmail-integration', {
          body: {
            action: 'send',
            to: newCampaign.recipientEmail,
            subject: newCampaign.subject,
            body: newCampaign.content
          }
        });

        if (error) throw error;

        toast({
          title: "Email Sent",
          description: "Email sent successfully via Gmail",
        });
      } else {
        // Send via Resend (add to queue)
        const { error } = await supabase
          .from('email_queue')
          .insert({
            recipient_email: newCampaign.recipientEmail,
            subject: newCampaign.subject,
            body: newCampaign.content,
            scheduled_at: newCampaign.scheduledTime || new Date().toISOString(),
            status: 'pending'
          });

        if (error) throw error;

        toast({
          title: "Email Queued",
          description: "Email added to queue for sending via Resend",
        });
      }

      // Reset form
      setNewCampaign({
        subject: '',
        content: '',
        recipientEmail: '',
        sendVia: 'gmail',
        status: 'draft'
      });

      // Reload campaigns
      await loadEmailCampaigns();
    } catch (error) {
      console.error('Error creating email campaign:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'failed':
        return <Mail className="h-4 w-4 text-destructive" />;
      default:
        return <Settings className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'sent': 'default',
      'scheduled': 'secondary',
      'failed': 'destructive',
      'draft': 'outline'
    };
    
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Create New Email Campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Email Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!gmailConnected && (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Gmail is not connected. You can still send emails via Resend, or connect Gmail for direct sending.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="recipient@example.com"
                value={newCampaign.recipientEmail || ''}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, recipientEmail: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sendVia">Send Via</Label>
              <Select 
                value={newCampaign.sendVia} 
                onValueChange={(value: 'gmail' | 'resend') => 
                  setNewCampaign(prev => ({ ...prev, sendVia: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail" disabled={!gmailConnected}>
                    Gmail {!gmailConnected && '(Not Connected)'}
                  </SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject line"
              value={newCampaign.subject || ''}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <Textarea
              id="content"
              placeholder="Write your email content here..."
              rows={6}
              value={newCampaign.content || ''}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
            />
          </div>

          <Button 
            onClick={createEmailCampaign}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Email Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Email Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No email campaigns found. Create your first campaign above.
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(campaign.status)}
                      <span className="font-medium">{campaign.subject}</span>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      To: {campaign.recipientEmail}
                    </p>
                    {campaign.scheduledTime && (
                      <p className="text-xs text-muted-foreground">
                        Scheduled: {new Date(campaign.scheduledTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="outline">
                      {campaign.sendVia}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};