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
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const sessionId = useRef(`personal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

  // PWA full-screen setup + Apple meta tags
  // Mark that CLARA Personal is the intended destination (persists across sessions)
  useEffect(() => {
    localStorage.setItem('pwa_target', 'clara-personal');
    localStorage.setItem('clara_pwa_installed', 'true');
    sessionStorage.setItem('clara_personal_active', 'true');
  }, []);

  useEffect(() => {
    // Apple PWA meta tags — full screen, no bars
    const tags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'CLARA' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'theme-color', content: '#0a0812' },
    ];

    const addedElements: HTMLElement[] = [];

    tags.forEach(({ name, content }) => {
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) existing.remove();
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
      addedElements.push(meta);
    });

    // Apple touch icon
    const iconLink = document.createElement('link');
    iconLink.rel = 'apple-touch-icon';
    iconLink.href = '/icons/apple-touch-icon.svg';
    document.head.appendChild(iconLink);
    addedElements.push(iconLink);

    // Manifest
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/clara-personal-manifest.json';
    document.head.appendChild(manifestLink);
    addedElements.push(manifestLink);

    // Force full screen body
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // iOS install banner detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem('clara_pwa_dismissed') === '1';

    if (isIOS && !isStandalone && !dismissed) {
      setShowInstallBanner(true);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.width = '';
      document.body.style.height = '';
      addedElements.forEach(el => el.remove());
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
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw',
      height: '100dvh',
      zIndex: 9999,
      background: '#0a0812',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
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

      {/* iOS install banner */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          left: 0, right: 0,
          padding: '14px 16px',
          background: '#1a1230',
          borderTop: '1px solid #2a1e50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          zIndex: 10000,
        }}>
          <span style={{ color: '#b8a8e8', fontSize: 12, lineHeight: 1.4 }}>
            Tap the Share button <span style={{ fontSize: 16 }}>□↑</span> then "Add to Home Screen" for full screen
          </span>
          <button
            onClick={dismissBanner}
            style={{
              background: 'none', border: 'none', color: '#5a4f80',
              fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0
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
