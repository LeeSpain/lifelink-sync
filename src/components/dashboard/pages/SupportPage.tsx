import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  Book, 
  FileText, 
  Send, 
  ExternalLink, 
  Bot,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Save
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";

export function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: `👋 Hi ${user?.user_metadata?.first_name || user?.email?.split('@')[0] || "there"}! I'm Clara, your AI assistant. I'm here to help you with your emergency protection questions. How can I assist you today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "",
    message: ""
  });
  const [searchQuery, setSearchQuery] = useState("");

  const sendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: currentMessage,
          sessionId: `support-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id || null,
          context: `dashboard-support - User: ${user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User'}`,
          conversation_history: messages.slice(-5)
        }
      });

      if (error) throw error;

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request. Please try again.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('supportPage.connectionError'),
        description: t('supportPage.unableToConnectClara'),
        variant: "destructive"
      });
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.message) {
      toast({
        title: t('supportPage.missingInformation'),
        description: t('supportPage.fillRequiredFields'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically save to a support_tickets table
      // For now, we'll simulate the submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: t('supportPage.ticketSubmitted'),
        description: t('supportPage.ticketSubmittedDescription'),
      });
      
      setTicketForm({ subject: "", category: "", priority: "", message: "" });
    } catch (error) {
      toast({
        title: t('supportPage.submissionFailed'),
        description: t('supportPage.errorSubmittingTicket'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: "technical", label: t('supportPage.catTechnical') },
    { value: "billing", label: t('supportPage.catBilling') },
    { value: "account", label: t('supportPage.catAccount') },
    { value: "device", label: t('supportPage.catDevice') },
    { value: "emergency", label: t('supportPage.catEmergency') },
    { value: "feature", label: t('supportPage.catFeature') },
    { value: "other", label: t('supportPage.catOther') }
  ];

  const priorities = [
    { value: "low", label: t('supportPage.priorityLow'), color: "text-muted-foreground" },
    { value: "medium", label: t('supportPage.priorityMedium'), color: "text-foreground" },
    { value: "high", label: t('supportPage.priorityHigh'), color: "text-foreground" },
    { value: "urgent", label: t('supportPage.priorityUrgent'), color: "text-destructive" }
  ];

  // No support tickets - this will be replaced with real data from database in the future
  const supportTickets: any[] = [];

  const faqItems = [
    {
      question: "How do I set up my emergency device?",
      answer: "To set up your emergency device: 1) Download the LifeLink Sync mobile app, 2) Create an account or log in, 3) Go to 'My Products' and tap 'Add Device', 4) Follow the pairing instructions displayed on your screen. The device will automatically connect to your account once properly configured.",
      category: "Device Setup"
    },
    {
      question: "What happens when I press the SOS button?",
      answer: "When you press the SOS button: 1) Your location is shared with your emergency contacts, 2) Emergency services are contacted based on your plan, 3) A monitoring agent is alerted to assess the situation, 4) Your family members receive instant notifications with your location and status.",
      category: "Emergency Services"
    },
    {
      question: "How do I update my emergency contacts?",
      answer: "You can update your emergency contacts by going to the Emergency section in your dashboard. Click 'Edit' next to any contact to modify their information, or use 'Add Contact' to include new emergency contacts. Make sure to keep this information current for the best emergency response.",
      category: "Account Management"
    },
    {
      question: "Can I share my location with family members?",
      answer: "Yes! You can enable location sharing with family members in the Location section of your dashboard. You can control who sees your location, set up safe zones for automatic notifications, and choose when location sharing is active.",
      category: "Privacy & Location"
    },
    {
      question: "How do I manage my subscription?",
      answer: "Visit the Subscription section in your dashboard to view your current plan, billing history, and payment methods. You can upgrade, downgrade, or cancel your subscription at any time. For family plans, you can also manage family member access from this section.",
      category: "Billing"
    },
    {
      question: "Is my data secure and private?",
      answer: "Yes, we take your privacy and security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties except for emergency services when you activate SOS. You can control your privacy settings in your dashboard.",
      category: "Privacy & Security"
    },
    {
      question: "How long does the battery last on emergency devices?",
      answer: "Battery life varies by device model, but most of our emergency devices last 3-7 days on a single charge with normal usage. In emergency mode, devices can operate for 24-48 hours continuously. We recommend charging your device weekly.",
      category: "Device Specifications"
    },
    {
      question: "Can I test my emergency system?",
      answer: "Yes! You can perform a test from your dashboard without triggering actual emergency services. Go to Settings > Emergency Test to send test notifications to your contacts and verify your system is working properly.",
      category: "Testing & Maintenance"
    }
  ];

  const knowledgeBaseArticles = [
    {
      title: "Getting Started Guide",
      description: "Complete setup instructions for new users",
      category: "Setup",
      readTime: "5 min",
      icon: <Zap className="h-5 w-5 text-primary" />
    },
    {
      title: "Emergency Response Procedures",
      description: "What happens during an emergency activation",
      category: "Emergency",
      readTime: "8 min",
      icon: <AlertCircle className="h-5 w-5 text-primary" />
    },
    {
      title: "Device Troubleshooting",
      description: "Common issues and solutions for all devices",
      category: "Technical",
      readTime: "10 min",
      icon: <HelpCircle className="h-5 w-5 text-muted-foreground" />
    },
    {
      title: "Privacy and Security Settings",
      description: "Managing your data and privacy preferences",
      category: "Privacy",
      readTime: "6 min",
      icon: <CheckCircle className="h-5 w-5 text-muted-foreground" />
    },
    {
      title: "Family Plan Management",
      description: "Adding and managing family members",
      category: "Account",
      readTime: "7 min",
      icon: <FileText className="h-5 w-5 text-primary" />
    },
    {
      title: "Billing and Subscription FAQ",
      description: "Common billing questions and account management",
      category: "Billing",
      readTime: "4 min",
      icon: <Clock className="h-5 w-5 text-muted-foreground" />
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "in progress":
        return <Badge variant="secondary">In Progress</Badge>;
      case "resolved":
        return <Badge variant="secondary">Resolved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredFAQ = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || "User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('supportPage.title')}</h1>
        <p className="text-muted-foreground">{t('supportPage.subtitle')}</p>
      </div>

      {/* Clara AI Assistant - Embedded Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t('supportPage.chatWithClara')}
          </CardTitle>
          <CardDescription>
            {t('supportPage.chatWithClaraDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="border border-border rounded-lg bg-background">
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg break-words ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg flex items-center space-x-2 max-w-[85%]">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">{t('supportPage.claraThinking')}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('supportPage.askClaraPlaceholder')}
                  disabled={isChatLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isChatLoading}
                  size="sm"
                  className="px-3"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('supportPage.claraCanHelp')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Support Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('supportPage.submitTicket')}
          </CardTitle>
          <CardDescription>
            {t('supportPage.submitTicketDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-2 block">{t('supportPage.subject')} *</label>
              <Input
                placeholder={t('supportPage.subjectPlaceholder')}
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-xs font-medium mb-2 block">{t('supportPage.category')} *</label>
              <Select
                value={ticketForm.category}
                onValueChange={(value) => setTicketForm({...ticketForm, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('supportPage.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="md:w-1/2">
            <label className="text-xs font-medium mb-2 block">{t('supportPage.priority')}</label>
            <Select
              value={ticketForm.priority}
              onValueChange={(value) => setTicketForm({...ticketForm, priority: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('supportPage.selectPriority')} />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={priority.color}>{priority.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-2 block">{t('supportPage.message')} *</label>
            <Textarea
              placeholder={t('supportPage.messagePlaceholder')}
              rows={5}
              value={ticketForm.message}
              onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
            />
          </div>

          <Button 
            onClick={handleSubmitTicket} 
            disabled={isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Save className="h-4 w-4 animate-spin" />
                {t('supportPage.submitting')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('supportPage.submitTicketButton')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Previous Tickets */}
      {supportTickets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('supportPage.yourTickets')}</CardTitle>
            <CardDescription>
              {t('supportPage.trackTickets')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supportTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div>
                    <h3 className="text-sm font-semibold">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground">Ticket {ticket.id}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Created: {ticket.created}</span>
                      <span>Last update: {ticket.lastUpdate}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(ticket.status)}
                    <Button variant="ghost" size="sm" className="mt-2">
                      {t('supportPage.viewDetails')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequently Asked Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('supportPage.faq')}
          </CardTitle>
          <CardDescription>
            {t('supportPage.faqDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('supportPage.searchFaq')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            {filteredFAQ.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm font-bold">{item.question}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredFAQ.length === 0 && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-sm font-semibold mb-2">{t('supportPage.noResults')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('supportPage.tryAdjustingSearch')}
            </p>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            {t('supportPage.knowledgeBase')}
          </CardTitle>
          <CardDescription>
            {t('supportPage.knowledgeBaseDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeBaseArticles.map((article, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">
                    {article.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                      {article.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {article.category}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Emergency Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">{t('supportPage.emergencyLine')}</h3>
                <p className="text-xs text-muted-foreground">1-800-LIFELINK</p>
                <p className="text-xs text-muted-foreground">{t('supportPage.available247')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-semibold">{t('supportPage.emailSupport')}</h3>
                <p className="text-xs text-muted-foreground">support@icesurvival.com</p>
                <p className="text-xs text-muted-foreground">{t('supportPage.responseWithin24h')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}