import { Link } from 'react-router-dom';
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

// ── Section 1: Hero ─────────────────────────────────────────
function HeroSection() {
  const { t } = useTranslation();
  return (
    <section className="bg-[#FAFAF9] pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl text-center">
        <span className="text-primary text-sm font-semibold tracking-wider uppercase">
          {t('howItWorksPage.label', 'HOW IT WORKS')}
        </span>
        <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 mt-4 leading-tight text-gray-900">
          {t('howItWorksPage.heading', 'Protection that works while you live your life')}
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto">
          {t('howItWorksPage.subtitle', 'Set up in 2 minutes. CLARA watches over you and your loved ones 24/7.')}
        </p>
      </div>
    </section>
  );
}

// ── Section 2: 4 Steps ──────────────────────────────────────
const steps = [
  { icon: UserPlus, titleKey: 'step1Title', descKey: 'step1Desc', titleFallback: 'Sign Up', descFallback: 'Start your free 7-day trial. No card needed. Takes 2 minutes.' },
  { icon: Users, titleKey: 'step2Title', descKey: 'step2Desc', titleFallback: 'Add Your Circle', descFallback: 'Add emergency contacts. They get instant alerts if you need help.' },
  { icon: Shield, titleKey: 'step3Title', descKey: 'step3Desc', titleFallback: 'CLARA Watches Over You', descFallback: 'CLARA monitors your safety 24/7 via app, pendant, or tablet.' },
  { icon: Zap, titleKey: 'step4Title', descKey: 'step4Desc', titleFallback: 'Help Arrives Fast', descFallback: 'Your circle is alerted instantly with your location.' },
];

function StepsSection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gray-200" />
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-red-500/20">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t(`howItWorksPage.${step.titleKey}`, step.titleFallback)}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto">
                  {t(`howItWorksPage.${step.descKey}`, step.descFallback)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section 3: Three Ways to Trigger SOS ────────────────────
const triggerCards = [
  {
    icon: Smartphone,
    title: 'Mobile App',
    desc: 'One tap on the app sends your location and alerts your full emergency circle.',
    tag: 'Always with you',
  },
  {
    icon: Radio,
    title: 'SOS Pendant',
    desc: 'Waterproof Bluetooth pendant. 6-month battery. Works anywhere your phone has signal.',
    tag: 'Worn 24/7',
  },
  {
    icon: Monitor,
    title: 'Tablet Dashboard',
    desc: 'Fixed tablet at home. CLARA monitors activity and can detect if something is wrong.',
    tag: 'Always on at home',
  },
];

function TriggersSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Three ways to call for help
          </h2>
          <p className="text-gray-500 text-lg">
            However you need it, whenever you need it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {triggerCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 group relative overflow-hidden">
                <Badge className="absolute top-4 right-4 bg-red-50 text-red-600 border-red-200 text-[10px]">
                  {card.tag}
                </Badge>
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                  <Icon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Smart speaker note */}
        <div className="max-w-5xl mx-auto mt-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 mb-0.5">Voice activation</p>
              <p className="text-gray-500 text-sm">Say "CLARA, help me" hands-free from your phone, tablet, or anywhere CLARA is listening — even if your phone is out of reach.</p>
            </div>
            <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full font-medium flex-shrink-0 hidden sm:block">
              Hands-free
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 4: Everything Included ──────────────────────────
const featureCards = [
  { icon: Mic, title: 'Voice Activation', desc: 'Say "CLARA, help me" hands-free. Works on your phone, tablet, and smart speakers.', tag: 'Hands-free', addon: false },
  { icon: Smartphone, title: 'Mobile App SOS', desc: 'One tap on the app triggers your full emergency circle instantly from anywhere.', tag: 'Always with you', addon: false },
  { icon: Radio, title: 'SOS Pendant', desc: 'Waterproof Bluetooth pendant. 6-month battery. Press once for immediate help.', tag: 'Worn 24/7', addon: false },
  { icon: Monitor, title: 'Tablet Dashboard', desc: 'Fixed tablet at home. Always-on CLARA monitoring. Voice activated. Family messages.', tag: 'Always home', addon: false },
  { icon: Users, title: 'Family Circle', desc: 'Connect up to 5 emergency contacts. They get instant alerts, live location and your medical profile.', tag: 'Stay connected', addon: false },
  { icon: MapPin, title: 'Live GPS Location', desc: 'Real-time location shared with your circle during any emergency — updated every 30 seconds.', tag: 'Find me fast', addon: false },
  { icon: Heart, title: 'Medical Profile', desc: 'Blood type, allergies, medications and conditions sent automatically to first responders.', tag: 'Life-saving info', addon: false },
  { icon: Phone, title: 'Conference Bridge', desc: 'Your family joins a live call during any emergency to coordinate response together.', tag: 'Coordinate fast', addon: false },
  { icon: Headphones, title: 'Instant Callback', desc: 'If no one responds, a real person calls you back within 60 seconds to confirm you are safe.', tag: 'Never alone', addon: false },
  { icon: Activity, title: 'Daily Wellbeing', desc: 'CLARA checks in daily. Tracks mood, sleep and pain. Sends a digest to your family.', tag: 'Add-on · €2.99', addon: true },
  { icon: Clock, title: 'Medication Reminder', desc: 'CLARA reminds you to take medication. Logs it. Alerts family if a dose is missed.', tag: 'Add-on · €2.99', addon: true },
  { icon: Star, title: 'CLARA AI 24/7', desc: 'Your personal AI safety companion. Available around the clock via chat, voice, or WhatsApp.', tag: 'Always on', addon: false },
];

function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Everything included in your plan
          </h2>
          <p className="text-gray-500">
            One subscription. Complete protection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureCards.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-red-100 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${f.addon ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{f.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section 5: What Happens When SOS Fires ──────────────────
const sosSteps = [
  { icon: MessageSquare, title: 'Your family is alerted instantly', desc: 'Every member of your emergency circle gets a WhatsApp, SMS and email alert simultaneously — within seconds.' },
  { icon: MapPin, title: 'Your live location is shared', desc: 'Your exact GPS coordinates are sent to your family circle and update in real time so they can find you.' },
  { icon: FileText, title: 'Your medical profile is sent', desc: 'Blood type, allergies, medications and conditions are automatically shared with your contacts and first responders.' },
  { icon: Phone, title: 'A conference bridge opens', desc: 'Your family can join a live call together to coordinate the response — no confusion, everyone connected.' },
  { icon: Headphones, title: 'Instant callback arranged', desc: 'If no one responds within 60 seconds, a real person calls you back to confirm you are safe.' },
];

function SOSFlowSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-4 py-1.5 rounded-full border border-red-100 mb-4">
            In the next 30 seconds
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What happens the moment you press SOS
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            CLARA coordinates everything instantly — you just need to press one button.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sosSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md hover:border-red-100 transition-all">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{i + 1}</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-gray-900 mb-1 text-sm">{step.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section 6: CTA ──────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {t('howItWorksPage.ctaHeading', 'Start protecting yourself or someone you love today')}
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button asChild size="lg" className="bg-red-500 text-white hover:bg-red-600 font-semibold text-lg px-8 py-6 rounded-xl shadow-lg shadow-red-500/20">
            <Link to="/onboarding">
              <Shield className="h-5 w-5 mr-2" />
              {t('howItWorksPage.ctaStart', 'Start Free Trial')}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-xl">
            <Link to="/gift">
              <Gift className="h-5 w-5 mr-2" />
              {t('howItWorksPage.ctaGift', 'Give as a Gift')}
            </Link>
          </Button>
        </div>

        <p className="text-sm text-gray-400">
          7-day free trial · No card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function HowItWorksPage() {
  useScrollToTop();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <StepsSection />
      <TriggersSection />
      <FeaturesSection />
      <SOSFlowSection />
      <CTASection />
      <Footer />
    </div>
  );
}
