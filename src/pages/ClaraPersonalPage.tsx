import { useState, useRef, useEffect } from 'react';
import { ClaraOrb } from '@/components/clara-personal/ClaraOrb';
import { ChatInterface } from '@/components/clara-personal/ChatInterface';
import type { OrbState, ClaraMessage } from '@/components/clara-personal/types';
import { supabase } from '@/integrations/supabase/client';

const ClaraPersonalPage = () => {
  // Override manifest so PWA installs with /clara-personal as start_url
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) {
      existing.setAttribute('href', '/clara-personal-manifest.json');
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/clara-personal-manifest.json';
      document.head.appendChild(link);
    }
    return () => {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.setAttribute('href', '/manifest.webmanifest');
      }
    };
  }, []);

  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [messages, setMessages] = useState<ClaraMessage[]>([
    { id: '1', role: 'clara', content: "Good morning Lee. I'm ready. What do you need?", timestamp: new Date() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionId = useRef(`personal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

  // Check auth on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setChecking(false);
      if (data.session) {
        localStorage.setItem('pwa_target', 'clara-personal');
      }
    });
  }, []);

  // Set PWA flags
  useEffect(() => {
    localStorage.setItem('pwa_target', 'clara-personal');
    sessionStorage.setItem('clara_personal_active', 'true');
  }, []);

  // Loading screen
  if (checking) return (
    <div style={{ width: '100vw', height: '100dvh', background: '#0a0812', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #9060ff, #3a1a8a)' }} />
    </div>
  );

  // Login screen
  if (!authed) return (
    <div style={{ width: '100vw', height: '100dvh', background: '#0a0812', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 32px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #9060ff, #3a1a8a)' }} />
      <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#6b5fa0', textTransform: 'uppercase' as const }}>CLARA PERSONAL</div>
      <input type="email" placeholder="Email" id="clara-email" autoComplete="email" inputMode="email"
        style={{ width: '100%', maxWidth: 300, background: '#1a1230', border: '1px solid #2a1e50', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#c8b8f0', outline: 'none' }}
      />
      <input type="password" placeholder="Password" id="clara-password" autoComplete="current-password"
        style={{ width: '100%', maxWidth: 300, background: '#1a1230', border: '1px solid #2a1e50', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: '#c8b8f0', outline: 'none' }}
      />
      <button
        onClick={async () => {
          const email = (document.getElementById('clara-email') as HTMLInputElement).value;
          const password = (document.getElementById('clara-password') as HTMLInputElement).value;
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error) {
            localStorage.setItem('pwa_target', 'clara-personal');
            setAuthed(true);
          } else {
            alert(error.message);
          }
        }}
        style={{ width: '100%', maxWidth: 300, background: '#5a35b8', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, color: '#e8e0ff', cursor: 'pointer', fontWeight: 600 }}
      >
        Enter
      </button>
    </div>
  );

  // Main CLARA interface
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
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
          systemOverride: `You are speaking DIRECTLY with Lee Wakeman, the founder and owner of LifeLink Sync. This is his PRIVATE personal app — not a customer interface. NEVER respond as a customer support agent. NEVER offer trials or explain features as if he doesn't know them. You ARE his personal AI business assistant. When he asks for a report: summarise leads, conversions, hot leads and CLARA activity from today. Be brief — maximum 3 sentences unless he asks for more. He built this platform. Talk to him like a trusted colleague.`,
        }
      });
      if (error) throw error;
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'clara', content: data.response || 'Something went wrong.', timestamp: new Date() }]);
      setOrbState('speaking');
      setTimeout(() => setOrbState('idle'), 3000);
    } catch (err) {
      console.error('CLARA error:', err);
      setOrbState('idle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100dvh', zIndex: 9999,
      background: '#0a0812', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)',
    }}>
      <ClaraOrb state={orbState} />
      <ChatInterface
        messages={messages}
        onSend={sendMessage}
        isLoading={isLoading}
        onMicStart={() => setOrbState('listening')}
        onMicStop={() => setOrbState('thinking')}
        onWakeWord={() => setOrbState('listening')}
      />
    </div>
  );
};

export default ClaraPersonalPage;
