import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useInteractionTracking } from '@/hooks/useInteractionTracking';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  context?: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isOpen, onClose, userName = "User", context = "registration" }) => {
  const { t } = useTranslation();
  const { language, currency } = usePreferences();
  const { trackChatInteraction } = useInteractionTracking();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t('clara.greeting', { 
        defaultValue: `👋 Hi {{userName}}! I'm Clara, your AI assistant. I'm here to help you with your emergency protection registration. How can I assist you today?`,
        userName 
      }),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Track chat interaction
    trackChatInteraction('message_sent', context, inputMessage.length);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputMessage,
          sessionId: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: null,
          context: `${context} - User: ${userName}`,
          language,
          currency,
          conversation_history: messages.slice(-5) // Send last 5 messages for context
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request. Please try again.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      trackChatInteraction('message_received', context, data.response?.length || 0);
    } catch (error) {
      console.error('Error sending message:', error);
      trackChatInteraction('error', context, 0);
      toast({
        title: t('chatWidget.connectionErrorTitle', { defaultValue: 'Connection Error' }),
        description: t('chatWidget.connectionErrorDesc', { defaultValue: 'Unable to connect to Clara. Please try again.' }),
        variant: "destructive"
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: t('chatWidget.apiErrorMessage', { defaultValue: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." }),
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[90vh] max-h-[600px] min-h-[400px] flex flex-col shadow-2xl border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary to-emergency text-white rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">{t('clara.title', { defaultValue: 'Clara AI Assistant' })}</CardTitle>
              <p className="text-xs text-white/80 truncate">{t('chatWidget.headerSubtitle', { defaultValue: 'Emergency Protection Guide' })}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              trackChatInteraction('chat_closed', context);
              onClose();
            }}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-4">
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
                    style={{ 
                      wordWrap: 'break-word', 
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      hyphens: 'auto'
                    }}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg flex items-center space-x-2 max-w-[85%]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t('chatWidget.thinking', { defaultValue: 'Clara is thinking...' })}</span>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="p-4 border-t bg-background flex-shrink-0">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('clara.placeholder', { defaultValue: 'Ask Clara about emergency protection...' })}
                disabled={isLoading}
                className="flex-1 min-w-0"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="sm"
                className="px-3 flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('chatWidget.footerNote', { defaultValue: 'Clara can help with registration, plans, and emergency features' })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWidget;