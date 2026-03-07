import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Loader2, Phone, PhoneCall, Globe, Video, Sparkles, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useInteractionTracking } from '@/hooks/useInteractionTracking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const EnhancedChatWidget: React.FC<ChatWidgetProps> = ({
  isOpen,
  onClose,
  userName = "User",
  context = "registration"
}) => {
  const { t, i18n } = useTranslation();
  const { language, currency } = usePreferences();
  const { trackChatInteraction } = useInteractionTracking();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: t('clara.greeting', {
        defaultValue: `Hi {{userName}}! I'm Clara, your AI protection assistant. I'm here to help you 24/7 with anything about LifeLink Sync. How can I assist you today?`,
        userName
      }),
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    const systemMessage: Message = {
      id: Date.now().toString(),
      content: lang === 'es'
        ? 'Idioma cambiado a Espanol. Puedo ayudarte en espanol ahora!'
        : 'Language changed to English. I can help you in English now!',
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);
    trackChatInteraction('language_changed', context, 0, { language: lang });
  };

  const requestCallback = async (type: 'voice' | 'video') => {
    trackChatInteraction('callback_requested', context, 0, { type });

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('instant-callback', {
        body: {
          phone: user?.phone || 'chat-user',
          name: userName,
          email: user?.email || '',
          urgency: 'high',
          preferredLanguage: currentLanguage,
          callbackType: type,
          source: 'chat_widget',
          context: context
        }
      });

      if (error) throw error;

      const callbackMessage: Message = {
        id: Date.now().toString(),
        content: currentLanguage === 'es'
          ? `Excelente! Nuestro equipo te llamara en menos de 60 segundos. ${type === 'video' ? 'Preparate para una videollamada.' : 'Manten tu telefono cerca.'}`
          : `Great! Our team will call you back in less than 60 seconds. ${type === 'video' ? 'Get ready for a video call.' : 'Keep your phone nearby.'}`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, callbackMessage]);

      toast({
        title: currentLanguage === 'es' ? 'Llamada Solicitada' : 'Callback Requested',
        description: currentLanguage === 'es'
          ? 'Te llamaremos en 60 segundos!'
          : 'We\'ll call you in 60 seconds!',
      });
    } catch (error) {
      console.error('Error requesting callback:', error);
      toast({
        title: 'Error',
        description: currentLanguage === 'es'
          ? 'No pudimos solicitar la llamada. Por favor intenta de nuevo.'
          : 'Unable to request callback. Please try again.',
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

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
          context: `${context} - User: ${userName} - Language: ${currentLanguage}`,
          language: currentLanguage,
          currency,
          conversation_history: messages.slice(-5)
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || (currentLanguage === 'es'
          ? "Lo siento, no pude procesar esa solicitud. Por favor intenta de nuevo."
          : "I'm sorry, I couldn't process that request. Please try again."),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      trackChatInteraction('message_received', context, data.response?.length || 0);
    } catch (error) {
      console.error('Error sending message:', error);
      trackChatInteraction('error', context, 0);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: currentLanguage === 'es'
          ? "Disculpa, estoy teniendo problemas de conexion. Por favor intenta de nuevo en un momento."
          : "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-md h-[100dvh] sm:h-[600px] sm:max-h-[80vh] min-h-[400px] flex flex-col bg-white sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="relative bg-[hsl(215,28%,17%)] px-4 py-4 flex-shrink-0">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Clara Avatar */}
              <div className="relative">
                <img
                  src="/clara-avatar.png"
                  alt="Clara AI"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/20"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[hsl(215,28%,17%)]" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base leading-tight">Clara AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/60 text-xs">
                    {currentLanguage === 'es' ? 'En linea' : 'Online now'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                    title={currentLanguage === 'es' ? 'Cambiar idioma' : 'Change language'}
                  >
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem onClick={() => changeLanguage('en')} className="gap-2">
                    <span>EN</span> English {currentLanguage === 'en' && <span className="ml-auto text-primary">&#10003;</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage('es')} className="gap-2">
                    <span>ES</span> Espanol {currentLanguage === 'es' && <span className="ml-auto text-primary">&#10003;</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Voice Call */}
              <Button
                onClick={() => requestCallback('voice')}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                title={currentLanguage === 'es' ? 'Llamada de voz' : 'Voice call'}
              >
                <Phone className="h-4 w-4" />
              </Button>

              {/* Video Call */}
              <Button
                onClick={() => requestCallback('video')}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                title={currentLanguage === 'es' ? 'Videollamada' : 'Video call'}
              >
                <Video className="h-4 w-4" />
              </Button>

              {/* Close */}
              <Button
                onClick={() => {
                  trackChatInteraction('chat_closed', context);
                  onClose();
                }}
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 p-0 ml-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-[hsl(220,14%,96%)]">
          <div className="px-4 py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar for Clara messages */}
                {!message.isUser && (
                  <img
                    src="/clara-avatar.png"
                    alt="Clara"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1 ring-1 ring-black/5"
                  />
                )}

                <div className={`max-w-[78%] ${message.isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      message.isUser
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-white text-foreground shadow-sm border border-black/5 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <p className={`text-[10px] mt-1 px-1 ${message.isUser ? 'text-right' : 'text-left'} text-muted-foreground/60`}>
                    {message.timestamp.toLocaleTimeString(currentLanguage === 'es' ? 'es-ES' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-2.5">
                <img
                  src="/clara-avatar.png"
                  alt="Clara"
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-1 ring-1 ring-black/5"
                />
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-black/5">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Footer / Input Area */}
        <div className="border-t border-border/50 bg-white p-3 flex-shrink-0">
          {/* Quick Actions */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => requestCallback('voice')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
            >
              <PhoneCall className="h-3 w-3" />
              {currentLanguage === 'es' ? 'Llamar' : 'Call Now'}
            </button>
            <button
              onClick={() => {
                setInputMessage(currentLanguage === 'es'
                  ? 'Como funciona LifeLink Sync?'
                  : 'How does LifeLink Sync work?');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
            >
              <Shield className="h-3 w-3" />
              {currentLanguage === 'es' ? 'Como funciona?' : 'How it works?'}
            </button>
            <button
              onClick={() => {
                setInputMessage(currentLanguage === 'es'
                  ? 'Cuanto cuesta?'
                  : 'What are the pricing plans?');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
            >
              <Sparkles className="h-3 w-3" />
              {currentLanguage === 'es' ? 'Precios' : 'Pricing'}
            </button>
          </div>

          {/* Input */}
          <div className="flex items-center gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'es'
                ? 'Escribe tu mensaje...'
                : 'Type your message...'}
              disabled={isLoading}
              className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 px-4 h-10"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              size="icon"
              className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
            {currentLanguage === 'es'
              ? 'Impulsado por LifeLink AI  |  Disponible 24/7'
              : 'Powered by LifeLink AI  |  Available 24/7'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatWidget;
