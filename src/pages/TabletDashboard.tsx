import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useTabletClara } from '@/hooks/useTabletClara';
import { Button } from '@/components/ui/button';
import { Phone, AlertTriangle, X, Download, Tablet } from 'lucide-react';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { TabletStatusBar } from '@/components/tablet/TabletStatusBar';
import { ReminderCard, type Reminder } from '@/components/tablet/ReminderCard';
import { QuickInfoCards } from '@/components/tablet/QuickInfoCards';
import type { FamilyMessage } from '@/components/tablet/FamilyMessagesCard';
import { useToast } from '@/hooks/use-toast';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const TabletDashboard = () => {
  const { user } = useAuth();
  const { isActive: wakeLockActive } = useWakeLock(true);
  const { contacts } = useEmergencyContacts();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const { toast } = useToast();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();

  const [greeting, setGreeting] = useState(getGreeting());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [familyOnline, setFamilyOnline] = useState(0);
  const [installDismissed, setInstallDismissed] = useState(
    () => localStorage.getItem('tablet-install-dismissed') === '1'
  );

  const showInstallOverlay = !isInstalled && !installDismissed;

  const dismissInstallOverlay = () => {
    localStorage.setItem('tablet-install-dismissed', '1');
    setInstallDismissed(true);
  };

  const firstName = user?.user_metadata?.first_name || 'there';

  // Swap manifest to tablet-specific version so PWA installs with
  // start_url="/tablet-dashboard", display="fullscreen", orientation="any"
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    const originalHref = existing?.getAttribute('href') || '/manifest.webmanifest';

    if (existing) {
      existing.setAttribute('href', '/tablet-manifest.json');
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/tablet-manifest.json';
      document.head.appendChild(link);
    }

    return () => {
      // Restore original manifest when navigating away
      const el = document.querySelector('link[rel="manifest"]');
      if (el) el.setAttribute('href', originalHref);
    };
  }, []);

  // Update greeting every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => setGreeting(getGreeting()), 5 * 60_000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial alerts & subscribe to real-time
  useEffect(() => {
    if (!user?.id) return;

    const fetchAlerts = async () => {
      const { data, error } = await supabase
        .from('family_alerts')
        .select('*')
        .eq('family_user_id', user.id)
        .in('alert_type', ['family_reminder', 'family_message'])
        .eq('status', 'sent')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Failed to fetch alerts:', error);
        return;
      }

      if (data) {
        const rems: Reminder[] = [];
        const msgs: FamilyMessage[] = [];
        for (const row of data) {
          const d = (row.alert_data as any) || {};
          if (row.alert_type === 'family_reminder') {
            rems.push({
              id: row.id,
              message: d.message || 'Reminder',
              from_name: d.from_name || 'Family',
              scheduled_time: d.scheduled_time,
              created_at: row.created_at || '',
            });
          } else {
            msgs.push({
              id: row.id,
              message: d.message || '',
              from_name: d.from_name || 'Family',
              created_at: row.created_at || '',
            });
          }
        }
        setReminders(rems);
        setMessages(msgs);
      }
    };

    fetchAlerts();

    // Real-time subscription
    const channel = supabase
      .channel('tablet-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_alerts',
          filter: `family_user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          const d = row.alert_data || {};
          if (row.alert_type === 'family_reminder') {
            setReminders((prev) => [
              {
                id: row.id,
                message: d.message || 'Reminder',
                from_name: d.from_name || 'Family',
                scheduled_time: d.scheduled_time,
                created_at: row.created_at || '',
              },
              ...prev,
            ]);
            toast({ title: 'New Reminder', description: d.message || 'You have a new reminder' });
            speakAlertRef.current('reminder', d.from_name || 'Family', d.message || 'You have a new reminder');
          } else if (row.alert_type === 'family_message') {
            setMessages((prev) => [
              {
                id: row.id,
                message: d.message || '',
                from_name: d.from_name || 'Family',
                created_at: row.created_at || '',
              },
              ...prev,
            ]);
            toast({ title: `Message from ${d.from_name || 'Family'}`, description: d.message });
            speakAlertRef.current('message', d.from_name || 'Family', d.message || '');
          }
        }
      )
      .subscribe();

    // Track family online count from live_presence
    const fetchOnline = async () => {
      const { count } = await supabase
        .from('live_presence')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);
      setFamilyOnline(count ?? 0);
    };
    fetchOnline();
    const presenceInterval = setInterval(fetchOnline, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(presenceInterval);
    };
  }, [user?.id, toast]);

  // Dismiss a reminder
  const dismissReminder = useCallback(
    async (id: string) => {
      await supabase.from('family_alerts').update({ status: 'read' }).eq('id', id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  // SOS trigger — calls the real emergency edge function
  const handleSOS = useCallback(async () => {
    try {
      await triggerEmergencySOS();
      setSosTriggered(true);
      setTimeout(() => setSosTriggered(false), 10_000);
    } catch {
      // Error toast already shown by useEmergencySOS
    }
  }, [triggerEmergencySOS]);

  // Clara AI — TTS for incoming alerts + voice activation
  const clara = useTabletClara({ onSOSTrigger: handleSOS });

  // Ref so the real-time subscription can call speakAlert without re-subscribing
  const speakAlertRef = useRef(clara.speakAlert);
  speakAlertRef.current = clara.speakAlert;

  const currentReminder = reminders[0] || null;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Install Overlay — shown first time on a browser (not yet installed) */}
      {showInstallOverlay && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-8">
          <div className="text-center max-w-lg">
            <Tablet className="h-16 w-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-semibold mb-3">Install LifeLink Sync</h2>
            <p className="text-lg text-slate-300 mb-8">
              Install this app on your tablet for the best always-on experience. It will launch full-screen and keep your screen awake.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isInstallable ? (
                <Button
                  size="lg"
                  className="min-h-[56px] px-10 text-lg"
                  onClick={async () => {
                    await installApp();
                    dismissInstallOverlay();
                  }}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Install Now
                </Button>
              ) : (
                <div className="bg-slate-800 rounded-xl p-4 text-left text-sm text-slate-300 max-w-sm mx-auto">
                  <p className="font-medium text-white mb-2">To install:</p>
                  <p>Open your browser menu and tap "Add to Home Screen" or "Install App"</p>
                </div>
              )}
              <Button
                size="lg"
                variant="outline"
                className="min-h-[56px] px-10 text-lg border-slate-600 text-slate-300"
                onClick={dismissInstallOverlay}
              >
                Continue in Browser
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <TabletStatusBar
        wakeLockActive={wakeLockActive}
        claraState={{
          isListening: clara.isListening,
          isSpeaking: clara.isSpeaking,
          isMuted: clara.isMuted,
          hasPermission: clara.hasPermission,
          transcript: clara.transcript,
          onToggleMute: clara.toggleMute,
          onToggleListening: () => clara.setVoiceEnabled(!clara.voiceEnabled),
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Greeting */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-light text-white">
            {greeting}, <span className="font-semibold">{firstName}</span>
          </h1>
        </div>

        {/* Reminder Card */}
        <div className="mb-6">
          <ReminderCard reminder={currentReminder} onDismiss={dismissReminder} />
          {reminders.length > 1 && (
            <p className="text-xs text-slate-500 text-center mt-2">
              +{reminders.length - 1} more reminder{reminders.length > 2 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Quick Info Cards */}
        <div className="mb-6">
          <QuickInfoCards
            familyOnline={familyOnline}
            messages={messages}
            onViewMessages={() => setShowMessages(true)}
          />
        </div>

        {/* Bottom Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            size="lg"
            variant={sosTriggered ? 'outline' : 'destructive'}
            className={`min-h-[80px] text-xl font-bold rounded-2xl ${
              sosTriggered
                ? 'border-red-500 text-red-400 animate-pulse'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={handleSOS}
            disabled={sosTriggered || isTriggering}
          >
            <AlertTriangle className="h-7 w-7 mr-3" />
            {isTriggering ? 'SENDING...' : sosTriggered ? 'ALERT SENT' : 'EMERGENCY'}
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="min-h-[80px] text-xl font-bold rounded-2xl border-slate-600 text-slate-200 hover:bg-slate-800"
            onClick={() => setShowContacts(true)}
          >
            <Phone className="h-7 w-7 mr-3" />
            CALL FAMILY
          </Button>
        </div>
      </div>

      {/* Messages Overlay */}
      {showMessages && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setShowMessages(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[70vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Messages from Family</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMessages(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-white text-lg">{msg.message}</p>
                    <p className="text-sm text-slate-400 mt-2">
                      From {msg.from_name} &middot;{' '}
                      {new Date(msg.created_at).toLocaleString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts Overlay */}
      {showContacts && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setShowContacts(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Call Family</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowContacts(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No emergency contacts set up</p>
            ) : (
              <div className="space-y-3">
                {contacts.map((c) => (
                  <a
                    key={c.id}
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-4 bg-slate-800 hover:bg-slate-700 rounded-xl p-4 transition-colors"
                  >
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-lg font-medium">{c.name}</p>
                      <p className="text-sm text-slate-400">{c.relationship} &middot; {c.phone}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TabletDashboard;
