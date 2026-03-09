import { useState, useEffect, useRef, useCallback } from 'react';

// --- Legacy single-phrase config (backwards-compatible) ---
interface VoiceActivationConfig {
  triggerPhrase: string;
  onActivation: () => void;
  isEnabled: boolean;
  sensitivity?: number;
}

// --- Multi-command config ---
export interface VoiceCommand {
  phrases: string[];
  onMatch: () => void;
  label?: string;
}

interface VoiceActivationConfigMulti {
  commands: VoiceCommand[];
  isEnabled: boolean;
  sensitivity?: number;
}

type VoiceActivationInput = VoiceActivationConfig | VoiceActivationConfigMulti;

function isMultiConfig(config: VoiceActivationInput): config is VoiceActivationConfigMulti {
  return 'commands' in config;
}

export const useVoiceActivation = (config: VoiceActivationInput) => {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcript, setTranscript] = useState('');
  const [lastMatchedCommand, setLastMatchedCommand] = useState<string | null>(null);
  const recognition = useRef<SpeechRecognition | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isEnabled } = config;

  // Use refs for callbacks to avoid re-creating recognition on every render
  const configRef = useRef(config);
  configRef.current = config;

  const hasPermissionRef = useRef(hasPermission);
  hasPermissionRef.current = hasPermission;

  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  const startListening = useCallback(async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();

      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onstart = () => {
        setIsListening(true);
        console.debug('Voice activation listening started');
      };

      recognition.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interimTranscript += t;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).toLowerCase().trim();
        setTranscript(fullTranscript);

        const cfg = configRef.current;

        if (isMultiConfig(cfg)) {
          // Multi-command mode: check each command's phrases
          for (const cmd of cfg.commands) {
            const matched = cmd.phrases.some((phrase) =>
              fullTranscript.includes(phrase.toLowerCase())
            );
            if (matched) {
              console.debug(`Voice command matched: ${cmd.label || 'unknown'}`, fullTranscript);
              setLastMatchedCommand(cmd.label || null);
              cmd.onMatch();
              setTranscript('');
              return;
            }
          }
        } else {
          // Legacy single-phrase mode
          if (fullTranscript.includes(cfg.triggerPhrase.toLowerCase())) {
            console.debug('Voice activation triggered', fullTranscript);
            cfg.onActivation();
            setTranscript('');
          }
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
        // Clear any pending restart timer before scheduling a new one
        if (restartTimerRef.current) {
          clearTimeout(restartTimerRef.current);
          restartTimerRef.current = null;
        }
        // Auto-restart if still enabled
        if (isEnabledRef.current && hasPermissionRef.current) {
          restartTimerRef.current = setTimeout(() => {
            restartTimerRef.current = null;
            startListening();
          }, 1000);
        }
      };

      recognition.current.start();
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      setHasPermission(false);
    }
  }, []); // Stable — uses refs for all dynamic values

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
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
    stopListening,
    lastMatchedCommand,
  };
};
