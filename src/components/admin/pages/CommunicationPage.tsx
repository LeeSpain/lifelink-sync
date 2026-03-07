import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SLASettingsPanel from '@/components/admin/communication/SLASettingsPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Mail, 
  MessageSquare, 
  Bot, 
  Send, 
  Reply, 
  RefreshCw,
  Phone,
  AtSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Users,
  Filter,
  Search,
  Calendar,
  Target,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface UnifiedConversation {
  id: string;
  channel: 'email' | 'whatsapp' | 'web_chat';
  subject?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: 'open' | 'assigned' | 'closed' | 'escalated';
  priority: number;
  assigned_to?: string;
  tags: string[];
  latest_message?: any;
  message_count: number;
  last_activity_at: string;
  created_at: string;
  ai_suggested_reply?: string;
  ai_sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  ai_category?: 'inquiry' | 'interest' | 'support' | 'complaint';
}

interface CommunicationMetrics {
  total_conversations: number;
  total_messages: number;
  avg_response_time: number;
  avg_resolution_time: number;
  channel_breakdown: Record<string, number>;
}

export default function CommunicationPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Unified Inbox State
  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    channel: '',
    status: '',
    assigned_to: '',
    priority: ''
  });
  
  // Analytics State
  const [metrics, setMetrics] = useState<CommunicationMetrics | null>(null);
  const [analyticsDateRange, setAnalyticsDateRange] = useState('7d');
  
  // Handover State
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [handoverData, setHandoverData] = useState({
    to_user_id: '',
    reason: '',
    notes: ''
  });
  
  // Bulk Messaging State
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkCampaign, setBulkCampaign] = useState({
    name: '',
    description: '',
    channel: 'email' as 'email' | 'whatsapp' | 'both',
    content_template: '',
    subject_template: '',
    target_criteria: {
      subscription_status: '',
      country: '',
      created_after: ''
    }
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // AI Draft State
  const [draftingReply, setDraftingReply] = useState(false);
  const [autoDraftOnOpen, setAutoDraftOnOpen] = useState(false);
  useEffect(() => {
    loadConversations();
    loadMetrics();
    loadCampaigns();
  }, [filters]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-inbox', {
        body: {
          action: 'get_conversations',
          filters: Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== '')
          )
        }
      });

      if (error) throw error;
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('unified-inbox', {
        body: {
          action: 'get_messages',
          conversation_id: conversationId
        }
      });

      if (error) throw error;
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const loadMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('communication_metrics_summary')
        .select('*')
        .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Aggregate metrics
      const totalConversations = data?.reduce((sum, row) => sum + (row.total_conversations || 0), 0) || 0;
      const totalMessages = data?.reduce((sum, row) => sum + (row.total_messages || 0), 0) || 0;
      const avgResponseTime = data?.reduce((sum, row) => sum + (row.avg_response_time || 0), 0) / (data?.length || 1);
      const avgResolutionTime = data?.reduce((sum, row) => sum + (row.avg_resolution_time || 0), 0) / (data?.length || 1);

      const channelBreakdown: Record<string, number> = {};
      data?.forEach(row => {
        channelBreakdown[row.channel] = (channelBreakdown[row.channel] || 0) + (row.total_conversations || 0);
      });

      setMetrics({
        total_conversations: totalConversations,
        total_messages: totalMessages,
        avg_response_time: Math.round(avgResponseTime || 0),
        avg_resolution_time: Math.round(avgResolutionTime || 0),
        channel_breakdown: channelBreakdown
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-messaging', {
        body: { action: 'get_campaigns' }
      });

      if (error) throw error;
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('unified-inbox', {
        body: {
          action: 'send_message',
          conversation_id: selectedConversation.id,
          message_data: {
            content: newMessage,
            direction: 'outbound',
            sender_name: 'Support Team'
          }
        }
      });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handoverConversation = async () => {
    if (!selectedConversation || !handoverData.to_user_id) return;

    try {
      const { data, error } = await supabase.functions.invoke('unified-inbox', {
        body: {
          action: 'handover_conversation',
          conversation_id: selectedConversation.id,
          handover_data: {
            ...handoverData,
            initiated_by: user?.id
          }
        }
      });

      if (error) throw error;

      setShowHandoverDialog(false);
      setHandoverData({ to_user_id: '', reason: '', notes: '' });
      loadConversations();

      toast({
        title: "Handover Complete",
        description: "Conversation has been handed over successfully",
      });
    } catch (error) {
      console.error('Error handing over conversation:', error);
      toast({
        title: "Error",
        description: "Failed to handover conversation",
        variant: "destructive",
      });
    }
  };

  // Draft Reply with Clara
  const draftReplyWithClara = async (conversationId?: string) => {
    const targetId = conversationId || selectedConversation?.id;
    if (!targetId) return;
    
    setDraftingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke('unified-inbox', {
        body: {
          action: 'draft_reply',
          conversation_id: targetId
        }
      });

      if (error) throw error;

      // Update the selected conversation with AI data
      if (selectedConversation && selectedConversation.id === targetId) {
        setSelectedConversation({
          ...selectedConversation,
          ai_suggested_reply: data.ai_suggested_reply,
          ai_sentiment: data.ai_sentiment,
          ai_category: data.ai_category
        });
      }
      
      // Pre-fill the message textarea with the draft
      if (data.ai_suggested_reply) {
        setNewMessage(data.ai_suggested_reply);
      }

      toast({
        title: "Draft Created",
        description: "Clara has drafted a reply for your review",
      });
    } catch (error) {
      console.error('Error drafting reply:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDraftingReply(false);
    }
  };

  // Handle conversation selection with optional auto-draft
  const handleSelectConversation = async (conversation: UnifiedConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Auto-draft if enabled and no existing draft
    if (autoDraftOnOpen && !conversation.ai_suggested_reply) {
      await draftReplyWithClara(conversation.id);
    }
  };

  // Use AI Draft button handler
  const useAiDraft = () => {
    if (selectedConversation?.ai_suggested_reply) {
      setNewMessage(selectedConversation.ai_suggested_reply);
      toast({
        title: "Draft Applied",
        description: "AI draft has been added to your reply",
      });
    }
  };

  // Get sentiment badge variant
  const getSentimentBadge = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return { variant: 'default' as const, className: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'negative': return { variant: 'destructive' as const, className: '' };
      case 'urgent': return { variant: 'destructive' as const, className: 'bg-red-600' };
      default: return { variant: 'secondary' as const, className: '' };
    }
  };

  // Get category badge variant
  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'interest': return { variant: 'default' as const, className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'support': return { variant: 'secondary' as const, className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'complaint': return { variant: 'destructive' as const, className: '' };
      default: return { variant: 'outline' as const, className: '' };
    }
  };

  const createBulkCampaign = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-messaging', {
        body: {
          action: 'create',
          campaignData: bulkCampaign
        }
      });

      if (error) throw error;

      setShowBulkDialog(false);
      setBulkCampaign({
        name: '',
        description: '',
        channel: 'email',
        content_template: '',
        subject_template: '',
        target_criteria: {
          subscription_status: '',
          country: '',
          created_after: ''
        }
      });
      loadCampaigns();

      toast({
        title: "Campaign Created",
        description: `Campaign created with ${data.recipients} recipients`,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const sendCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('bulk-messaging', {
        body: {
          action: 'send',
          campaign_id: campaignId
        }
      });

      if (error) throw error;

      loadCampaigns();

      toast({
        title: "Campaign Sent",
        description: `Sent ${data.sent} messages, ${data.failed} failed`,
      });
    } catch (error) {
      console.error('Error sending campaign:', error);
      toast({
        title: "Error",
        description: "Failed to send campaign",
        variant: "destructive",
      });
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'web_chat': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'assigned': return 'default';
      case 'closed': return 'secondary';
      case 'escalated': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'destructive';
    if (priority <= 3) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Unified Communication Center</h1>
        <p className="text-muted-foreground">Manage all customer communications in one place</p>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inbox">
            <MessageSquare className="h-4 w-4 mr-2" />
            Unified Inbox
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Conversations</CardTitle>
                  <Button onClick={loadConversations} size="sm" disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <Select value={filters.channel || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, channel: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Channels</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="web_chat">Web Chat</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {conversations.map((conversation) => (
                      <div 
                        key={conversation.id} 
                        className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getChannelIcon(conversation.channel)}
                            <Badge variant={getStatusColor(conversation.status)} className="text-xs">
                              {conversation.status}
                            </Badge>
                            <Badge variant={getPriorityColor(conversation.priority)} className="text-xs">
                              P{conversation.priority}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {conversation.message_count} msgs
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1">
                          {conversation.contact_name || conversation.contact_email || conversation.contact_phone || 'Unknown Contact'}
                        </h4>
                        
                        {conversation.subject && (
                          <p className="text-sm text-muted-foreground mb-1">{conversation.subject}</p>
                        )}
                        
                        {conversation.latest_message && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {conversation.latest_message.content}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>{new Date(conversation.last_activity_at).toLocaleString()}</span>
                          <div className="flex gap-1">
                            {conversation.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {conversations.length === 0 && !loading && (
                      <div className="text-center py-8 text-muted-foreground">
                        No conversations found
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedConversation ? (
                      <div className="flex items-center gap-2">
                        {getChannelIcon(selectedConversation.channel)}
                        <span>{selectedConversation.contact_name || selectedConversation.contact_email || selectedConversation.contact_phone}</span>
                        <Badge variant={getStatusColor(selectedConversation.status)}>
                          {selectedConversation.status}
                        </Badge>
                      </div>
                    ) : (
                      'Select a conversation'
                    )}
                  </CardTitle>
                  
                  {selectedConversation && (
                    <div className="flex items-center gap-2">
                      {/* Auto-draft toggle */}
                      <div className="flex items-center space-x-2 mr-2">
                        <Switch
                          id="auto-draft"
                          checked={autoDraftOnOpen}
                          onCheckedChange={setAutoDraftOnOpen}
                        />
                        <Label htmlFor="auto-draft" className="text-xs text-muted-foreground">
                          Auto-draft
                        </Label>
                      </div>
                      
                      {/* Draft Reply with Clara Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => draftReplyWithClara()}
                        disabled={draftingReply}
                      >
                        {draftingReply ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Draft with Clara
                      </Button>
                      
                      <Dialog open={showHandoverDialog} onOpenChange={setShowHandoverDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Handover
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Handover Conversation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Handover to</label>
                              <Select value={handoverData.to_user_id} onValueChange={(value) => setHandoverData(prev => ({ ...prev, to_user_id: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user1">John Doe</SelectItem>
                                  <SelectItem value="user2">Jane Smith</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Reason</label>
                              <Input
                                value={handoverData.reason}
                                onChange={(e) => setHandoverData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Reason for handover"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Notes</label>
                              <Textarea
                                value={handoverData.notes}
                                onChange={(e) => setHandoverData(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional notes..."
                              />
                            </div>
                            <Button onClick={handoverConversation} className="w-full">
                              Complete Handover
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedConversation ? (
                  <div className="space-y-4">
                    {/* Messages */}
                    <ScrollArea className="h-48 border rounded-lg p-4">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div key={index} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                              message.direction === 'outbound' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className="flex justify-between items-center mt-2 text-xs opacity-70">
                                <span>{message.sender_name}</span>
                                <span>{new Date(message.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {messages.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No messages in this conversation
                          </div>
                        )}
                      </div>
                    </ScrollArea>

                    {/* AI Draft Badges */}
                    {(selectedConversation.ai_sentiment || selectedConversation.ai_category) && (
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Clara's analysis:</span>
                        {selectedConversation.ai_sentiment && (
                          <Badge {...getSentimentBadge(selectedConversation.ai_sentiment)} className={`text-xs ${getSentimentBadge(selectedConversation.ai_sentiment).className}`}>
                            {selectedConversation.ai_sentiment}
                          </Badge>
                        )}
                        {selectedConversation.ai_category && (
                          <Badge {...getCategoryBadge(selectedConversation.ai_category)} className={`text-xs ${getCategoryBadge(selectedConversation.ai_category).className}`}>
                            {selectedConversation.ai_category}
                          </Badge>
                        )}
                        {selectedConversation.ai_suggested_reply && !newMessage && (
                          <Button variant="ghost" size="sm" onClick={useAiDraft} className="ml-auto text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            Use AI Draft
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        rows={8}
                      />
                      <div className="flex flex-col gap-1">
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to view messages</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_conversations || 0}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_messages || 0}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avg_response_time || 0}m</div>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avg_resolution_time || 0}h</div>
                <p className="text-xs text-muted-foreground">Hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Conversations by Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics?.channel_breakdown || {}).map(([channel, count]) => (
                  <div key={channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channel)}
                      <span className="capitalize">{channel.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${(count / (metrics?.total_conversations || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Bulk Messaging Campaigns</h3>
              <p className="text-sm text-muted-foreground">Create and manage bulk messaging campaigns</p>
            </div>
            
            <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Bulk Campaign</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Campaign Name</label>
                      <Input
                        value={bulkCampaign.name}
                        onChange={(e) => setBulkCampaign(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Campaign name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Channel</label>
                      <Select value={bulkCampaign.channel} onValueChange={(value: any) => setBulkCampaign(prev => ({ ...prev, channel: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={bulkCampaign.description}
                      onChange={(e) => setBulkCampaign(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Campaign description"
                    />
                  </div>
                  
                  {bulkCampaign.channel !== 'whatsapp' && (
                    <div>
                      <label className="text-sm font-medium">Subject Template</label>
                      <Input
                        value={bulkCampaign.subject_template}
                        onChange={(e) => setBulkCampaign(prev => ({ ...prev, subject_template: e.target.value }))}
                        placeholder="Email subject (use {{name}} for personalization)"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">Message Template</label>
                    <Textarea
                      value={bulkCampaign.content_template}
                      onChange={(e) => setBulkCampaign(prev => ({ ...prev, content_template: e.target.value }))}
                      placeholder="Message content (use {{name}}, {{email}} for personalization)"
                      rows={4}
                    />
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Target Criteria</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Subscription Status</label>
                        <Select 
                          value={bulkCampaign.target_criteria.subscription_status} 
                          onValueChange={(value) => setBulkCampaign(prev => ({ 
                            ...prev, 
                            target_criteria: { ...prev.target_criteria, subscription_status: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Country</label>
                        <Input
                          value={bulkCampaign.target_criteria.country}
                          onChange={(e) => setBulkCampaign(prev => ({ 
                            ...prev, 
                            target_criteria: { ...prev.target_criteria, country: e.target.value }
                          }))}
                          placeholder="Country code (e.g., US)"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Registered After</label>
                        <Input
                          type="date"
                          value={bulkCampaign.target_criteria.created_after}
                          onChange={(e) => setBulkCampaign(prev => ({ 
                            ...prev, 
                            target_criteria: { ...prev.target_criteria, created_after: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={createBulkCampaign} className="w-full">
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Campaigns List */}
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.channel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <div className="flex gap-4 text-sm">
                        <span>Recipients: {campaign.recipient_count}</span>
                        <span>Sent: {campaign.sent_count || 0}</span>
                        <span>Opened: {campaign.opened_count || 0}</span>
                        <span>Clicked: {campaign.clicked_count || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {campaign.status === 'draft' && (
                        <Button onClick={() => sendCampaign(campaign.id)} size="sm">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {campaigns.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No campaigns yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first bulk messaging campaign</p>
                  <Button onClick={() => setShowBulkDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SLASettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}