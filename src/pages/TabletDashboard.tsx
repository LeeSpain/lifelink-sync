import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useEmergencySOS } from '@/hooks/useEmergencySOS';
import { useTabletVoice } from '@/hooks/useTabletVoice';
import { useTabletAlerts } from '@/hooks/useTabletAlerts';
import { Button } from '@/components/ui/button';
import { Phone, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { TabletVitalsStrip } from '@/components/tablet/TabletVitalsStrip';
import { TabletPhotoFrame } from '@/components/tablet/TabletPhotoFrame';
import { ReminderCard, type Reminder } from '@/components/tablet/ReminderCard';
import { QuickInfoCards } from '@/components/tablet/QuickInfoCards';
import { TabletClaraPanel } from '@/components/tablet/TabletClaraPanel';
import { TabletAlertSystem } from '@/components/tablet/TabletAlertSystem';
import { TabletVoiceIndicator } from '@/components/tablet/TabletVoiceIndicator';
import { TabletSetupWizard } from '@/components/tablet/TabletSetupWizard';
import type { FamilyMessage } from '@/components/tablet/FamilyMessagesCard';
import { useToast } from '@/hooks/use-toast';
import { KioskSetupGuide } from '@/components/tablet/KioskSetupGuide';

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'tablet.dashboard.greetingMorning';
  if (h < 18) return 'tablet.dashboard.greetingAfternoon';
  return 'tablet.dashboard.greetingEvening';
}

const TabletDashboard = () => {
  const { user } = useAuth();
  const { isActive: wakeLockActive } = useWakeLock(true);
  const { contacts } = useEmergencyContacts();
  const { triggerEmergencySOS, isTriggering } = useEmergencySOS();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isInstalled } = usePWAFeatures();

  const [greetingKey, setGreetingKey] = useState(getGreetingKey());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [familyOnline, setFamilyOnline] = useState(0);
  // Setup wizard state — shown on first load until owner completes it
  const [setupComplete, setSetupComplete] = useState(
    () => localStorage.getItem('tabletSetupComplete') === 'true'
  );
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'skipped' | null>(
    () => localStorage.getItem('tabletMicPermission') as any
  );

  // Clara panel state
  const [claraPanelExpanded, setClaraPanelExpanded] = useState(false);

  const handleSetupComplete = useCallback((mic: 'granted' | 'skipped', notif: 'granted' | 'skipped') => {
    setMicPermission(mic);
    localStorage.setItem('tabletMicPermission', mic);
    localStorage.setItem('tabletNotificationPermission', notif);
    setSetupComplete(true);
  }, []);

  // SOS trigger
  const handleSOS = useCallback(async () => {
    try {
      await triggerEmergencySOS();
      setSosTriggered(true);
      setTimeout(() => setSosTriggered(false), 10_000);
    } catch {
      // Error toast already shown by useEmergencySOS
    }
  }, [triggerEmergencySOS]);

  // Clara voice + chat
  const clara = useTabletVoice({ onSOSTrigger: handleSOS, micPermission });

  // Alert system
  const alertSystem = useTabletAlerts({
    userId: user?.id,
    onAlert: (alert) => {
      // Auto-expand Clara panel when alert fires
      setClaraPanelExpanded(true);

      // Add alert as Clara message
      const icon = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
      const alertMsg = `${icon} Alert: ${alert.message}`;
      clara.addClaraMessage(alertMsg, alert.level !== 'info');

      // Clara speaks critical/warning alerts
      if (alert.level === 'critical') {
        const speech = `ALERT: ${alert.who || 'Someone'} has triggered an emergency SOS. ${
          alert.location ? `Their location is ${alert.location}.` : ''
        } Tap the screen to respond.`;
        clara.speak(speech);
      } else if (alert.level === 'warning') {
        clara.speak(`Reminder: ${alert.message}`);
      }
    },
  });

  // Greeting on load (after setup wizard)
  useEffect(() => {
    if (setupComplete && !clara.hasGreeted && micPermission !== null) {
      const timer = setTimeout(() => clara.speakGreeting(), 1500);
      return () => clearTimeout(timer);
    }
  }, [setupComplete, clara.hasGreeted, micPermission]);

  const firstName = user?.user_metadata?.first_name || t('dashboard.memberFallback');

  // Mark this device as tablet PWA
  useEffect(() => {
    localStorage.setItem('pwa_intent', 'tablet');
  }, []);

  // Update greeting every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => setGreetingKey(getGreetingKey()), 5 * 60_000);
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

      if (error) return;

      if (data) {
        const rems: Reminder[] = [];
        const msgs: FamilyMessage[] = [];
        for (const row of data) {
          const d = (row.alert_data as any) || {};
          if (row.alert_type === 'family_reminder') {
            rems.push({
              id: row.id,
              message: d.message || t('tablet.reminder.fallback'),
              from_name: d.from_name || t('tablet.quickInfo.family'),
              scheduled_time: d.scheduled_time,
              created_at: row.created_at || '',
            });
          } else {
            msgs.push({
              id: row.id,
              message: d.message || '',
              from_name: d.from_name || t('tablet.quickInfo.family'),
              created_at: row.created_at || '',
            });
          }
        }
        setReminders(rems);
        setMessages(msgs);
      }
    };

    fetchAlerts();

    // Real-time subscription for family alerts (reminders + messages)
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
                message: d.message || t('tablet.reminder.fallback'),
                from_name: d.from_name || t('tablet.quickInfo.family'),
                scheduled_time: d.scheduled_time,
                created_at: row.created_at || '',
              },
              ...prev,
            ]);
            toast({ title: t('tablet.dashboard.newReminder'), description: d.message || t('tablet.dashboard.newReminderDefault') });
          } else if (row.alert_type === 'family_message') {
            setMessages((prev) => [
              {
                id: row.id,
                message: d.message || '',
                from_name: d.from_name || t('tablet.quickInfo.family'),
                created_at: row.created_at || '',
              },
              ...prev,
            ]);
            toast({ title: t('tablet.dashboard.messageFromFamily', { name: d.from_name || t('tablet.quickInfo.family') }), description: d.message });
          }
        }
      )
      .subscribe();

    // Track family online count
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

  const currentReminder = reminders[0] || null;

  return (
    <div className={`h-screen flex text-white overflow-hidden select-none transition-colors duration-1000 ${
      sosTriggered ? 'bg-red-950' : familyOnline > 0 ? 'bg-[#0a1210]' : reminders.length > 0 ? 'bg-[#12100a]' : 'bg-slate-950'
    }`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Setup Wizard — shown on first visit */}
      {!setupComplete && (
        <TabletSetupWizard onComplete={handleSetupComplete} />
      )}

      {/* Kiosk mode setup guide */}
      {isInstalled && <KioskSetupGuide />}

      {/* Alert System Overlay */}
      <TabletAlertSystem
        activeAlert={alertSystem.activeAlert}
        onAcknowledge={alertSystem.acknowledgeAlert}
      />

      {/* Voice Indicator — bottom-left corner */}
      <TabletVoiceIndicator
        isListening={clara.isListening}
        isSpeaking={clara.isSpeaking}
        hasPermission={clara.hasPermission}
      />

      {/* Main dashboard content — full width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Vitals Strip */}
        <TabletVitalsStrip />

        {/* Photo Frame idle mode */}
        <TabletPhotoFrame alertCount={reminders.length + messages.length} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 max-w-6xl mx-auto w-full">
          {/* Greeting */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-light text-white">
              {t(greetingKey)}, <span className="font-semibold">{firstName}</span>
            </h1>
          </div>

          {/* Reminder Card */}
          <div className="mb-6">
            <ReminderCard reminder={currentReminder} onDismiss={dismissReminder} />
            {reminders.length > 1 && (
              <p className="text-xs text-slate-500 text-center mt-2">
                {t('tablet.dashboard.moreReminders', { count: reminders.length - 1 })}
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
              {isTriggering ? t('tablet.dashboard.sosSending', 'SENDING...') : sosTriggered ? t('tablet.dashboard.sosAlertSent', 'ALERT SENT') : t('tablet.dashboard.sosEmergency', 'EMERGENCY')}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="min-h-[80px] text-xl font-bold rounded-2xl border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
              onClick={() => setShowContacts(true)}
            >
              <Phone className="h-7 w-7 mr-3" />
              {t('tablet.dashboard.callFamily', 'CALL FAMILY')}
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT: Clara Panel */}
      <TabletClaraPanel
        messages={clara.messages}
        isThinking={clara.isThinking}
        isSpeaking={clara.isSpeaking}
        isMuted={clara.isMuted}
        isListening={clara.isListening}
        voiceEnabled={clara.voiceEnabled}
        onSendMessage={clara.sendMessage}
        onToggleMute={clara.toggleMute}
        onToggleVoice={clara.setVoiceEnabled}
        expanded={claraPanelExpanded}
        onToggleExpand={() => setClaraPanelExpanded((prev) => !prev)}
      />

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
              <h2 className="text-xl font-semibold">{t('tablet.dashboard.messagesTitle', 'Messages from Family')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowMessages(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {messages.length === 0 ? (
              <p className="text-slate-400 text-center py-8">{t('tablet.dashboard.noMessages', 'No messages yet')}</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-slate-800 rounded-xl p-4">
                    <p className="text-white text-lg">{msg.message}</p>
                    <p className="text-sm text-slate-400 mt-2">
                      {t('tablet.dashboard.messageFrom', { name: msg.from_name })} &middot;{' '}
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
              <h2 className="text-xl font-semibold">{t('tablet.dashboard.contactsTitle', 'Call Family')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowContacts(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            {contacts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">{t('tablet.dashboard.noContacts', 'No emergency contacts set up')}</p>
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
