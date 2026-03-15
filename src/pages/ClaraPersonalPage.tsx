import { useState, useRef, useEffect } from 'react';
import { ClaraOrb } from '@/components/clara-personal/ClaraOrb';
import { ChatInterface } from '@/components/clara-personal/ChatInterface';
import type { OrbState, ClaraMessage } from '@/components/clara-personal/types';
import { supabase } from '@/integrations/supabase/client';

const MODES: Record<string, { emoji: string; label: string }> = {
  business:  { emoji: '💼', label: 'Business' },
  pa:        { emoji: '🤝', label: 'PA' },
  planning:  { emoji: '🧠', label: 'Planning' },
  dev:       { emoji: '🔧', label: 'Dev' },
  sales:     { emoji: '💰', label: 'Sales' },
  marketing: { emoji: '📣', label: 'Marketing' },
  ops:       { emoji: '⚙️', label: 'Ops' },
};

const MODE_COMMANDS: Record<string, string> = {
  '/pa': 'pa', '/planning': 'planning', '/dev': 'dev',
  '/business': 'business', '/sales': 'sales',
  '/marketing': 'marketing', '/ops': 'ops',
};

const MODE_PROMPTS: Record<string, string> = {
  business: 'You are Lee\'s business assistant. Give concise business updates and insights.',
  pa: 'Act as Lee\'s personal assistant. Execute tasks, send messages, manage his to-do list on his behalf.',
  planning: 'Think strategically with Lee. No actions — only ideas, questions, and plans. Remind him to say "save [plan name]".',
  dev: 'Handle code changes and technical tasks for LifeLink Sync.',
  sales: 'Focus on the sales pipeline — leads, conversions, follow-ups, hot prospects.',
  marketing: 'Focus on campaigns, content, social media strategy.',
  ops: 'Focus on platform operations — members, support, system health, billing.',
};

const ClaraPersonalPage = () => {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [currentMode, setCurrentMode] = useState('business');
  const [wakeListening, setWakeListening] = useState(false);
  const [messages, setMessages] = useState<ClaraMessage[]>([
    { id: '1', role: 'clara', content: "Good morning Lee. I'm ready. What do you need?", timestamp: new Date() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('clara_voice') !== 'off');
  const sessionId = useRef(`personal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

  // Load speech synthesis voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis || !voiceEnabled) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/#{1,6}\s/g, '').replace(/[🛡️🤝🧠💼🔧💰📣⚙️📝✅❌⚠️🔥📊📋🔍💾]/gu, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Moira') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female')));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.onstart = () => setOrbState('speaking');
    utterance.onend = () => setOrbState('idle');
    utterance.onerror = () => setOrbState('idle');
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setChecking(false);
      if (data.session) localStorage.setItem('pwa_target', 'clara-personal');
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('pwa_target', 'clara-personal');
    sessionStorage.setItem('clara_personal_active', 'true');
  }, []);

  if (checking) return (
    <div style={{ width: '100vw', height: '100dvh', background: '#0a0812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #9060ff, #3a1a8a)' }} />
    </div>
  );

  if (!authed) return (
    <div style={{ width: '100vw', height: '100dvh', background: '#0a0812', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 32px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #9060ff, #3a1a8a)' }} />
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#6b5fa0', textTransform: 'uppercase' as const }}>CLARA PERSONAL</div>
      <input type="email" placeholder="Email" id="clara-email" autoComplete="email" inputMode="email"
        style={{ width: '100%', maxWidth: 300, background: '#1a1230', border: '1px solid #2a1e50', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#c8b8f0', outline: 'none' }} />
      <input type="password" placeholder="Password" id="clara-password" autoComplete="current-password"
        style={{ width: '100%', maxWidth: 300, background: '#1a1230', border: '1px solid #2a1e50', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#c8b8f0', outline: 'none' }} />
      <button onClick={async () => {
        const email = (document.getElementById('clara-email') as HTMLInputElement).value;
        const password = (document.getElementById('clara-password') as HTMLInputElement).value;
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) { localStorage.setItem('pwa_target', 'clara-personal'); setAuthed(true); }
        else { alert(error.message); }
      }} style={{ width: '100%', maxWidth: 300, background: '#5a35b8', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, color: '#e8e0ff', cursor: 'pointer', fontWeight: 600 }}>
        Enter
      </button>
    </div>
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check for mode switch commands
    const newMode = MODE_COMMANDS[text.trim().toLowerCase()];
    if (newMode) {
      setCurrentMode(newMode);
      const m = MODES[newMode];
      setMessages(prev => [...prev,
        { id: Date.now().toString(), role: 'lee', content: text, timestamp: new Date() },
        { id: (Date.now() + 1).toString(), role: 'clara', content: `${m?.emoji || '⚙️'} Switched to ${(m?.label || newMode).toUpperCase()} mode.`, timestamp: new Date() }
      ]);
      return;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'lee', content: text, timestamp: new Date() }]);
    setOrbState('thinking');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: text,
          sessionId: sessionId.current,
          userId: null,
          language: 'en',
          currency: 'EUR',
          isOwnerPersonal: true,
          currentMode,
          conversation_history: messages.slice(-10).map(m => ({
            role: m.role === 'lee' ? 'user' : 'assistant',
            content: m.content,
          })),
          systemOverride: `You are CLARA, Lee Wakeman's AI. Current mode: ${currentMode.toUpperCase()}. ${MODE_PROMPTS[currentMode] || ''} Be brief — max 3 sentences. Lee is on mobile. He built this platform. Talk to him like a trusted colleague.`,
        }
      });
      if (error) throw error;
      const responseText = data.response || 'Something went wrong.';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'clara', content: responseText, timestamp: new Date() }]);
      speakResponse(responseText);
      if (!voiceEnabled) {
        setOrbState('speaking');
        setTimeout(() => setOrbState('idle'), 3000);
      }
    } catch (err) {
      console.error('CLARA error:', err);
      setOrbState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const modeInfo = MODES[currentMode] || MODES.business;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100dvh', zIndex: 9999,
      background: '#0a0812', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)',
    }}>
      <div style={{ position: 'relative' }}>
        <ClaraOrb state={orbState} modeBadge={`${modeInfo.emoji} ${modeInfo.label}`} wakeActive={wakeListening} />
        <button
          onClick={() => {
            const newVal = !voiceEnabled;
            setVoiceEnabled(newVal);
            localStorage.setItem('clara_voice', newVal ? 'on' : 'off');
            if (!newVal) window.speechSynthesis?.cancel();
          }}
          style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, opacity: voiceEnabled ? 1 : 0.3 }}
        >
          🔊
        </button>
      </div>
      <ChatInterface
        messages={messages}
        onSend={sendMessage}
        isLoading={isLoading}
        onMicStart={() => setOrbState('listening')}
        onMicStop={() => setOrbState('thinking')}
        onWakeWord={() => setOrbState('listening')}
        onWakeStateChange={setWakeListening}
      />
    </div>
  );
};

export default ClaraPersonalPage;
