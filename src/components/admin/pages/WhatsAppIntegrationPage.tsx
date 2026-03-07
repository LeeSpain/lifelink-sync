import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MessageSquare, Phone, Users, TrendingUp, Settings, CheckCircle, AlertCircle, Clock, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppAccount {
  id: string;
  business_account_id: string;
  phone_number: string;
  phone_number_id: string;
  display_name?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WhatsAppConversation {
  id: string;
  phone_number: string;
  contact_name?: string;
  status: string;
  last_message_at: string;
  is_business_initiated: boolean;
  metadata: any;
}

interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: string;
  message_type: string;
  content?: string;
  timestamp: string;
  status: string;
  is_ai_generated: boolean;
}

const WhatsAppIntegrationPage: React.FC = () => {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsRes, conversationsRes, messagesRes] = await Promise.all([
        supabase.from('whatsapp_accounts').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_conversations').select('*').order('last_message_at', { ascending: false }),
        supabase.from('whatsapp_messages').select('*').order('timestamp', { ascending: false }).limit(100)
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (conversationsRes.error) throw conversationsRes.error;
      if (messagesRes.error) throw messagesRes.error;

      setAccounts(accountsRes.data || []);
      setConversations(conversationsRes.data || []);
      setMessages(messagesRes.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading WhatsApp data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const conversationsChannel = supabase
      .channel('whatsapp_conversations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        loadData();
      })
      .subscribe();

    const messagesChannel = supabase
      .channel('whatsapp_messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      const { error } = await supabase.from('whatsapp_messages').insert({
        conversation_id: selectedConversation,
        direction: 'outbound',
        message_type: 'text',
        content: newMessage,
        status: 'sent',
        is_ai_generated: false
      });

      if (error) throw error;

      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.phone_number.includes(searchTerm)
  );

  const conversationMessages = messages.filter(msg => msg.conversation_id === selectedConversation);

  const analyticsData = {
    messageVolume: [
      { date: '2024-01-01', messages: 120 },
      { date: '2024-01-02', messages: 150 },
      { date: '2024-01-03', messages: 200 },
      { date: '2024-01-04', messages: 180 },
      { date: '2024-01-05', messages: 220 },
      { date: '2024-01-06', messages: 190 },
      { date: '2024-01-07', messages: 250 }
    ],
    responseTime: [
      { hour: '9AM', avgResponse: 2.5 },
      { hour: '10AM', avgResponse: 3.2 },
      { hour: '11AM', avgResponse: 1.8 },
      { hour: '12PM', avgResponse: 4.1 },
      { hour: '1PM', avgResponse: 2.9 },
      { hour: '2PM', avgResponse: 2.1 },
      { hour: '3PM', avgResponse: 3.5 }
    ]
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h1>
          <p className="text-muted-foreground">Manage WhatsApp Business accounts and conversations</p>
        </div>
        <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
          <DialogTrigger asChild>
            <Button>Add Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add WhatsApp Business Account</DialogTitle>
              <DialogDescription>
                Connect a new WhatsApp Business account to the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">Phone Number</Label>
                <Input id="phone" placeholder="+1234567890" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display-name" className="text-right">Display Name</Label>
                <Input id="display-name" placeholder="Business Name" className="col-span-3" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAccountDialog(false)}>Cancel</Button>
              <Button onClick={() => setShowAccountDialog(false)}>Connect Account</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.filter(a => a.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.filter(c => c.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              {conversations.length} total conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messages.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {messages.filter(m => m.direction === 'outbound').length} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Avg. 2.3min response time
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <div className="flex gap-4">
            <div className="w-1/3">
              <Card>
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-4 border-b cursor-pointer hover:bg-accent ${
                          selectedConversation === conversation.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{conversation.contact_name || conversation.phone_number}</h4>
                            <p className="text-sm text-muted-foreground">{conversation.phone_number}</p>
                          </div>
                          <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                            {conversation.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(conversation.last_message_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-2/3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedConversation 
                      ? `Chat with ${conversations.find(c => c.id === selectedConversation)?.contact_name || 'Customer'}`
                      : 'Select a conversation'
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-4">
                      <div className="h-64 overflow-y-auto border rounded p-4 space-y-2">
                        {conversationMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                message.direction === 'outbound'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                                {message.is_ai_generated && ' (AI)'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                        <Button onClick={sendMessage}>Send</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Select a conversation to start chatting
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Business Accounts</CardTitle>
              <CardDescription>Manage your connected WhatsApp Business accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.phone_number}</TableCell>
                      <TableCell>{account.display_name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(account.status)}`}></div>
                          <span className="capitalize">{account.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Message Volume</CardTitle>
                <CardDescription>Daily message traffic</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.messageVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Average response time by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.responseTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgResponse" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Settings</CardTitle>
              <CardDescription>Configure your WhatsApp integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" placeholder="https://your-domain.com/webhook" />
              </div>
              <div>
                <Label htmlFor="verify-token">Verify Token</Label>
                <Input id="verify-token" placeholder="Your verification token" />
              </div>
              <div>
                <Label htmlFor="access-token">Access Token</Label>
                <Input id="access-token" type="password" placeholder="Your WhatsApp access token" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppIntegrationPage;