import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Users, Shield, Zap,
  Smartphone, Radio, Monitor,
  MessageSquare, MapPin, FileText, Phone, Headphones,
  Gift, Mic, Star, Activity, Clock, Heart, Volume2, Check
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useScrollToTop } from '@/hooks/useScrollToTop';

function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-[#FAFAF9] pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <span className="text-primary text-sm font-semibold tracking-wider uppercase">{t('howItWorksPage.label', 'HOW IT WORKS')}</span>
        <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 mt-4 leading-tight text-gray-900">{t('howItWorksPage.heading', 'Protection that works while you live your life')}</h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto">{t('howItWorksPage.subtitle', 'Core protection from €9.99/month. Set up in 2 minutes. CLARA watches over you 24/7.')}</p>
      </div>
    </section>
  );
}

function StepsSection() {
  const { t } = useTranslation();
  const steps = [
    { icon: UserPlus, title: t('howItWorksPage.step1Title', 'Sign Up'), desc: t('howItWorksPage.step1Desc', 'Start your free 7-day trial. No card needed. Takes 2 minutes.') },
    { icon: Users, title: t('howItWorksPage.step2Title', 'Add Your Circle'), desc: t('howItWorksPage.step2Desc', 'Add emergency contacts. They get instant alerts if you need help.') },
    { icon: Shield, title: t('howItWorksPage.step3Title', 'CLARA Watches Over You'), desc: t('howItWorksPage.step3Desc', 'CLARA monitors your safety 24/7 via app, voice, or tablet.') },
    { icon: Zap, title: t('howItWorksPage.step4Title', 'Help Arrives Fast'), desc: t('howItWorksPage.step4Desc', 'Your circle is alerted instantly with your location.') },
  ];
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gray-200" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-red-500/20">{i + 1}</div>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-3"><Icon className="h-5 w-5 text-red-500" /></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TriggersSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('howItWorksPage.threeWays', 'Three ways to call for help')}</h2>
          <p className="text-gray-500 text-lg">{t('howItWorksPage.threeWaysSub', 'However you need it, whenever you need it.')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">{t('howItWorksPage.alwaysWithYou', 'Always with you')}</Badge>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full"><Check className="w-3 h-3" /> {t('howItWorksPage.included', 'Included')}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors"><Smartphone className="h-5 w-5 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorksPage.mobileApp', 'Mobile App')}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{t('howItWorksPage.mobileAppDesc', 'One tap on the app sends your location and alerts your full emergency circle.')}</p>
          </div>
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">{t('howItWorksPage.worn247', 'Worn 24/7')}</Badge>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">+ {t('howItWorksPage.optional', 'Optional')}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors"><Radio className="h-5 w-5 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorksPage.sosPendant', 'SOS Pendant')}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{t('howItWorksPage.sosPendantDesc', 'Waterproof Bluetooth pendant. 6-month battery. Separate one-time purchase.')}</p>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 border border-amber-200">{t('howItWorksPage.pendantNote', 'The pendant is optional. App SOS and voice activation are included free.')}</p>
          </div>
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">{t('howItWorksPage.alwaysHome', 'Always on at home')}</Badge>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full"><Check className="w-3 h-3" /> {t('howItWorksPage.included', 'Included')}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors"><Monitor className="h-5 w-5 text-red-500" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('howItWorksPage.tabletDashboard', 'Tablet Dashboard')}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{t('howItWorksPage.tabletDesc', 'Fixed tablet at home. CLARA monitors activity and responds to voice. Use any tablet.')}</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0"><Volume2 className="w-6 h-6 text-white" /></div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-0.5">{t('howItWorksPage.voiceActivation', 'Voice activation')}</p>
              <p className="text-gray-500 text-sm">{t('howItWorksPage.voiceDesc', 'Say "CLARA, help me" hands-free from your phone, tablet, or anywhere CLARA is listening.')}</p>
            </div>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium flex-shrink-0 hidden sm:inline-flex items-center gap-1"><Check className="w-3 h-3" /> {t('howItWorksPage.included', 'Included')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function MosaicSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const Tile = ({ icon: Icon, title, desc }: { icon: typeof Mic; title: string; desc: string }) => (
    <div className="bg-white p-6 hover:bg-red-50/30 transition-colors group cursor-pointer flex items-start gap-4">
      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors"><Icon className="w-5 h-5 text-red-500" /></div>
      <div><h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4><p className="text-gray-500 text-xs leading-relaxed">{desc}</p></div>
    </div>
  );
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-3 block">{t('howItWorksPage.whatYouGet', 'What you get')}</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t('howItWorksPage.everythingInPlan', 'Everything in your plan')}</h2>
          <p className="text-gray-500 text-base">{t('howItWorksPage.onePriceComplete', '€9.99/month — one price, complete protection')}</p>
        </div>
        <div className="bg-gray-100 rounded-3xl overflow-hidden flex flex-col gap-px">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
            <div className="bg-white p-8 hover:bg-red-50/30 transition-colors group cursor-pointer relative overflow-hidden">
              <span className="absolute -right-2 -bottom-4 text-[100px] font-black text-gray-100 leading-none select-none pointer-events-none group-hover:text-red-100 transition-colors">01</span>
              <span className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-4 block">{t('howItWorksPage.coreFeature', 'Core feature')}</span>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors"><Shield className="w-6 h-6 text-red-500" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('howItWorksPage.claraAi247', 'CLARA AI — 24/7')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{t('howItWorksPage.claraAiDesc', 'Your personal AI safety companion. Always listening, always ready to coordinate your emergency response.')}</p>
            </div>
            <div className="bg-white p-8 hover:bg-red-50/30 transition-colors group cursor-pointer relative overflow-hidden">
              <span className="absolute -right-2 -bottom-4 text-[100px] font-black text-gray-100 leading-none select-none pointer-events-none group-hover:text-red-100 transition-colors">02</span>
              <span className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-4 block">{t('howItWorksPage.alwaysWithYou', 'Always with you')}</span>
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors"><Smartphone className="w-6 h-6 text-red-500" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('howItWorksPage.oneTapSos', 'One-tap App SOS')}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{t('howItWorksPage.oneTapSosDesc', 'Press once from anywhere. Your full emergency circle alerted instantly with your live location.')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px">
            <Tile icon={Mic} title={t('howItWorksPage.voiceActivation', 'Voice activation')} desc={t('howItWorksPage.voiceTileDesc', '"CLARA, help me" — hands-free from phone, tablet or smart speaker.')} />
            <Tile icon={MapPin} title={t('howItWorksPage.liveGps', 'Live GPS location')} desc={t('howItWorksPage.liveGpsDesc', 'Real-time coordinates shared every 30 seconds during any emergency.')} />
            <Tile icon={Phone} title={t('howItWorksPage.conferenceBridge', 'Conference bridge')} desc={t('howItWorksPage.conferenceBridgeDesc', 'Family joins a live call together the moment SOS fires.')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px">
            <div className="sm:col-span-2 bg-white p-8 hover:bg-red-50/30 transition-colors group cursor-pointer flex items-center gap-6">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors"><Monitor className="w-8 h-8 text-red-500" /></div>
              <div><span className="text-red-500 text-xs font-semibold uppercase tracking-widest mb-2 block">{t('howItWorksPage.alwaysHome', 'Always on at home')}</span><h3 className="text-lg font-bold text-gray-900 mb-1">{t('howItWorksPage.tabletDashboard', 'Tablet dashboard')}</h3><p className="text-gray-500 text-sm leading-relaxed">{t('howItWorksPage.tabletMosaicDesc', 'Fixed tablet at home. Always-on CLARA monitoring, voice activated, family messages. Use any tablet — no extra cost.')}</p></div>
            </div>
            <div className="bg-white p-6 hover:bg-red-50/30 transition-colors group cursor-pointer">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors"><Heart className="w-5 h-5 text-red-500" /></div>
              <h4 className="font-bold text-gray-900 text-sm mb-2">{t('howItWorksPage.medicalProfile', 'Medical profile')}</h4>
              <p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.medicalProfileDesc', 'Blood type, allergies and medications sent automatically to first responders.')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px">
            <Tile icon={Users} title={t('howItWorksPage.familyCircle', 'Family circle')} desc={t('howItWorksPage.familyCircleDesc', 'Unlimited emergency contacts. 1st family link free with your plan.')} />
            <Tile icon={Headphones} title={t('howItWorksPage.instantCallback', 'Instant callback')} desc={t('howItWorksPage.instantCallbackDesc', 'No response in 60 seconds? A real person calls you back immediately.')} />
            <Tile icon={Star} title={t('howItWorksPage.freeTrial', '7-day free trial')} desc={t('howItWorksPage.freeTrialDesc', 'Full access, no card required. Try everything before you commit.')} />
          </div>
          <div className="bg-amber-50 hover:bg-amber-100/60 transition-colors p-6 flex items-center gap-5 cursor-pointer">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0"><Radio className="w-6 h-6 text-amber-600" /></div>
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2 mb-1"><h4 className="font-bold text-gray-900 text-sm">{t('howItWorksPage.sosPendant', 'SOS Pendant')}</h4><span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium">{t('howItWorksPage.optionalNotIncluded', 'Optional — not included')}</span></div>
              <p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.sosPendantDesc', 'Waterproof Bluetooth pendant. 6-month battery. Separate one-time purchase.')}</p>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block"><p className="font-bold text-amber-700 text-base">~€49.99</p><p className="text-xs text-amber-600">{t('howItWorksPage.oneTime', 'one-time')}</p></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px">
            <div className="bg-white p-5 hover:bg-blue-50/40 transition-colors cursor-pointer"><Activity className="w-5 h-5 text-blue-500 mb-3" /><span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium mb-2 block w-fit">{t('howItWorksPage.addonTag', 'Add-on · €2.99/mo')}</span><h4 className="font-bold text-gray-900 text-xs mb-1">{t('howItWorksPage.dailyWellbeing', 'Daily Wellbeing')}</h4><p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.dailyWellbeingDesc', 'CLARA checks in daily. Mood, sleep, pain tracked.')}</p></div>
            <div className="bg-white p-5 hover:bg-blue-50/40 transition-colors cursor-pointer"><Clock className="w-5 h-5 text-blue-500 mb-3" /><span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium mb-2 block w-fit">{t('howItWorksPage.addonTag', 'Add-on · €2.99/mo')}</span><h4 className="font-bold text-gray-900 text-xs mb-1">{t('howItWorksPage.medicationReminder', 'Medication Reminder')}</h4><p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.medicationReminderDesc', 'Reminders, dose logging, family alerts if missed.')}</p></div>
            <div className="bg-green-50/70 hover:bg-green-100/60 transition-colors cursor-pointer p-5"><Star className="w-5 h-5 text-green-600 mb-3" /><span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium mb-2 block w-fit">{t('howItWorksPage.freeAutoUnlocked', 'Free — auto unlocked')}</span><h4 className="font-bold text-gray-900 text-xs mb-1">{t('howItWorksPage.claraComplete', 'CLARA Complete')}</h4><p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.claraCompleteDesc', 'Get both add-ons — weekly AI reports free.')}</p></div>
            <div className="bg-white p-5 hover:bg-red-50/30 transition-colors cursor-pointer"><Gift className="w-5 h-5 text-red-500 mb-3" /><span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium mb-2 block w-fit">{t('howItWorksPage.includedFree', 'Included free')}</span><h4 className="font-bold text-gray-900 text-xs mb-1">{t('howItWorksPage.referralProgramme', 'Referral programme')}</h4><p className="text-gray-500 text-xs leading-relaxed">{t('howItWorksPage.referralDesc', 'Refer 5 friends — earn 12 months free.')}</p></div>
          </div>
        </div>
        <div className="text-center mt-10">
          <Button onClick={() => navigate('/onboarding')} className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-semibold text-base shadow-lg shadow-red-500/20 h-auto">{t('howItWorksPage.startTrialCta', 'Start your free trial →')}</Button>
          <p className="text-gray-400 text-sm mt-3">{t('howItWorksPage.ctaSubtext', 'No card required · 7 days free · Cancel anytime')}</p>
        </div>
      </div>
    </section>
  );
}

function SOSFlowSection() {
  const { t } = useTranslation();
  const sosSteps = [
    { icon: MessageSquare, title: t('howItWorksPage.sos1Title', 'Your family is alerted instantly'), desc: t('howItWorksPage.sos1Desc', 'Every member of your emergency circle gets a WhatsApp, SMS and email alert simultaneously — within seconds.') },
    { icon: MapPin, title: t('howItWorksPage.sos2Title', 'Your live location is shared'), desc: t('howItWorksPage.sos2Desc', 'Your exact GPS coordinates are sent to your family circle and update in real time so they can find you.') },
    { icon: FileText, title: t('howItWorksPage.sos3Title', 'Your medical profile is sent'), desc: t('howItWorksPage.sos3Desc', 'Blood type, allergies, medications and conditions are automatically shared with your contacts and first responders.') },
    { icon: Phone, title: t('howItWorksPage.sos4Title', 'A conference bridge opens'), desc: t('howItWorksPage.sos4Desc', 'Your family can join a live call together to coordinate the response — no confusion, everyone connected.') },
    { icon: Headphones, title: t('howItWorksPage.sos5Title', 'Instant callback arranged'), desc: t('howItWorksPage.sos5Desc', 'If no one responds within 60 seconds, a real person calls you back to confirm you are safe.') },
  ];
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-100 mb-4">{t('howItWorksPage.next30Seconds', 'In the next 30 seconds')}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{t('howItWorksPage.whatHappens', 'What happens the moment you press SOS')}</h2>
          <p className="text-gray-500 max-w-xl mx-auto">{t('howItWorksPage.claraCoordinates', 'CLARA coordinates everything instantly — you just need to press one button.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sosSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md hover:border-red-100 transition-all">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center"><Icon className="w-5 h-5 text-white" /></div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">{i + 1}</span></div>
                </div>
                <div><p className="font-bold text-gray-900 mb-1 text-sm">{step.title}</p><p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">{t('howItWorksPage.ctaHeading', 'Start protecting yourself or someone you love today')}</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button asChild size="lg" className="bg-red-500 text-white hover:bg-red-600 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-red-500/20">
            <Link to="/onboarding"><Shield className="h-5 w-5 mr-2" />{t('howItWorksPage.ctaStart', 'Start Free Trial')}</Link>
          </Button>
          <Button asChild size="lg" className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 font-semibold text-lg px-8 py-6 rounded-xl transition-all">
            <Link to="/gift"><Gift className="h-5 w-5 mr-2" />{t('howItWorksPage.ctaGift', 'Give as a Gift')}</Link>
          </Button>
        </div>
        <p className="text-sm text-gray-400">{t('howItWorksPage.ctaSubtext', 'No card required · 7 days free · Cancel anytime')}</p>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <StepsSection />
      <TriggersSection />
      <MosaicSection />
      <SOSFlowSection />
      <CTASection />
      <Footer />
    </div>
  );
}
