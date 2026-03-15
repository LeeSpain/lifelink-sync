import { useState, useRef, useEffect } from 'react';
import { ClaraOrb } from '@/components/clara-personal/ClaraOrb';
import { ChatInterface } from '@/components/clara-personal/ChatInterface';
import type { OrbState, ClaraMessage } from '@/components/clara-personal/types';
import { supabase } from '@/integrations/supabase/client';

const ClaraPersonalPage = () => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [messages, setMessages] = useState<ClaraMessage[]>([
    { id: '1', role: 'clara', content: "Good morning Lee. I'm ready. What do you need?", timestamp: new Date() }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(() => {
    return !localStorage.getItem('clara_pwa_dismissed');
  });
  const sessionId = useRef(`personal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

  // PWA full-screen setup
  useEffect(() => {
    // Inject manifest
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/clara-personal-manifest.json';
    document.head.appendChild(link);

    // Force full screen
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Theme color
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    const prevTheme = meta?.content;
    if (meta) {
      meta.content = '#0a0812';
    } else {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#0a0812';
      document.head.appendChild(meta);
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      if (prevTheme && meta) meta.content = prevTheme;
      link.remove();
    };
  }, []);

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

  const dismissBanner = () => {
    localStorage.setItem('clara_pwa_dismissed', '1');
    setShowInstallBanner(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      width: '100vw', height: '100dvh',
      background: '#0a0812',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <ClaraOrb state={orbState} />
      <ChatInterface
        messages={messages}
        onSend={sendMessage}
        isLoading={isLoading}
        onMicStart={() => setOrbState('listening')}
        onMicStop={() => setOrbState('thinking')}
      />

      {/* Install PWA banner — shown once */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: '#1a1230',
          borderTop: '1px solid #2a1e50',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 10000
        }}>
          <span style={{ color: '#b8a8e8', fontSize: 13 }}>
            Add to Home Screen for full screen
          </span>
          <button
            onClick={dismissBanner}
            style={{
              background: 'none', border: 'none', color: '#5a4f80',
              fontSize: 18, cursor: 'pointer', padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ClaraPersonalPage;
