import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceActivation, type VoiceCommand } from '@/hooks/useVoiceActivation';

export interface ChatMessage {
  id: string;
  role: 'user' | 'clara';
  content: string;
  timestamp: string;
}

interface UseTabletVoiceOptions {
  onSOSTrigger: () => void;
  micPermission: 'granted' | 'denied' | 'skipped' | null;
}

export function useTabletVoice({ onSOSTrigger, micPermission }: UseTabletVoiceOptions) {
  const { user } = useAuth();
  const tts = useTextToSpeech({ rate: 0.9 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [voiceEnabled, setVoiceEnabled] = useState(
    () => micPermission === 'granted' && localStorage.getItem('clara-voice-enabled') !== '0'
  );
  const [hasGreeted, setHasGreeted] = useState(false);

  // Refs for stable callbacks
  const onSOSTriggerRef = useRef(onSOSTrigger);
  onSOSTriggerRef.current = onSOSTrigger;
  const ttsRef = useRef(tts);
  ttsRef.current = tts;
  const wasPausedForSpeech = useRef(false);

  // Persist voice toggle
  useEffect(() => {
    localStorage.setItem('clara-voice-enabled', voiceEnabled ? '1' : '0');
  }, [voiceEnabled]);

  // Update voice enabled when mic permission changes
  useEffect(() => {
    if (micPermission === 'granted') {
      setVoiceEnabled(localStorage.getItem('clara-voice-enabled') !== '0');
    } else if (micPermission === 'denied' || micPermission === 'skipped') {
      setVoiceEnabled(false);
    }
  }, [micPermission]);

  // Send message to ai-chat edge function
  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: text,
          sessionId,
          userId: user?.id,
          context: 'tablet-dashboard',
          language: 'en',
        },
      });

      if (error) throw error;

      const reply = data?.response || "I'm sorry, I couldn't process that right now.";
      const claraMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'clara',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, claraMsg]);
      ttsRef.current.speak(reply);
    } catch {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'clara',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  }, [sessionId, user?.id]);

  // Add a Clara message to chat (used by alert system)
  const addClaraMessage = useCallback((content: string, speak = true) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'clara',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    if (speak) {
      ttsRef.current.speak(content);
    }
  }, []);

  // Voice commands
  const handleSOS = useCallback(() => {
    onSOSTriggerRef.current();
  }, []);

  const handleClaraActivate = useCallback(() => {
    ttsRef.current.speak("I'm here. How can I help?");
  }, []);

  const commands: VoiceCommand[] = [
    {
      phrases: ['help', 'help help help', 'emergency', 'sos', 'call for help'],
      onMatch: handleSOS,
      label: 'SOS',
    },
    {
      phrases: ['clara', 'hey clara'],
      onMatch: handleClaraActivate,
      label: 'Clara',
    },
  ];

  const voice = useVoiceActivation({
    commands,
    isEnabled: voiceEnabled,
  });

  // Pause/resume recognition when Clara speaks
  useEffect(() => {
    if (tts.isSpeaking && voice.isListening) {
      voice.stopListening();
      wasPausedForSpeech.current = true;
    } else if (!tts.isSpeaking && wasPausedForSpeech.current && voiceEnabled && !voice.isListening) {
      const timer = setTimeout(() => {
        if (wasPausedForSpeech.current) {
          voice.startListening();
          wasPausedForSpeech.current = false;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tts.isSpeaking, voice.isListening, voiceEnabled]);

  // Greeting on load
  const speakGreeting = useCallback(() => {
    if (hasGreeted) return;
    setHasGreeted(true);

    const h = new Date().getHours();
    const timeOfDay = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const firstName = user?.user_metadata?.first_name || '';
    const greeting = firstName
      ? `Good ${timeOfDay}, ${firstName}. I'm here and listening. Just say Hey Clara if you need me.`
      : `Good ${timeOfDay}. I'm here and listening. Just say Hey Clara if you need me.`;

    addClaraMessage(greeting, true);
  }, [hasGreeted, user, addClaraMessage]);

  return {
    // Chat
    messages,
    sendMessage,
    addClaraMessage,
    isThinking,

    // TTS
    isSpeaking: tts.isSpeaking,
    isMuted: tts.isMuted,
    toggleMute: tts.toggleMute,
    speak: tts.speak,

    // Voice
    isListening: voice.isListening,
    hasPermission: voice.hasPermission,
    transcript: voice.transcript,
    voiceEnabled,
    setVoiceEnabled,

    // Greeting
    speakGreeting,
    hasGreeted,
  };
}
