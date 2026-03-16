import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Users, Shield, Zap,
  Smartphone, Radio, Monitor,
  MessageSquare, MapPin, FileText, Phone, AlertTriangle,
  Gift,
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
        <h1 className="text-4xl md:text-6xl font-bold font-poppins mb-6 mt-4 leading-tight text-[hsl(215,25%,27%)]">
          {t('howItWorksPage.heading', 'Protection that works while you live your life')}
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto font-inter">
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
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-[2px] bg-gray-200" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center relative">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg shadow-red-500/20">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-[hsl(215,25%,27%)] mb-2">
                  {t(`howItWorksPage.${step.titleKey}`, step.titleFallback)}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[220px] mx-auto font-inter">
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
function PhoneMockup() {
  return (
    <div className="mt-4 mx-auto" style={{ maxWidth: 180 }}>
      <div className="rounded-[32px] p-2 border-2 border-gray-200 bg-white shadow-lg">
        <img
          src="/screenshots/family-mobile.png"
          alt="Family mobile app"
          className="rounded-[26px] w-full block"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement; if (next) next.style.display = 'flex'; }}
        />
        <div className="hidden h-[240px] items-center justify-center rounded-[26px] bg-gray-50 text-gray-400 text-xs text-center p-5">
          <div>
            <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <span>Family App Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PendantVisual() {
  return (
    <div className="mt-4 flex justify-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl bg-red-500/10 animate-pulse" style={{ width: 100, height: 100 }} />
        <div className="relative w-[100px] h-[100px] rounded-full flex items-center justify-center text-lg font-bold text-white bg-red-500 shadow-lg shadow-red-500/20">
          SOS
        </div>
      </div>
    </div>
  );
}

function TabletMockup() {
  return (
    <div className="mt-4 mx-auto" style={{ maxWidth: 260 }}>
      <div className="rounded-2xl p-2 border-2 border-gray-200 bg-white shadow-lg" style={{ aspectRatio: '4/3' }}>
        <img
          src="/screenshots/tablet-dashboard.png"
          alt="Tablet dashboard"
          className="rounded-[10px] w-full h-full object-cover block"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement; if (next) next.style.display = 'flex'; }}
        />
        <div className="hidden h-full items-center justify-center rounded-[10px] bg-gray-50 text-gray-400 text-xs text-center p-5">
          <div>
            <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <span>Tablet Dashboard Preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const triggerCards = [
  {
    icon: Smartphone,
    title: 'Mobile App',
    desc: 'One tap on the app sends your location and alerts your full emergency circle.',
    tag: 'Always with you',
    visual: <PhoneMockup />,
  },
  {
    icon: Radio,
    title: 'SOS Pendant',
    desc: 'Waterproof Bluetooth pendant. 6-month battery. Works anywhere your phone has signal.',
    tag: 'Worn 24/7',
    visual: <PendantVisual />,
  },
  {
    icon: Monitor,
    title: 'Tablet Dashboard',
    desc: 'Fixed tablet at home. CLARA monitors activity and can detect if something is wrong.',
    tag: 'Always on at home',
    visual: <TabletMockup />,
  },
];

function TriggersSection() {
  return (
    <section className="py-20 bg-[#F3F4F6]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-4">
            Three ways to call for help
          </h2>
          <p className="text-gray-500 text-lg font-inter">
            However you need it, whenever you need it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {triggerCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="rounded-2xl p-6 bg-white border border-[#E5E7EB] shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 group relative overflow-hidden"
              >
                <Badge className="absolute top-4 right-4 bg-red-50 text-red-600 border-red-200 text-[10px]">
                  {card.tag}
                </Badge>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-[hsl(215,25%,27%)] mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-inter">{card.desc}</p>
                {card.visual}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section 4: What Happens When SOS Fires ──────────────────
const sosSteps = [
  { icon: MessageSquare, title: 'Circle alerted instantly', desc: 'WhatsApp + SMS sent to all emergency contacts', color: 'text-red-500 bg-red-50 border-red-200' },
  { icon: MapPin, title: 'GPS location shared live', desc: 'Your real-time location streamed to your circle', color: 'text-red-500 bg-red-50 border-red-200' },
  { icon: FileText, title: 'Medical profile sent', desc: 'Conditions, medications, and allergies shared with first responders', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { icon: Phone, title: 'Conference call opens', desc: 'Your entire family circle connected on one call to coordinate', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { icon: AlertTriangle, title: 'CLARA escalates', desc: 'If no one responds, CLARA escalates and keeps trying', color: 'text-green-600 bg-green-50 border-green-200' },
];

function SOSFlowSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(215,25%,27%)] font-poppins mb-4">
            What happens the moment you press SOS
          </h2>
        </div>

        <div className="space-y-4">
          {sosSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 ${step.color}`}>
                  <span className="text-sm font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${step.color.split(' ')[0]}`} />
                    <h3 className="font-semibold text-[hsl(215,25%,27%)]">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 font-inter">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Section 5: CTA ──────────────────────────────────────────
function CTASection() {
  const { t } = useTranslation();
  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-white font-poppins mb-8">
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
          7-day free trial &middot; No card required &middot; Cancel anytime
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
      <SOSFlowSection />
      <CTASection />
      <Footer />
    </div>
  );
}
