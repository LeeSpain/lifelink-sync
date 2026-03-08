import { useState, useRef, useCallback, useEffect } from 'react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useVoiceActivation, type VoiceCommand } from '@/hooks/useVoiceActivation';

interface UseTabletClaraOptions {
  onSOSTrigger: () => void;
  quietHoursStart?: number; // 0-23, default 22
  quietHoursEnd?: number;   // 0-23, default 7
}

function isQuietHours(start: number, end: number): boolean {
  const h = new Date().getHours();
  if (start > end) {
    // Wraps midnight: e.g. 22:00 → 07:00
    return h >= start || h < end;
  }
  return h >= start && h < end;
}

export function useTabletClara({
  onSOSTrigger,
  quietHoursStart = 22,
  quietHoursEnd = 7,
}: UseTabletClaraOptions) {
  const tts = useTextToSpeech({ rate: 0.9 });
  const [voiceEnabled, setVoiceEnabled] = useState(
    () => localStorage.getItem('clara-voice-enabled') === '1'
  );

  const lastAlertRef = useRef<{ type: string; fromName: string; message: string } | null>(null);

  // Persist voiceEnabled
  useEffect(() => {
    localStorage.setItem('clara-voice-enabled', voiceEnabled ? '1' : '0');
  }, [voiceEnabled]);

  // --- TTS/recognition conflict prevention ---
  // Pause recognition while Clara is speaking to avoid triggering from her own voice
  const wasPausedForSpeech = useRef(false);

  // Stable refs for callbacks so voice commands don't cause re-renders
  const onSOSTriggerRef = useRef(onSOSTrigger);
  onSOSTriggerRef.current = onSOSTrigger;

  const ttsRef = useRef(tts);
  ttsRef.current = tts;

  const handleSOS = useCallback(() => {
    onSOSTriggerRef.current();
  }, []);

  const handleClaraActivate = useCallback(() => {
    ttsRef.current.speak("I'm here. How can I help?");
  }, []);

  const handleReadLast = useCallback(() => {
    const last = lastAlertRef.current;
    if (last) {
      const prefix = last.type === 'reminder' ? 'Reminder' : 'Message';
      ttsRef.current.speak(`${prefix} from ${last.fromName}: ${last.message}`);
    } else {
      ttsRef.current.speak('There are no recent messages.');
    }
  }, []);

  // Voice commands config
  const commands: VoiceCommand[] = [
    {
      phrases: ['help', 'help help help', 'emergency'],
      onMatch: handleSOS,
      label: 'SOS',
    },
    {
      phrases: ['clara', 'hey clara'],
      onMatch: handleClaraActivate,
      label: 'Clara',
    },
    {
      phrases: ['read that', 'read message', 'read it again'],
      onMatch: handleReadLast,
      label: 'Read Message',
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
    } else if (!tts.isSpeaking && wasPausedForSpeech.current && voiceEnabled) {
      // Resume after a short delay to avoid picking up tail-end audio
      const timer = setTimeout(() => {
        voice.startListening();
        wasPausedForSpeech.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tts.isSpeaking, voice.isListening, voiceEnabled]);

  // Speak an incoming alert (called from TabletDashboard subscription callback)
  const speakAlertRef = useRef(
    (type: 'reminder' | 'message', fromName: string, message: string) => {
      // Store for "read that" command
      lastAlertRef.current = { type, fromName, message };

      // Don't speak during quiet hours
      if (isQuietHours(quietHoursStart, quietHoursEnd)) return;

      const prefix = type === 'reminder' ? 'Reminder' : 'Message';
      ttsRef.current.speak(`${prefix} from ${fromName}: ${message}`);
    }
  );

  // Keep the ref function up to date with current quiet hours
  speakAlertRef.current = (type, fromName, message) => {
    lastAlertRef.current = { type, fromName, message };
    if (isQuietHours(quietHoursStart, quietHoursEnd)) return;
    const prefix = type === 'reminder' ? 'Reminder' : 'Message';
    ttsRef.current.speak(`${prefix} from ${fromName}: ${message}`);
  };

  // Stable function identity for consumers
  const speakAlert = useCallback(
    (type: 'reminder' | 'message', fromName: string, message: string) => {
      speakAlertRef.current(type, fromName, message);
    },
    []
  );

  return {
    // TTS
    speakAlert,
    isSpeaking: tts.isSpeaking,
    isMuted: tts.isMuted,
    toggleMute: tts.toggleMute,

    // Voice activation
    isListening: voice.isListening,
    hasPermission: voice.hasPermission,
    transcript: voice.transcript,
    voiceEnabled,
    setVoiceEnabled,
    lastMatchedCommand: voice.lastMatchedCommand,
  };
}
