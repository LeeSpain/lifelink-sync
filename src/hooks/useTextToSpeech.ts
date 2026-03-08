import { useState, useEffect, useRef, useCallback } from 'react';

const PREFERRED_VOICES = [
  'Google UK English Female',
  'Samantha',
  'Karen',
  'Moira',
  'Tessa',
  'Microsoft Hazel',
];

interface UseTextToSpeechOptions {
  voiceLang?: string;
  rate?: number;
  pitch?: number;
}

export function useTextToSpeech({
  voiceLang = 'en',
  rate = 0.9,
  pitch = 1.0,
}: UseTextToSpeechOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(
    () => localStorage.getItem('clara-tts-muted') === '1'
  );
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Resolve best voice (voices load async on Chrome/Android)
  useEffect(() => {
    if (!isSupported) return;

    const pickVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length === 0) return;

      // Try preferred voices first
      for (const name of PREFERRED_VOICES) {
        const match = voices.find((v) => v.name === name);
        if (match) {
          voiceRef.current = match;
          return;
        }
      }

      // Fallback: first English female-sounding voice, then any English voice
      const english = voices.filter((v) => v.lang.startsWith(voiceLang));
      voiceRef.current = english[0] || voices[0] || null;
    };

    pickVoice();
    speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, [isSupported, voiceLang]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || isMuted || !text.trim()) return;

      // Cancel any current speech to avoid queue buildup
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (voiceRef.current) utterance.voice = voiceRef.current;
      utterance.lang = voiceLang;
      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechSynthesis.speak(utterance);
    },
    [isSupported, isMuted, voiceLang, rate, pitch]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('clara-tts-muted', next ? '1' : '0');
      if (next) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isMuted,
    toggleMute,
    isSupported,
  };
}
