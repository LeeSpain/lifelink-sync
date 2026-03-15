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
  onWakeStateChange?: (active: boolean) => void;
}

export function ChatInterface({ messages, onSend, isLoading, onMicStart, onMicStop, onWakeWord, onWakeStateChange }: Props) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const micPermRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechAny>(null);
  const wakeRef = useRef<SpeechAny>(null);
  const holdRecRef = useRef<SpeechAny>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onWakeStateChange?.(wakeActive);
  }, [wakeActive, onWakeStateChange]);

  // ── Wake word detection ──────────────────────────────────────
  const startWakeDetection = useCallback(() => {
    if (!micPermRef.current) { console.log('Wake: no mic permission'); return; }
    const w = window as SpeechAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { console.log('Wake: no SpeechRecognition API'); return; }

    const wake = new SR();
    wake.continuous = true;
    wake.interimResults = true;
    wake.lang = 'en-GB';

    wake.onstart = () => { console.log('Wake: active'); setWakeActive(true); };

    wake.onresult = (event: SpeechAny) => {
      const transcript = Array.from(event.results)
        .map((r: SpeechAny) => r[0].transcript)
        .join('').toLowerCase().trim();
      console.log('Wake heard:', transcript);

      if (transcript.includes('clara') || transcript.includes('clear a') || transcript.includes('klara')) {
        console.log('Wake: triggered!');
        wake.stop();
        onWakeWord();
        setTimeout(() => startFullListening(), 500);
      }
    };

    wake.onend = () => {
      setWakeActive(false);
      // iOS: 1000ms delay before restart
      if (!document.hidden && !isRecording && micPermRef.current) {
        setTimeout(() => {
          try { wake.start(); } catch (e) { console.log('Wake restart failed:', e); }
        }, 1000);
      }
    };

    wake.onerror = (event: SpeechAny) => {
      console.log('Wake error:', event.error);
      setWakeActive(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(() => {
          try { wake.start(); } catch { /* ok */ }
        }, 1500);
      }
    };

    try { wake.start(); } catch (e) { console.log('Wake start failed:', e); }
    wakeRef.current = wake;
  }, [isRecording, onWakeWord]);

  // ── Full speech recognition ──────────────────────────────────
  const startFullListening = useCallback(() => {
    if (isRecording) return;
    const w = window as SpeechAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    try { wakeRef.current?.stop(); } catch { /* ok */ }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';

    recognition.onresult = (event: SpeechAny) => {
      const transcript = event.results[0][0].transcript;
      const cleaned = transcript.replace(/^(hey\s+)?clara[,.]?\s*/i, '').trim();
      if (cleaned) onSend(cleaned);
      setIsRecording(false);
      onMicStop();
    };
    recognition.onerror = () => { setIsRecording(false); onMicStop(); };
    recognition.onend = () => {
      setIsRecording(false);
      // iOS: 1000ms delay before restarting wake
      setTimeout(() => {
        if (micPermRef.current) startWakeDetection();
      }, 1000);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    onMicStart();

    if (!micPermRef.current) {
      micPermRef.current = true;
      setMicPermissionGranted(true);
    }
  }, [isRecording, onSend, onMicStart, onMicStop, startWakeDetection]);

  // Start wake after permission granted
  useEffect(() => {
    if (micPermissionGranted) {
      setTimeout(() => startWakeDetection(), 1000);
    }
    return () => {
      try { wakeRef.current?.stop(); } catch { /* ok */ }
      try { recognitionRef.current?.stop(); } catch { /* ok */ }
    };
  }, [micPermissionGranted, startWakeDetection]);

  // Visibility handler
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        try { wakeRef.current?.stop(); } catch { /* ok */ }
      } else if (!isRecording && micPermRef.current) {
        setTimeout(() => startWakeDetection(), 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRecording, startWakeDetection]);

  // ── Hold to talk (iOS backup) ────────────────────────────────
  const startHold = () => {
    const w = window as SpeechAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    try { wakeRef.current?.stop(); } catch { /* ok */ }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-GB';

    rec.onresult = (event: SpeechAny) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) onSend(transcript.trim());
    };
    rec.onend = () => {
      setIsHolding(false);
      onMicStop();
      setTimeout(() => { if (micPermRef.current) startWakeDetection(); }, 1000);
    };
    rec.onerror = () => { setIsHolding(false); onMicStop(); };

    holdRecRef.current = rec;
    rec.start();
    setIsHolding(true);
    onMicStart();
    if (!micPermRef.current) { micPermRef.current = true; setMicPermissionGranted(true); }
  };

  const stopHold = () => {
    try { holdRecRef.current?.stop(); } catch { /* ok */ }
    setIsHolding(false);
  };

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
        {/* Hold to talk button */}
        <button
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          onMouseDown={startHold}
          onMouseUp={stopHold}
          style={{ width: 36, height: 36, borderRadius: '50%', background: isHolding ? '#8b0000' : '#2a1860', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}
        >
          {isHolding ? '🔴' : '👂'}
        </button>
        {/* Tap mic button */}
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
