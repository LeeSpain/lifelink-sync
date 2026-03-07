import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Star,
  MessageSquare,
  Send,
  Bell,
  Tag,
  DollarSign,
  Percent,
  Clock
} from 'lucide-react';
import { EnhancedLead, LeadActivity, useEnhancedLeads } from '@/hooks/useEnhancedLeads';

interface LeadDetailModalProps {
  lead: EnhancedLead | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EnhancedLead>>({});
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [emailContent, setEmailContent] = useState('');
  
  const { toast } = useToast();
  const { triggerAutomation } = useEmailAutomation();
  const { activities, updateLead, addActivity, scheduleFollowUp, loadActivities } = useEnhancedLeads();

  useEffect(() => {
    if (lead) {
      setEditForm(lead);
      loadActivities(lead.id);
    }
  }, [lead, loadActivities]);

  const handleSave = async () => {
    if (!lead) return;
    
    try {
      await updateLead(lead.id, editForm);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;

    try {
      await addActivity(lead.id, 'note', 'Note Added', newNote);
      setNewNote('');
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async () => {
    if (!lead || !emailContent.trim()) return;

    try {
      // Add email activity
      await addActivity(lead.id, 'email', 'Email Sent', emailContent);
      
      // Trigger email automation if configured
      await triggerAutomation('lead_engagement', {
        lead_id: lead.id,
        email_content: emailContent
      });

      setEmailContent('');
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!lead || !followUpDate) return;

    try {
      await scheduleFollowUp(lead.id, followUpDate);
      setFollowUpDate('');
    } catch (error) {
      console.error('Failed to schedule follow-up:', error);
    }
  };

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {lead.first_name?.[0]}{lead.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            {lead.first_name} {lead.last_name}
            <Badge className={getStatusColor(lead.status)}>
              {lead.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {lead.company_name && `${lead.job_title} at ${lead.company_name}`}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lead Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Lead Information
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="first_name">First Name</Label>
                          <Input
                            id="first_name"
                            value={editForm.first_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Last Name</Label>
                          <Input
                            id="last_name"
                            value={editForm.last_name || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="company_name">Company</Label>
                        <Input
                          id="company_name"
                          value={editForm.company_name || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, company_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          value={editForm.job_title || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, job_title: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleSave}>Save</Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        {lead.email}
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.company_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4" />
                          {lead.company_name}
                        </div>
                      )}
                      {lead.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4" />
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {lead.website}
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Lead Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Lead Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Lead Score</span>
                    <Badge className={getLeadScoreColor(lead.lead_score)}>
                      {lead.lead_score}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Interest Level</span>
                    <Badge variant="outline">
                      {lead.interest_level}/10
                    </Badge>
                  </div>
                  {lead.deal_value && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Deal Value
                      </span>
                      <span className="font-bold">${lead.deal_value.toLocaleString()}</span>
                    </div>
                  )}
                  {lead.probability > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Probability
                      </span>
                      <span>{lead.probability}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note about this lead..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="space-y-2">
              {activities.filter(a => a.lead_id === lead.id).map((activity) => (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-full bg-primary/10">
                        {activity.activity_type === 'email' && <Mail className="h-4 w-4" />}
                        {activity.activity_type === 'call' && <Phone className="h-4 w-4" />}
                        {activity.activity_type === 'note' && <MessageSquare className="h-4 w-4" />}
                        {activity.activity_type === 'meeting' && <Calendar className="h-4 w-4" />}
                        {activity.activity_type === 'status_change' && <Tag className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{activity.subject}</p>
                        <p className="text-sm text-muted-foreground">{activity.content}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Compose your email..."
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={5}
                />
                <Button onClick={handleSendEmail} disabled={!emailContent.trim()}>
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleScheduleFollowUp} disabled={!followUpDate}>
                  Schedule Follow-up
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};