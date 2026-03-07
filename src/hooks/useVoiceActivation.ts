import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceActivationConfig {
  triggerPhrase: string;
  onActivation: () => void;
  isEnabled: boolean;
  sensitivity?: number;
}

export const useVoiceActivation = ({
  triggerPhrase = "help help help",
  onActivation,
  isEnabled = false,
  sensitivity = 0.8
}: VoiceActivationConfig) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState('');
  const recognition = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();

      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => {
        setIsListening(true);
        console.log('🎤 Voice activation listening started');
      };

      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).toLowerCase().trim();
        setTranscript(fullTranscript);

        // Check for trigger phrase
        if (fullTranscript.includes(triggerPhrase.toLowerCase())) {
          console.log('🚨 Voice activation triggered!', fullTranscript);
          onActivation();
          // Clear transcript after activation
          setTranscript('');
        }
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setHasPermission(false);
        }
        setIsListening(false);
      };

      recognition.current.onend = () => {
        setIsListening(false);
        // Auto-restart if still enabled
        if (isEnabled && hasPermission) {
          setTimeout(() => {
            startListening();
          }, 1000);
        }
      };

      recognition.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setHasPermission(false);
    }
  }, [triggerPhrase, onActivation, isEnabled, hasPermission]);

  const stopListening = useCallback(() => {
    if (recognition.current) {
      recognition.current.stop();
      recognition.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (isEnabled && hasPermission !== false) {
      startListening();
    } else {
      stopListening();
    }

    return () => {
      stopListening();
    };
  }, [isEnabled, startListening, stopListening, hasPermission]);

  return {
    isListening,
    hasPermission,
    transcript,
    startListening,
    stopListening
  };
};