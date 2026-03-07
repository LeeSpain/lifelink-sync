import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Users, 
  Mail, 
  Filter, 
  Eye, 
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Database,
  RefreshCw,
  Search,
  Settings,
  Calendar,
  BarChart,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Copy,
  FileText,
  Zap,
  TrendingUp,
  Globe,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailAutomation } from '@/hooks/useEmailAutomation';
import { CRMAnalyticsComponent } from './CRMAnalyticsComponent';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  lead_source?: string;
  lead_score?: number;
  status: string;
  tags?: string[];
  created_at: string;
  subscription_status?: string;
  country_code?: string;
  last_contacted_at?: string;
  notes?: string;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string;
  count: number;
  criteria: any;
  color?: string;
}

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  created_at: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  status: string;
}

interface EmailMetrics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export const BulkEmailCRM: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [metrics, setMetrics] = useState<EmailMetrics | null>(null);
  
  // Email composition
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('custom');
  const [sendNow, setSendNow] = useState(true);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Filters and search
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // View states
  const [currentView, setCurrentView] = useState<'compose' | 'campaigns' | 'analytics'>('compose');
  const [showPreview, setShowPreview] = useState(false);
  
  const { toast } = useToast();
  const { createEmailCampaign, queueEmailsForCampaign } = useEmailAutomation();

  useEffect(() => {
    loadContacts();
    loadContactGroups();
    loadCampaigns();
    loadMetrics();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      // Load from leads table (CRM contacts)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Load from profiles (registered users)
      const { data: profilesDataRes, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) console.warn('Profiles query error:', profilesError);
      const profilesData = (profilesDataRes as any[]) || [];

      if (profilesError) throw profilesError;

      // Load communication preferences
      const { data: commPrefs, error: commError } = await supabase
        .from('communication_preferences')
        .select('*');

      if (commError) console.warn('Could not load communication preferences:', commError);

      // Combine and format data
      const formattedContacts: Contact[] = [
        // Format leads
        ...leadsData.map(lead => ({
          id: lead.id,
          name: lead.email?.split('@')[0] || 'Lead',
          email: lead.email || '',
          phone: lead.phone || '',
          company: lead.company_name || '',
          job_title: lead.job_title || '',
          lead_source: lead.lead_source || 'unknown',
          lead_score: lead.lead_score || 0,
          status: lead.status || 'lead',
          tags: lead.tags || [],
          created_at: lead.created_at,
          subscription_status: 'none',
          country_code: lead.timezone || '',
          last_contacted_at: lead.last_contacted_at,
          notes: lead.notes || ''
        })),
        // Format profiles (registered users)
        ...profilesData.map(profile => ({
          id: profile.user_id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
          email: '', // Will need to get from auth
          phone: profile.phone || '',
          company: '',
          job_title: '',
          lead_source: 'registration',
          lead_score: 0,
          status: profile.role || 'user',
          tags: profile.subscription_regional ? ['regional_subscriber'] : [],
          created_at: profile.created_at,
          subscription_status: profile.subscription_regional ? 'active' : 'none',
          country_code: profile.country_code || '',
          notes: profile.notes || ''
        }))
      ];

      setContacts(formattedContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load contacts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadContactGroups = async () => {
    // Define predefined contact groups with colors
    const predefinedGroups: ContactGroup[] = [
      {
        id: 'all',
        name: 'All Contacts',
        description: 'All contacts in the system',
        count: 0,
        criteria: {},
        color: 'bg-gray-100 text-gray-800'
      },
      {
        id: 'leads',
        name: 'Leads',
        description: 'Potential customers from lead generation',
        count: 0,
        criteria: { status: 'lead' },
        color: 'bg-blue-100 text-blue-800'
      },
      {
        id: 'users',
        name: 'Registered Users',
        description: 'Users who have registered accounts',
        count: 0,
        criteria: { status: 'user' },
        color: 'bg-green-100 text-green-800'
      },
      {
        id: 'members',
        name: 'Members',
        description: 'Active subscribers and members',
        count: 0,
        criteria: { subscription_status: 'active' },
        color: 'bg-purple-100 text-purple-800'
      },
      {
        id: 'regional',
        name: 'Regional Subscribers',
        description: 'Users with regional subscriptions',
        count: 0,
        criteria: { tags: ['regional_subscriber'] },
        color: 'bg-orange-100 text-orange-800'
      },
      {
        id: 'spain',
        name: 'Spain Users',
        description: 'Users based in Spain',
        count: 0,
        criteria: { country_code: 'ES' },
        color: 'bg-red-100 text-red-800'
      },
      {
        id: 'high_score',
        name: 'High Score Leads',
        description: 'Leads with score above 70',
        count: 0,
        criteria: { lead_score_min: 70 },
        color: 'bg-yellow-100 text-yellow-800'
      }
    ];

    // Calculate counts for each group
    const groupsWithCounts = predefinedGroups.map(group => ({
      ...group,
      count: filterContactsByGroup(contacts, group.criteria).length
    }));

    setContactGroups(groupsWithCounts);
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_campaigns')
        .select('*')
        .eq('channel', 'email')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCampaigns: EmailCampaign[] = data?.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject_template || '',
        content: campaign.content_template,
        created_at: campaign.created_at,
        sent_count: campaign.sent_count || 0,
        open_rate: 0, // Would need to calculate from email logs
        click_rate: 0, // Would need to calculate from email logs
        status: campaign.status
      })) || [];

      setCampaigns(formattedCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: queueData, error: queueError } = await supabase
        .from('email_queue')
        .select('status');

      if (queueError) throw queueError;

      const totalSent = queueData?.filter(email => email.status === 'sent').length || 0;
      const totalFailed = queueData?.filter(email => email.status === 'failed').length || 0;
      const totalPending = queueData?.filter(email => email.status === 'pending').length || 0;
      const totalEmails = queueData?.length || 0;

      setMetrics({
        totalSent,
        totalDelivered: totalSent,
        totalOpened: Math.floor(totalSent * 0.25), // Estimated
        totalClicked: Math.floor(totalSent * 0.05), // Estimated
        totalBounced: totalFailed,
        deliveryRate: totalEmails > 0 ? Math.round((totalSent / totalEmails) * 100) : 0,
        openRate: totalSent > 0 ? 25 : 0, // Estimated
        clickRate: totalSent > 0 ? 5 : 0, // Estimated
        bounceRate: totalEmails > 0 ? Math.round((totalFailed / totalEmails) * 100) : 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const filterContactsByGroup = (contactList: Contact[], criteria: any): Contact[] => {
    return contactList.filter(contact => {
      if (criteria.status && contact.status !== criteria.status) return false;
      if (criteria.subscription_status && contact.subscription_status !== criteria.subscription_status) return false;
      if (criteria.country_code && contact.country_code !== criteria.country_code) return false;
      if (criteria.lead_score_min && (contact.lead_score || 0) < criteria.lead_score_min) return false;
      if (criteria.tags && !criteria.tags.some((tag: string) => contact.tags?.includes(tag))) return false;
      return true;
    });
  };

  const applyFilters = (contactList: Contact[]): Contact[] => {
    return contactList.filter(contact => {
      if (statusFilter !== 'all' && contact.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && contact.lead_source !== sourceFilter) return false;
      if (subscriptionFilter !== 'all' && contact.subscription_status !== subscriptionFilter) return false;
      if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !contact.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  };

  const handleGroupSelection = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = contactGroups.find(g => g.id === groupId);
    if (group) {
      const filteredContacts = filterContactsByGroup(contacts, group.criteria);
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    const filteredContacts = applyFilters(contacts);
    setSelectedContacts(filteredContacts.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast({
        title: "Email Content Required",
        description: "Please provide both subject and content for the email.",
        variant: "destructive"
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one contact to send the email.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Get selected contact details
      const selectedContactDetails = contacts.filter(c => selectedContacts.includes(c.id));
      
      // Send bulk email using the bulk-messaging function
      const { data, error } = await supabase.functions.invoke('bulk-messaging', {
        body: {
          action: 'create',
          campaignData: {
            name: `Bulk Email - ${emailSubject}`,
            description: `Bulk email campaign sent to ${selectedContacts.length} contacts`,
            channel: 'email',
            content_template: emailContent,
            subject_template: emailSubject,
            target_criteria: {
              selected_contacts: selectedContacts
            },
            variables: {
              timestamp: new Date().toISOString(),
              sender: 'LifeLink Sync Team'
            },
            scheduled_at: sendNow ? null : scheduledTime
          }
        }
      });

      if (error) throw error;

      // Tracking disabled for now

      toast({
        title: sendNow ? "Bulk Email Sent" : "Email Scheduled",
        description: `Email campaign ${sendNow ? 'started' : 'scheduled'} for ${selectedContacts.length} contacts.`,
      });

      // Reset form
      setEmailSubject('');
      setEmailContent('');
      setSelectedContacts([]);
      setSelectedGroup('');
      
      // Reload data
      loadCampaigns();
      loadMetrics();

    } catch (error) {
      console.error('Error sending bulk email:', error);
      toast({
        title: "Email Send Failed",
        description: "Failed to send bulk email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const getEmailTemplates = () => {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to LifeLink Sync! 🎉',
        content: `Hi {{name}},

Welcome to LifeLink Sync! We're excited to have you join our community focused on family safety and emergency preparedness.

Your account is now active and ready to use. Here are some quick first steps:

🔗 Set up your emergency contacts
👨‍👩‍👧‍👦 Configure your family group  
📱 Download our mobile app
🆘 Test your SOS button

Our mission is to keep you and your loved ones safe, and we're here to support you every step of the way.

If you have any questions, our support team is here to help at support@lifelink-sync.com

Stay safe,
The LifeLink Sync Team

---
LifeLink Sync - Your Family's Safety Network
Unsubscribe: {{unsubscribe_url}}`
      },
      {
        id: 'newsletter',
        name: 'Safety Newsletter',
        subject: 'LifeLink Sync Newsletter - Safety Tips & Updates 📰',
        content: `Hi {{name}},

Hope you're staying safe! Here's this month's safety update from LifeLink Sync.

🚨 SAFETY TIP OF THE MONTH:
Always keep your emergency contacts updated and ensure they know how to respond to alerts from our system.

📱 NEW FEATURES:
• Enhanced location accuracy for better tracking
• Improved family notifications system  
• Battery optimization for longer device life
• New emergency response protocols

📈 YOUR SAFETY STATS:
You've been keeping your family safer with LifeLink Sync. Thank you for being part of our safety community!

🎯 SAFETY REMINDER:
Test your SOS system monthly and review your emergency plans with your family.

Questions? We're here to help at support@lifelink-sync.com

Best regards,
LifeLink Sync Team

---
LifeLink Sync - Your Family's Safety Network  
Unsubscribe: {{unsubscribe_url}}`
      },
      {
        id: 'announcement',
        name: 'Product Announcement',
        subject: 'Important Update from LifeLink Sync 📢',
        content: `Hi {{name}},

We have an important update to share with you about LifeLink Sync.

🎉 WHAT'S NEW:
[Add your announcement content here]

📅 WHEN:
This update is now live and available to all users.

🔧 WHAT YOU NEED TO DO:
[Add any required actions here]

If you have any questions about this update, please don't hesitate to reach out to our support team.

Thank you for being a valued member of the LifeLink Sync community.

Best regards,
The LifeLink Sync Team

---
LifeLink Sync - Your Family's Safety Network
Support: support@lifelink-sync.com
Unsubscribe: {{unsubscribe_url}}`
      },
      {
        id: 'custom',
        name: 'Custom Email',
        subject: '',
        content: ''
      }
    ];
  };

  const handleTemplateSelection = (templateId: string) => {
    setEmailTemplate(templateId);
    const template = getEmailTemplates().find(t => t.id === templateId);
    if (template && templateId !== 'custom') {
      setEmailSubject(template.subject);
      setEmailContent(template.content);
    } else {
      setEmailSubject('');
      setEmailContent('');
    }
  };

  const filteredContacts = applyFilters(contacts);

  // Navigation tabs
  const navigationTabs = [
    { id: 'compose', label: 'Compose Email', icon: Mail },
    { id: 'campaigns', label: 'Campaigns', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Email CRM
          </CardTitle>
          <div className="flex gap-2 mt-4">
            {navigationTabs.map(tab => (
              <Button
                key={tab.id}
                variant={currentView === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentView(tab.id as any)}
                className="flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Analytics View */}
      {currentView === 'analytics' && (
        <>
          <CRMAnalyticsComponent />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{metrics.totalSent}</div>
                    <div className="text-sm text-muted-foreground">Emails Sent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{metrics.deliveryRate}%</div>
                    <div className="text-sm text-muted-foreground">Delivery Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{metrics.openRate}%</div>
                    <div className="text-sm text-muted-foreground">Open Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{metrics.clickRate}%</div>
                    <div className="text-sm text-muted-foreground">Click Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Campaigns View */}
      {currentView === 'campaigns' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No campaigns found. Create your first email campaign!
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Sent: {campaign.sent_count}</span>
                          <span>Open Rate: {campaign.open_rate}%</span>
                          <span>Click Rate: {campaign.click_rate}%</span>
                        </div>
                      </div>
                      <Badge variant={campaign.status === 'completed' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compose Email View */}
      {currentView === 'compose' && (
        <>
          {/* Contact Groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Contact Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {contactGroups.map(group => (
                  <Button
                    key={group.id}
                    variant={selectedGroup === group.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGroupSelection(group.id)}
                    className="flex items-center justify-between p-3 h-auto"
                  >
                    <span className="text-xs font-medium">{group.name}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {group.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contact Filters</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvancedFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <Label>Status Filter</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="lead">Leads</SelectItem>
                        <SelectItem value="user">Users</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Source Filter</Label>
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Subscription Filter</Label>
                    <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subscriptions</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="none">No Subscription</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Contact Selection</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedContacts.length} of {filteredContacts.length} contacts selected
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAll}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeselectAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deselect All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadContacts}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Contact List */}
              <div className="max-h-80 overflow-y-auto border rounded-md">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading contacts...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No contacts found
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 border"
                      >
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => handleContactToggle(contact.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{contact.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {contact.status}
                            </Badge>
                            {contact.lead_score && contact.lead_score > 50 && (
                              <Badge variant="secondary" className="text-xs">
                                Score: {contact.lead_score}
                              </Badge>
                            )}
                            {contact.country_code && (
                              <Badge variant="outline" className="text-xs">
                                {contact.country_code}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contact.email} • {contact.lead_source}
                            {contact.company && ` • ${contact.company}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Template Selection */}
              <div>
                <Label>Email Template</Label>
                <Select value={emailTemplate} onValueChange={handleTemplateSelection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getEmailTemplates().map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="mt-1"
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Email Content</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Enter email content... Use {{name}} for personalization."
                  rows={12}
                  className="mt-1"
                />
                <div className="text-xs text-muted-foreground mt-2">
                  &#128161; Use &#123;&#123;name&#125;&#125; for personalization. Available variables: &#123;&#123;name&#125;&#125;, &#123;&#123;email&#125;&#125;, &#123;&#123;unsubscribe_url&#125;&#125;
                </div>
              </div>

              {/* Scheduling Options */}
              <div className="space-y-4">
                <Label>Delivery Options</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendNow}
                      onCheckedChange={(checked) => setSendNow(checked as boolean)}
                    />
                    <Label className="text-sm">Send immediately</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!sendNow}
                      onCheckedChange={(checked) => setSendNow(!(checked as boolean))}
                    />
                    <Label className="text-sm">Schedule for later</Label>
                  </div>
                </div>
                
                {!sendNow && (
                  <div>
                    <Input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Preview and Send */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Ready to {sendNow ? 'send' : 'schedule'} to {selectedContacts.length} recipients
                  </div>
                  {selectedContacts.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Estimated delivery: {sendNow ? 'Immediate' : new Date(scheduledTime).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={!emailSubject || !emailContent}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  
                  <Button
                    onClick={handleSendBulkEmail}
                    disabled={isSending || selectedContacts.length === 0 || !emailSubject || !emailContent}
                    className="min-w-32"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {sendNow ? 'Sending...' : 'Scheduling...'}
                      </>
                    ) : (
                      <>
                        {sendNow ? (
                          <Send className="h-4 w-4 mr-2" />
                        ) : (
                          <Calendar className="h-4 w-4 mr-2" />
                        )}
                        {sendNow ? 'Send Email' : 'Schedule Email'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Email Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-sm font-medium text-muted-foreground mb-2">Subject:</div>
              <div className="font-medium">{emailSubject}</div>
            </div>
            <div className="border rounded-lg p-4 bg-muted/20 max-h-96 overflow-y-auto">
              <div className="text-sm font-medium text-muted-foreground mb-2">Content:</div>
              <div className="whitespace-pre-wrap text-sm">{emailContent}</div>
            </div>
            <div className="text-xs text-muted-foreground">
              This is how your email will appear to recipients. Personalization variables will be replaced with actual values.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};