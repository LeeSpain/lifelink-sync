import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageCircle, Loader2, Phone, PhoneCall, Globe, Video } from 'lucide-react';
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
        defaultValue: `👋 Hi {{userName}}! I'm Clara, your AI assistant. I'm here to help you 24/7. You can chat with me here, or click the phone icon to speak with our team. How can I assist you today?`,
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

    // Add system message about language change
    const systemMessage: Message = {
      id: Date.now().toString(),
      content: lang === 'es'
        ? '🌍 Idioma cambiado a Español. ¡Puedo ayudarte en español ahora!'
        : '🌍 Language changed to English. I can help you in English now!',
      isUser: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, systemMessage]);

    trackChatInteraction('language_changed', context, 0, { language: lang });
  };

  const requestCallback = async (type: 'voice' | 'video') => {
    trackChatInteraction('callback_requested', context, 0, { type });

    try {
      // Request instant callback via our callback system
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('instant-callback', {
        body: {
          phone: user?.phone || 'chat-user', // Will need phone collection
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
          ? `📞 ¡Excelente! Nuestro equipo te llamará en menos de 60 segundos. ${type === 'video' ? 'Prepárate para una videollamada.' : 'Mantén tu teléfono cerca.'} Tu idioma preferido es Español.`
          : `📞 Great! Our team will call you back in less than 60 seconds. ${type === 'video' ? 'Get ready for a video call.' : 'Keep your phone nearby.'} Your preferred language is English.`,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, callbackMessage]);

      toast({
        title: currentLanguage === 'es' ? 'Llamada Solicitada' : 'Callback Requested',
        description: currentLanguage === 'es'
          ? '¡Te llamaremos en 60 segundos!'
          : 'We\'ll call you in 60 seconds!',
      });
    } catch (error) {
      console.error('Error requesting callback:', error);
      toast({
        title: currentLanguage === 'es' ? 'Error' : 'Error',
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
          ? "Disculpa, estoy teniendo problemas de conexión. Por favor intenta de nuevo en un momento."
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md h-[90vh] max-h-[600px] min-h-[400px] flex flex-col shadow-2xl border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-primary to-emergency text-white rounded-t-lg flex-shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg truncate">
                {currentLanguage === 'es' ? 'Asistente Clara AI' : 'Clara AI Assistant'}
              </CardTitle>
              <p className="text-xs text-white/80 truncate">
                {currentLanguage === 'es' ? 'Guía de Protección de Emergencia' : 'Emergency Protection Guide'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  title={currentLanguage === 'es' ? 'Cambiar idioma' : 'Change language'}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  🇺🇸 English {currentLanguage === 'en' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                  🇪🇸 Español {currentLanguage === 'es' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice Call Button */}
            <Button
              onClick={() => requestCallback('voice')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={currentLanguage === 'es' ? 'Solicitar llamada (60 seg)' : 'Request call (60 sec)'}
            >
              <Phone className="h-4 w-4" />
            </Button>

            {/* Video Call Button */}
            <Button
              onClick={() => requestCallback('video')}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              title={currentLanguage === 'es' ? 'Solicitar videollamada' : 'Request video call'}
            >
              <Video className="h-4 w-4" />
            </Button>

            {/* Close Button */}
            <Button
              onClick={() => {
                trackChatInteraction('chat_closed', context);
                onClose();
              }}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString(currentLanguage === 'es' ? 'es-ES' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 bg-background flex-shrink-0">
            {/* Quick Action Buttons */}
            <div className="flex gap-2 mb-3">
              <Button
                onClick={() => requestCallback('voice')}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                <PhoneCall className="h-3 w-3 mr-1" />
                {currentLanguage === 'es' ? 'Llamar Ahora' : 'Call Now'}
              </Button>
              <Button
                onClick={() => {
                  setInputMessage(currentLanguage === 'es'
                    ? '¿Cómo funciona LifeLink Sync?'
                    : 'How does LifeLink Sync work?');
                }}
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                {currentLanguage === 'es' ? '¿Cómo funciona?' : 'How it works?'}
              </Button>
            </div>

            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={currentLanguage === 'es'
                  ? 'Escribe tu mensaje...'
                  : 'Type your message...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2 text-center">
              {currentLanguage === 'es'
                ? '💬 Chat • 📞 Llamada en 60 seg • 🌍 English/Español'
                : '💬 Chat • 📞 60-sec callback • 🌍 English/Español'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedChatWidget;
