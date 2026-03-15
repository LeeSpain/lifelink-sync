import { useState, useRef, useEffect } from 'react';
import type { ClaraMessage } from './types';
import { formatClaraMessage } from '@/lib/formatClaraMessage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionAny = any;

interface Props {
  messages: ClaraMessage[];
  onSend: (text: string) => void;
  isLoading: boolean;
  onMicStart: () => void;
  onMicStop: () => void;
}

export function ChatInterface({ messages, onSend, isLoading, onMicStart, onMicStop }: Props) {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionAny>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    const w = window as SpeechRecognitionAny;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) { alert('Voice not supported'); return; }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';
    recognition.onresult = (event: SpeechRecognitionAny) => {
      onSend(event.results[0][0].transcript);
      setIsRecording(false);
      onMicStop();
    };
    recognition.onerror = () => { setIsRecording(false); onMicStop(); };
    recognition.onend = () => { setIsRecording(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    onMicStart();
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="1" width="6" height="9" rx="3" fill="#a090d0"/><path d="M2 8c0 3.3 2.7 6 6 6s6-2.7 6-6" stroke="#a090d0" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="8" y1="14" x2="8" y2="16" stroke="#a090d0" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() ? '#5a35b8' : '#1a1230', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12M7 1l6 6-6 6" stroke="#a090d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}
