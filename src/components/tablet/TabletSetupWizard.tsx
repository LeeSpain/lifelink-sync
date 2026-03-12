import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { useBluetoothPendant } from '@/hooks/useBluetoothPendant';
import { initAudio } from '@/utils/tabletSounds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  User,
  Bluetooth,
  Mic,
  Bell,
  Download,
  Tablet,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  HeartPulse,
  Battery,
  Speaker,
  Wifi,
} from 'lucide-react';

interface TabletSetupWizardProps {
  onComplete: (micResult: 'granted' | 'skipped', notifResult: 'granted' | 'skipped') => void;
}

// ─── Device Step (isolated component so BLE hook only runs on step 2) ─────────

interface DeviceStepProps {
  onBack: () => void;
  onContinue: (connected: boolean, deviceName: string, speakers: { alexa: boolean; google: boolean }) => void;
  userId?: string;
  t: (key: string, fallback?: string, opts?: object) => string;
}

function DeviceStep({ onBack, onContinue, userId, t }: DeviceStepProps) {
  const ble = useBluetoothPendant();
  const [alexaLinked, setAlexaLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [showAlexaInfo, setShowAlexaInfo] = useState(false);
  const [showGoogleInfo, setShowGoogleInfo] = useState(false);

  // Check existing speaker links
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('device_smart_speaker_links')
      .select('platform, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .then(({ data }) => {
        if (data) {
          setAlexaLinked(data.some((r) => r.platform === 'alexa'));
          setGoogleLinked(data.some((r) => r.platform === 'google_home'));
        }
      });
  }, [userId]);

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6">
          <Bluetooth className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          {t('tablet.setup.devicesTitle', 'Connect Your Devices')}
        </h2>
        <p className="text-slate-400 text-base leading-relaxed">
          {t('tablet.setup.devicesDesc', 'Pair your ICE SOS Pendant and link smart speakers for voice alerts.')}
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* BLE Pendant */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Bluetooth className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">{t('tablet.setup.pendantTitle', 'ICE SOS Pendant')}</p>
              <p className="text-slate-400 text-sm">
                {ble.connected
                  ? t('tablet.setup.pendantConnected', 'Connected — {{name}}', { name: ble.deviceName })
                  : t('tablet.setup.pendantDesc', 'Pair via Bluetooth for heart rate & emergency button')}
              </p>
            </div>
            {ble.connected && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
          </div>

          {ble.connected ? (
            <div className="flex items-center gap-6 py-2 px-3 bg-slate-900/60 rounded-lg">
              {ble.heartRate && (
                <div className="flex items-center gap-2 text-sm text-rose-400">
                  <HeartPulse className="h-4 w-4" />
                  <span className="font-medium">{ble.heartRate} bpm</span>
                </div>
              )}
              {ble.batteryPct != null && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <Battery className="h-4 w-4" />
                  <span className="font-medium">{ble.batteryPct}%</span>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              onClick={ble.connect}
              disabled={ble.connecting || !ble.supported}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-1"
            >
              {ble.connecting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Bluetooth className="h-4 w-4 mr-2" />
              )}
              {ble.connecting
                ? t('tablet.setup.connecting', 'Connecting...')
                : !ble.supported
                  ? t('tablet.setup.bluetoothUnsupported', 'Bluetooth not available on this browser')
                  : t('tablet.setup.connectPendant', 'Connect Pendant')}
            </Button>
          )}
        </div>

        {/* Smart Speakers */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Speaker className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">{t('tablet.setup.speakersTitle', 'Smart Speakers')}</p>
              <p className="text-slate-400 text-sm">
                {t('tablet.setup.speakersDesc', 'Link Alexa or Google Home for voice alerts (optional)')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Amazon Alexa */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-sm">A</span>
                  </div>
                  <span className="text-white font-medium text-sm">{t('tablet.setup.alexaTitle', 'Amazon Alexa')}</span>
                </div>
                {alexaLinked && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t('tablet.setup.speakerLinked', 'Linked')}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mb-3">
                {t('tablet.setup.alexaDesc', 'Say "Alexa, help help help" for emergency SOS')}
              </p>
              {alexaLinked ? (
                <div className="h-8 flex items-center text-xs text-emerald-400/70">
                  {t('tablet.setup.speakerActive', 'Connected and ready for voice commands')}
                </div>
              ) : showAlexaInfo ? (
                <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 space-y-2">
                  <p>{t('tablet.setup.alexaStep1', '1. Open the Alexa app on your phone')}</p>
                  <p>{t('tablet.setup.alexaStep2', '2. Go to Skills & Games → search "LifeLink"')}</p>
                  <p>{t('tablet.setup.alexaStep3', '3. Enable the skill and link your account')}</p>
                  <button onClick={() => setShowAlexaInfo(false)} className="text-cyan-400 mt-1">
                    {t('tablet.setup.hideInstructions', 'Hide')}
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAlexaInfo(true)}
                  className="w-full h-8 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  {t('tablet.setup.linkAccount', 'How to Link')}
                </Button>
              )}
            </div>

            {/* Google Home */}
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-sm">G</span>
                  </div>
                  <span className="text-white font-medium text-sm">{t('tablet.setup.googleTitle', 'Google Home')}</span>
                </div>
                {googleLinked && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t('tablet.setup.speakerLinked', 'Linked')}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-xs mb-3">
                {t('tablet.setup.googleDesc', 'Say "Hey Google, emergency" for SOS alerts')}
              </p>
              {googleLinked ? (
                <div className="h-8 flex items-center text-xs text-emerald-400/70">
                  {t('tablet.setup.speakerActive', 'Connected and ready for voice commands')}
                </div>
              ) : showGoogleInfo ? (
                <div className="bg-slate-800/80 rounded-lg p-3 text-xs text-slate-300 space-y-2">
                  <p>{t('tablet.setup.googleStep1', '1. Open the Google Home app on your phone')}</p>
                  <p>{t('tablet.setup.googleStep2', '2. Go to Settings → Works with Google')}</p>
                  <p>{t('tablet.setup.googleStep3', '3. Search "LifeLink" and link your account')}</p>
                  <button onClick={() => setShowGoogleInfo(false)} className="text-amber-400 mt-1">
                    {t('tablet.setup.hideInstructions', 'Hide')}
                  </button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowGoogleInfo(true)}
                  className="w-full h-8 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                >
                  {t('tablet.setup.linkAccount', 'How to Link')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          className="min-h-[56px] px-6 border-slate-600 text-slate-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          onClick={() => onContinue(ble.connected, ble.deviceName, { alexa: alexaLinked, google: googleLinked })}
          className="flex-1 min-h-[56px] text-lg font-bold bg-primary hover:bg-primary/90"
        >
          {ble.connected
            ? t('tablet.setup.continue', 'Continue')
            : t('tablet.setup.skipDevices', 'Skip for Now')}
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

export function TabletSetupWizard({ onComplete }: TabletSetupWizardProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isInstalled, isInstallable, installApp } = usePWAFeatures();
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const [saving, setSaving] = useState(false);

  // Step 1: Resident info
  const existingFirst = user?.user_metadata?.first_name || '';
  const existingLast = user?.user_metadata?.last_name || '';
  const [residentName, setResidentName] = useState(
    existingFirst ? `${existingFirst} ${existingLast}`.trim() : ''
  );

  // Skip Step 1 if name already known from account
  const [step, setStep] = useState(existingFirst ? 2 : 1);

  // Auth loads async — advance past name step once user is available
  useEffect(() => {
    const first = user?.user_metadata?.first_name || '';
    if (first && step === 1) {
      setResidentName(`${first} ${user?.user_metadata?.last_name || ''}`.trim());
      setStep(2);
    }
  }, [user]);

  // Step 2: device connection result (captured when leaving DeviceStep)
  const [pendantConnected, setPendantConnected] = useState(false);
  const [pendantName, setPendantName] = useState('');

  // Step 3: Permissions results
  const [micResult, setMicResult] = useState<'granted' | 'skipped' | null>(null);
  const [notifResult, setNotifResult] = useState<'granted' | 'skipped' | null>(null);

  // Step 4: Install
  const [installDone, setInstallDone] = useState(isInstalled);
  const [waitingForPrompt, setWaitingForPrompt] = useState(false);

  // --- Handlers ---

  const handleSaveName = async () => {
    if (!residentName.trim() || !user) return;
    setSaving(true);
    const parts = residentName.trim().split(/\s+/);
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    await supabase.auth.updateUser({ data: { first_name: first, last_name: last } });
    // Also save to profiles table so the dashboard can read it immediately
    await supabase.from('profiles').upsert(
      { user_id: user.id, first_name: first, last_name: last },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    setStep(2);
  };

  // Speaker link status (captured when leaving DeviceStep)
  const [speakerStatus, setSpeakerStatus] = useState({ alexa: false, google: false });

  const handleDeviceContinue = (connected: boolean, deviceName: string, speakers: { alexa: boolean; google: boolean }) => {
    setPendantConnected(connected);
    setPendantName(deviceName);
    setSpeakerStatus(speakers);
    setStep(3);
  };

  const handlePermissions = async () => {
    initAudio();
    let mic: 'granted' | 'skipped' = 'skipped';
    let notif: 'granted' | 'skipped' = 'skipped';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      mic = 'granted';
    } catch {
      mic = 'skipped';
    }

    if ('Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        notif = result === 'granted' ? 'granted' : 'skipped';
      } catch {
        notif = 'skipped';
      }
    }

    setMicResult(mic);
    setNotifResult(notif);
    setStep(4);
  };

  const handleSkipPermissions = () => {
    initAudio();
    setMicResult('skipped');
    setNotifResult('skipped');
    setStep(4);
  };

  const handleInstall = async () => {
    setWaitingForPrompt(true);
    await installApp();
    setInstallDone(true);
    setWaitingForPrompt(false);
    setStep(5);
  };

  const handleFinish = () => {
    localStorage.setItem('tabletSetupComplete', 'true');
    onComplete(micResult || 'skipped', notifResult || 'skipped');
  };

  const stepIcons = [User, Bluetooth, ShieldCheck, Tablet, CheckCircle];

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const StepIcon = stepIcons[i];
            const isActive = i + 1 === step;
            const isDone = i + 1 < step;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isActive
                        ? 'bg-primary text-white ring-2 ring-primary/40'
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <div
                  className={`h-1 w-full rounded-full ${
                    isDone ? 'bg-emerald-500' : isActive ? 'bg-primary' : 'bg-slate-800'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              {t('tablet.setup.welcomeTitle', 'Welcome to LifeLink')}
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              {t('tablet.setup.welcomeDesc', "Let's set up this tablet. Who will be using it?")}
            </p>
            <div className="space-y-4 mb-8">
              <Input
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder={t('tablet.setup.namePlaceholder', 'Full name (e.g. Maria Garcia)')}
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 h-14 text-lg text-center"
              />
            </div>
            <Button
              size="lg"
              onClick={handleSaveName}
              disabled={!residentName.trim() || saving}
              className="w-full min-h-[56px] text-lg font-bold bg-primary hover:bg-primary/90"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {t('tablet.setup.continue', 'Continue')}
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Connect devices — isolated component, BLE hook only active here */}
        {step === 2 && (
          <DeviceStep
            onBack={() => setStep(1)}
            onContinue={handleDeviceContinue}
            userId={user?.id}
            t={t as DeviceStepProps['t']}
          />
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              {t('tablet.setup.permissionsTitle', 'Enable Full Protection')}
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              {t('tablet.setup.permissionsDesc', 'LifeLink needs access to your microphone and notifications for the best tablet experience.')}
            </p>
            <div className="space-y-4 mb-8 text-left">
              <div className="flex items-start gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Mic className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{t('tablet.setup.micTitle', 'Microphone Access')}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {t('tablet.setup.micDesc', 'For CLARA voice — say "Hey Clara" to get help hands-free')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{t('tablet.setup.notifTitle', 'Notification Permission')}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {t('tablet.setup.notifDesc', 'For emergency alerts — critical SOS and safety notifications')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setStep(2)}
                className="min-h-[56px] px-6 border-slate-600 text-slate-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={handlePermissions}
                className="flex-1 min-h-[56px] text-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {t('tablet.setup.allowAll', 'Allow All')}
              </Button>
            </div>
            <button
              onClick={handleSkipPermissions}
              className="mt-3 text-sm text-slate-500 hover:text-slate-300"
            >
              {t('tablet.setup.skipPermissions', 'Skip (limited features)')}
            </button>
          </div>
        )}

        {/* Step 4: Install as app */}
        {step === 4 && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Tablet className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              {t('tablet.setup.installTitle', 'Install as App')}
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              {t('tablet.setup.installDesc', 'Install LifeLink on your home screen for a full-screen, always-on experience.')}
            </p>

            {isInstalled || installDone ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-8">
                <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-300 font-medium">
                  {t('tablet.setup.installed', 'App installed successfully!')}
                </p>
              </div>
            ) : isInstallable ? (
              <Button
                size="lg"
                onClick={handleInstall}
                disabled={waitingForPrompt}
                className="w-full min-h-[56px] text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 mb-6"
              >
                {waitingForPrompt ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Download className="h-5 w-5 mr-2" />
                )}
                {t('tablet.setup.installButton', 'Install App Now')}
              </Button>
            ) : isIOS ? (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left text-sm text-slate-300 space-y-4 mb-6">
                <p className="font-semibold text-white text-base">
                  {t('tablet.setup.iosTitle', 'Install on this iPad / iPhone:')}
                </p>
                {['iosStep1', 'iosStep2', 'iosStep3'].map((key, idx) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="mt-0.5">
                      {t(`tablet.setup.${key}`, ['Open this page in Safari (not Chrome)', 'Tap the Share button at the bottom of the screen', 'Tap "Add to Home Screen" then tap "Add"'][idx])}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left text-sm text-slate-300 space-y-4 mb-6">
                <p className="font-semibold text-white text-base">
                  {t('tablet.setup.androidTitle', 'Install on this device:')}
                </p>
                {['androidStep1', 'androidStep2', 'androidStep3'].map((key, idx) => (
                  <div key={key} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="mt-0.5">
                      {t(`tablet.setup.${key}`, ['Tap the three-dot menu in your browser (top-right)', 'Tap "Add to Home Screen" or "Install App"', 'Tap "Add" or "Install" to confirm'][idx])}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setStep(3)}
                className="min-h-[56px] px-6 border-slate-600 text-slate-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={() => setStep(5)}
                className="flex-1 min-h-[56px] text-lg font-bold bg-primary hover:bg-primary/90"
              >
                {isInstalled || installDone
                  ? t('tablet.setup.continue', 'Continue')
                  : t('tablet.setup.skipInstall', 'Skip for Now')}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: All set */}
        {step === 5 && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              {t('tablet.setup.doneTitle', "You're All Set!")}
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              {t('tablet.setup.doneDesc', 'LifeLink is ready to protect. CLARA is here 24/7 — just say "Hey Clara" if you need anything.')}
            </p>
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <User className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-white">{residentName || existingFirst || t('tablet.setup.notSet', 'Not set')}</span>
                <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Bluetooth className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">
                  {pendantConnected
                    ? t('tablet.setup.pendantConnectedShort', 'Pendant connected — {{name}}', { name: pendantName })
                    : t('tablet.setup.pendantNotConnected', 'Pendant not connected')}
                </span>
                {pendantConnected ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                ) : (
                  <span className="text-xs text-amber-400 ml-auto">{t('tablet.setup.optional', 'Optional')}</span>
                )}
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Speaker className="h-5 w-5 text-purple-400 flex-shrink-0" />
                <span className="text-white">
                  {speakerStatus.alexa || speakerStatus.google
                    ? t('tablet.setup.speakersLinkedSummary', 'Speakers linked ({{list}})', {
                        list: [speakerStatus.alexa && 'Alexa', speakerStatus.google && 'Google'].filter(Boolean).join(', '),
                      })
                    : t('tablet.setup.speakersNotLinked', 'No speakers linked')}
                </span>
                {speakerStatus.alexa || speakerStatus.google ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                ) : (
                  <span className="text-xs text-amber-400 ml-auto">{t('tablet.setup.optional', 'Optional')}</span>
                )}
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Mic className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">
                  {micResult === 'granted'
                    ? t('tablet.setup.micGranted', 'Microphone enabled')
                    : t('tablet.setup.micSkipped', 'Microphone skipped')}
                </span>
                {micResult === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                ) : (
                  <span className="text-xs text-amber-400 ml-auto">{t('tablet.setup.limited', 'Limited')}</span>
                )}
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Bell className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <span className="text-white">
                  {notifResult === 'granted'
                    ? t('tablet.setup.notifGranted', 'Notifications enabled')
                    : t('tablet.setup.notifSkipped', 'Notifications skipped')}
                </span>
                {notifResult === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                ) : (
                  <span className="text-xs text-amber-400 ml-auto">{t('tablet.setup.limited', 'Limited')}</span>
                )}
              </div>
            </div>
            <Button
              size="lg"
              onClick={handleFinish}
              className="w-full min-h-[64px] text-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
            >
              {t('tablet.setup.startUsing', 'Start Using LifeLink')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
