import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Users, Send, Eye, Calendar, Target, Settings } from 'lucide-react';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { useToast } from '@/hooks/use-toast';

interface EmailCampaignControlsProps {
  contentItem: any;
  onCampaignCreated?: (campaignId: string) => void;
  onEmailsQueued?: (count: number) => void;
}

export const EmailCampaignControls: React.FC<EmailCampaignControlsProps> = ({ 
  contentItem, 
  onCampaignCreated,
  onEmailsQueued 
}) => {
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isQueuingEmails, setIsQueuingEmails] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [campaignSettings, setCampaignSettings] = useState({
    name: contentItem.title || 'Email Campaign',
    includeSubscribers: true,
    includeUsers: false,
    roleFilter: '',
    countryFilter: '',
    scheduledSend: false,
    scheduledTime: '',
    priority: 5
  });

  const { createEmailCampaign, queueEmailsForCampaign, getTargetRecipients } = useEmailAutomation();
  const { toast } = useToast();

  const handleCreateCampaign = async () => {
    setIsCreatingCampaign(true);
    try {
      const result = await createEmailCampaign(contentItem.id, {
        name: campaignSettings.name,
        created_by: contentItem.campaign_id
      });

      if (result.success) {
        toast({
          title: "Email Campaign Created",
          description: `Campaign "${campaignSettings.name}" has been created successfully.`
        });
        onCampaignCreated?.(result.campaign_id);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Campaign Creation Failed",
        description: "Failed to create email campaign. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleQueueEmails = async () => {
    setIsQueuingEmails(true);
    try {
      const targetCriteria = {
        include_subscribers: campaignSettings.includeSubscribers,
        include_users: campaignSettings.includeUsers,
        role_filter: campaignSettings.roleFilter || undefined,
        country_filter: campaignSettings.countryFilter || undefined,
        priority: campaignSettings.priority,
        scheduled_at: campaignSettings.scheduledSend && campaignSettings.scheduledTime
          ? new Date(campaignSettings.scheduledTime).toISOString()
          : new Date().toISOString()
      };

      const result = await queueEmailsForCampaign(contentItem.id, targetCriteria);

      if (result.success) {
        toast({
          title: "Emails Queued",
          description: `${result.emails_queued} emails have been queued for sending.`
        });
        onEmailsQueued?.(result.emails_queued);
      }
    } catch (error) {
      console.error('Error queueing emails:', error);
      toast({
        title: "Email Queueing Failed",
        description: "Failed to queue emails. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsQueuingEmails(false);
    }
  };

  const handlePreviewRecipients = async () => {
    try {
      const targetCriteria = {
        include_subscribers: campaignSettings.includeSubscribers,
        include_users: campaignSettings.includeUsers,
        role_filter: campaignSettings.roleFilter || undefined,
        country_filter: campaignSettings.countryFilter || undefined
      };

      const result = await getTargetRecipients(targetCriteria);
      setRecipients(result || []);
      setShowRecipients(true);
    } catch (error) {
      console.error('Error getting recipients:', error);
      toast({
        title: "Preview Failed",
        description: "Failed to load recipient list.",
        variant: "destructive"
      });
    }
  };

  const isEmailContent = contentItem.platform === 'email' || contentItem.content_type === 'email_campaign';

  if (!isEmailContent) {
    return (
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          This content is not configured for email campaigns. Only email-type content can be sent via email.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Campaign Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaign-name">Campaign Name</Label>
            <Input
              id="campaign-name"
              value={campaignSettings.name}
              onChange={(e) => setCampaignSettings(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter campaign name"
            />
          </div>
          <div>
            <Label htmlFor="priority">Priority (1-10)</Label>
            <Input
              id="priority"
              type="number"
              min="1"
              max="10"
              value={campaignSettings.priority}
              onChange={(e) => setCampaignSettings(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-semibold">Target Recipients</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-subscribers"
                checked={campaignSettings.includeSubscribers}
                onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, includeSubscribers: checked }))}
              />
              <Label htmlFor="include-subscribers">Include Subscribers</Label>
            </div>
            <Badge variant="outline">
              {campaignSettings.includeSubscribers ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-users"
                checked={campaignSettings.includeUsers}
                onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, includeUsers: checked }))}
              />
              <Label htmlFor="include-users">Include Registered Users</Label>
            </div>
            <Badge variant="outline">
              {campaignSettings.includeUsers ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select 
                value={campaignSettings.roleFilter} 
                onValueChange={(value) => setCampaignSettings(prev => ({ ...prev, roleFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="country-filter">Filter by Country</Label>
              <Select 
                value={campaignSettings.countryFilter} 
                onValueChange={(value) => setCampaignSettings(prev => ({ ...prev, countryFilter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All countries</SelectItem>
                  <SelectItem value="ES">Spain</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-semibold">Scheduling</Label>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="scheduled-send"
              checked={campaignSettings.scheduledSend}
              onCheckedChange={(checked) => setCampaignSettings(prev => ({ ...prev, scheduledSend: checked }))}
            />
            <Label htmlFor="scheduled-send">Schedule for later</Label>
          </div>

          {campaignSettings.scheduledSend && (
            <div>
              <Label htmlFor="scheduled-time">Send Date & Time</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={campaignSettings.scheduledTime}
                onChange={(e) => setCampaignSettings(prev => ({ ...prev, scheduledTime: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        <Separator />

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleCreateCampaign} 
            disabled={isCreatingCampaign}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
          </Button>

          <Button 
            onClick={handleQueueEmails} 
            disabled={isQueuingEmails}
          >
            <Send className="h-4 w-4 mr-2" />
            {isQueuingEmails ? 'Queueing...' : 'Queue Emails'}
          </Button>

          <Dialog open={showRecipients} onOpenChange={setShowRecipients}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handlePreviewRecipients}>
                <Eye className="h-4 w-4 mr-2" />
                Preview Recipients
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Target Recipients Preview</DialogTitle>
              </DialogHeader>
              <div className="max-h-96 overflow-y-auto">
                {recipients.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground mb-3">
                      Found {recipients.length} recipients
                    </div>
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">{recipient.email}</div>
                          {(recipient.first_name || recipient.last_name) && (
                            <div className="text-sm text-muted-foreground">
                              {recipient.first_name} {recipient.last_name}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {recipient.role && (
                            <Badge variant="secondary" className="text-xs">
                              {recipient.role}
                            </Badge>
                          )}
                          {recipient.source && (
                            <Badge variant="outline" className="text-xs">
                              {recipient.source}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recipients found with current criteria
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setShowRecipients(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {contentItem.status !== 'approved' && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              Content must be approved before emails can be queued for sending.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};