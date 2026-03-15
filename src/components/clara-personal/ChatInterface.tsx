import { useState, useRef, useEffect, useCallback } from 'react';
import type { ClaraMessage } from './types';
import { formatClaraMessage } from '@/lib/formatClaraMessage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechAny = any;

interface Props {
  messages: ClaraMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  onMicStart: () => void;
  onMicStop: () => void;
  onWakeWord: () => void;
}

export function ChatInterface({ messages, onSend, isLoading, onMicStart, onMicStop, onWakeWord }: Props) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechAny>(null);
  const wakeRef = useRef<SpeechAny>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Full speech recognition (after wake or mic tap) ──────────
  const startFullListening = useCallback(() => {
    if (isRecording) return;
    const w = window as SpeechAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    // Stop wake listener while full listening is active
    try { wakeRef.current?.stop(); } catch { /* ok */ }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';

    recognition.onresult = (event: SpeechAny) => {
      const transcript = event.results[0][0].transcript;
      // Strip wake word from beginning if present
      const cleaned = transcript.replace(/^(hey\s+)?clara[,.]?\s*/i, '').trim();
      if (cleaned) onSend(cleaned);
      setIsRecording(false);
      onMicStop();
    };
    recognition.onerror = () => { setIsRecording(false); onMicStop(); };
    recognition.onend = () => {
      setIsRecording(false);
      // Restart wake word detection after full listening ends
      startWakeDetection();
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    onMicStart();
  }, [isRecording, onSend, onMicStart, onMicStop]);

  // ── Wake word detection (continuous background) ──────────────
  const startWakeDetection = useCallback(() => {
    const w = window as SpeechAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const wake = new SR();
    wake.continuous = true;
    wake.interimResults = true;
    wake.lang = 'en-GB';

    wake.onresult = (event: SpeechAny) => {
      const transcript = Array.from(event.results)
        .map((r: SpeechAny) => r[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      if (transcript.includes('clara') || transcript.includes('hey clara')) {
        wake.stop();
        onWakeWord();
        // Start full listening after brief pause
        setTimeout(() => startFullListening(), 300);
      }
    };

    wake.onend = () => {
      // Restart unless app is hidden or full listening is active
      if (!document.hidden && !isRecording) {
        setTimeout(() => {
          try { wake.start(); } catch { /* ok */ }
        }, 500);
      }
    };

    wake.onerror = (event: SpeechAny) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(() => {
          try { wake.start(); } catch { /* ok */ }
        }, 1000);
      }
    };

    try { wake.start(); } catch { /* ok */ }
    wakeRef.current = wake;
  }, [onWakeWord, isRecording, startFullListening]);

  // Start wake word detection on mount
  useEffect(() => {
    startWakeDetection();

    const handleVisibility = () => {
      if (document.hidden) {
        try { wakeRef.current?.stop(); } catch { /* ok */ }
      } else if (!isRecording) {
        setTimeout(() => startWakeDetection(), 500);
      }
    };

    // Listen for programmatic start (from wake word handler)
    const handleStartListening = () => startFullListening();
    window.addEventListener('startListening', handleStartListening);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      try { wakeRef.current?.stop(); } catch { /* ok */ }
      try { recognitionRef.current?.stop(); } catch { /* ok */ }
      window.removeEventListener('startListening', handleStartListening);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startWakeDetection, startFullListening, isRecording]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  const toggleMic = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      onMicStop();
      return;
    }
    startFullListening();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0e0b1a', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            maxWidth: '78%', padding: '8px 12px',
            borderRadius: msg.role === 'clara' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
            background: msg.role === 'clara' ? '#1e1630' : '#4a2d9e',
            color: msg.role === 'clara' ? '#b8a8e8' : '#e8e0ff',
            alignSelf: msg.role === 'clara' ? 'flex-start' : 'flex-end',
            fontSize: 14, lineHeight: 1.5
          }}>
            <span dangerouslySetInnerHTML={{ __html: msg.role === 'clara' ? formatClaraMessage(msg.content) : msg.content }} />
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 12px', background: '#1e1630', borderRadius: '16px 16px 16px 4px', alignSelf: 'flex-start', width: 52 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6050a0', animation: `cpBounce 1.2s infinite ${i * 0.2}s` }} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <style>{`@keyframes cpBounce { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>
      <div style={{ padding: '10px 12px', background: '#0a0812', borderTop: '1px solid #1a1428', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message CLARA..."
          style={{ flex: 1, background: '#1a1230', border: '1px solid #2a1e50', borderRadius: 20, padding: '8px 14px', fontSize: 14, color: '#c8b8f0', outline: 'none' }}
        />
        <button onClick={toggleMic} style={{ width: 36, height: 36, borderRadius: '50%', background: isRecording ? '#8b0000' : '#3a2080', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="1" width="6" height="9" rx="3" fill={isRecording ? '#ff6060' : '#a090d0'}/><path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke={isRecording ? '#ff6060' : '#a090d0'} strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="8" y1="14" x2="8" y2="16" stroke={isRecording ? '#ff6060' : '#a090d0'} strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? '#5a35b8' : '#1a1230', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7 1l6 6-6 6" stroke="#a090d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
