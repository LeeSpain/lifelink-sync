import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ContactChatWidgetProps {
  className?: string;
  placeholder?: string;
}

const ContactChatWidget: React.FC<ContactChatWidgetProps> = ({ 
  className = "",
  placeholder = "Ask Clara about LifeLink Sync..."
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `👋 Hi there! I'm Clara, your LifeLink Sync AI assistant. I'm here to help answer questions about our emergency protection services, features, pricing, and anything else you'd like to know. How can I assist you today?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
          sessionId: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: null,
          context: "contact - Customer support and general inquiries",
          conversation_history: messages.slice(-5) // Send last 5 messages for context
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I'm sorry, I couldn't process that request. Please try again or use the contact form for more detailed assistance.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Unable to connect to Clara. Please try again or use the contact form.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or feel free to use the contact form for assistance.",
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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">Clara AI Assistant</h3>
            <p className="text-xs text-white/80">Live Support Chat</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0 bg-background">
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
                  <span className="text-sm">Clara is thinking...</span>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
        
        <div className="p-4 border-t bg-background">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
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
            Clara can help with features, pricing, account questions, and more
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactChatWidget;