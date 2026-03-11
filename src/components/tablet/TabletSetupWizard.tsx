import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePWAFeatures } from '@/hooks/usePWAFeatures';
import { initAudio } from '@/utils/tabletSounds';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  User,
  Phone,
  Mic,
  Bell,
  Download,
  Tablet,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';

interface TabletSetupWizardProps {
  onComplete: (micResult: 'granted' | 'skipped', notifResult: 'granted' | 'skipped') => void;
}

interface ContactEntry {
  name: string;
  phone: string;
  relationship: string;
}

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
  const [residentName, setResidentName] = useState(existingFirst ? `${existingFirst} ${existingLast}`.trim() : '');

  // Skip Step 1 if name already known from account
  const [step, setStep] = useState(existingFirst ? 2 : 1);

  // Step 2: Emergency contacts — pre-loaded from DB below
  const [contacts, setContacts] = useState<ContactEntry[]>([
    { name: '', phone: '', relationship: '' },
  ]);

  // Pre-load existing emergency contacts from Supabase
  useEffect(() => {
    if (!user) return;
    supabase
      .from('emergency_contacts')
      .select('name, phone, relationship')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setContacts(data.map((c) => ({ name: c.name, phone: c.phone, relationship: c.relationship || '' })));
        }
      });
  }, [user]);

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
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName },
    });
    setSaving(false);
    setStep(2);
  };

  const handleSaveContacts = async () => {
    if (!user) return;
    setSaving(true);
    const valid = contacts.filter((c) => c.name.trim() && c.phone.trim());
    if (valid.length > 0) {
      // Remove existing contacts first to avoid duplicates
      await supabase.from('emergency_contacts').delete().eq('user_id', user.id);
      for (let i = 0; i < valid.length; i++) {
        await supabase.from('emergency_contacts').insert({
          user_id: user.id,
          name: valid[i].name.trim(),
          phone: valid[i].phone.trim(),
          relationship: valid[i].relationship.trim() || 'Family',
          priority: i + 1,
        });
      }
    }
    setSaving(false);
    setStep(3);
  };

  const handlePermissions = async () => {
    initAudio();
    let mic: 'granted' | 'skipped' = 'skipped';
    let notif: 'granted' | 'skipped' = 'skipped';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
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

  const addContact = () => {
    if (contacts.length < 5) {
      setContacts([...contacts, { name: '', phone: '', relationship: '' }]);
    }
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactEntry, value: string) => {
    setContacts(contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  // --- Step content ---

  const stepIcons = [User, Phone, ShieldCheck, Tablet, CheckCircle];

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
                <div className={`h-1 w-full rounded-full ${isDone ? 'bg-emerald-500' : isActive ? 'bg-primary' : 'bg-slate-800'}`} />
              </div>
            );
          })}
        </div>

        {/* Step 1: Who is this tablet for? */}
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

        {/* Step 2: Emergency contacts */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                <Phone className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                {t('tablet.setup.contactsTitle', 'Emergency Contacts')}
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                {t('tablet.setup.contactsDesc', 'Add the people who should be notified in an emergency.')}
              </p>
            </div>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-1">
              {contacts.map((contact, index) => (
                <div key={index} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-400">
                      {t('tablet.setup.contact', 'Contact')} {index + 1}
                    </span>
                    {contacts.length > 1 && (
                      <button onClick={() => removeContact(index)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder={t('tablet.setup.contactName', 'Name')}
                    className="bg-slate-900 border-slate-600 text-white placeholder-slate-500 h-11"
                  />
                  <Input
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder={t('tablet.setup.contactPhone', 'Phone number')}
                    type="tel"
                    className="bg-slate-900 border-slate-600 text-white placeholder-slate-500 h-11"
                  />
                  <Input
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    placeholder={t('tablet.setup.contactRelation', 'Relationship (e.g. Daughter, Son, Carer)')}
                    className="bg-slate-900 border-slate-600 text-white placeholder-slate-500 h-11"
                  />
                </div>
              ))}
            </div>

            {contacts.length < 5 && (
              <button
                onClick={addContact}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 mb-6"
              >
                <Plus className="h-4 w-4" />
                {t('tablet.setup.addContact', 'Add another contact')}
              </button>
            )}

            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => setStep(1)}
                className="min-h-[56px] px-6 border-slate-600 text-slate-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={handleSaveContacts}
                disabled={saving}
                className="flex-1 min-h-[56px] text-lg font-bold bg-primary hover:bg-primary/90"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                {contacts[0]?.name?.trim()
                  ? t('tablet.setup.saveContacts', 'Save & Continue')
                  : t('tablet.setup.skipContacts', 'Skip for Now')}
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
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
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</span>
                  <p className="mt-0.5">{t('tablet.setup.iosStep1', 'Open this page in Safari (not Chrome)')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</span>
                  <p className="mt-0.5">{t('tablet.setup.iosStep2', 'Tap the Share button at the bottom of the screen')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</span>
                  <p className="mt-0.5">{t('tablet.setup.iosStep3', 'Tap "Add to Home Screen" then tap "Add"')}</p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 text-left text-sm text-slate-300 space-y-4 mb-6">
                <p className="font-semibold text-white text-base">
                  {t('tablet.setup.androidTitle', 'Install on this device:')}
                </p>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">1</span>
                  <p className="mt-0.5">{t('tablet.setup.androidStep1', 'Tap the three-dot menu in your browser (top-right)')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">2</span>
                  <p className="mt-0.5">{t('tablet.setup.androidStep2', 'Tap "Add to Home Screen" or "Install App"')}</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">3</span>
                  <p className="mt-0.5">{t('tablet.setup.androidStep3', 'Tap "Add" or "Install" to confirm')}</p>
                </div>
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

            {/* Summary */}
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <User className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-white">{residentName || existingFirst || t('tablet.setup.notSet', 'Not set')}</span>
                <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Phone className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                <span className="text-white">
                  {contacts.filter((c) => c.name.trim()).length > 0
                    ? t('tablet.setup.contactsSaved', '{{count}} contact(s) saved', { count: contacts.filter((c) => c.name.trim()).length })
                    : t('tablet.setup.noContactsYet', 'No contacts added yet')}
                </span>
                {contacts.filter((c) => c.name.trim()).length > 0 ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 ml-auto" />
                ) : (
                  <span className="text-xs text-amber-400 ml-auto">{t('tablet.setup.optional', 'Optional')}</span>
                )}
              </div>
              <div className="flex items-center gap-3 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3">
                <Mic className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span className="text-white">
                  {micResult === 'granted' ? t('tablet.setup.micGranted', 'Microphone enabled') : t('tablet.setup.micSkipped', 'Microphone skipped')}
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
                  {notifResult === 'granted' ? t('tablet.setup.notifGranted', 'Notifications enabled') : t('tablet.setup.notifSkipped', 'Notifications skipped')}
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
