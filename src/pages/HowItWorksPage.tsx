import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus, Users, Shield, Zap,
  Smartphone, Radio, Monitor,
  MessageSquare, MapPin, FileText, Phone, Headphones,
  Gift, Mic, Star, Activity, Clock, Heart, Volume2, Check, Plus
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
          {t('howItWorksPage.subtitle', 'Core protection from €9.99/month. Set up in 2 minutes. CLARA watches over you 24/7.')}
        </p>
      </div>
    </section>
  );
}

// ── Section 2: 4 Steps ──────────────────────────────────────
const steps = [
  { icon: UserPlus, titleKey: 'step1Title', descKey: 'step1Desc', titleFallback: 'Sign Up', descFallback: 'Start your free 7-day trial. No card needed. Takes 2 minutes.' },
  { icon: Users, titleKey: 'step2Title', descKey: 'step2Desc', titleFallback: 'Add Your Circle', descFallback: 'Add emergency contacts. They get instant alerts if you need help.' },
  { icon: Shield, titleKey: 'step3Title', descKey: 'step3Desc', titleFallback: 'CLARA Watches Over You', descFallback: 'CLARA monitors your safety 24/7 via app, voice, or tablet.' },
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
          {/* Card 1 — Mobile App */}
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Always with you</Badge>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" /> Included
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
              <Smartphone className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile App</h3>
            <p className="text-sm text-gray-500 leading-relaxed">One tap on the app sends your location and alerts your full emergency circle.</p>
          </div>

          {/* Card 2 — SOS Pendant */}
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all duration-300 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Worn 24/7</Badge>
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                + Optional purchase
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
              <Radio className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SOS Pendant</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Waterproof Bluetooth pendant with 6-month battery. Press once for immediate help. Available as a separate one-time purchase.</p>
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3 border border-amber-200">
              The pendant is optional. The app SOS and voice activation are both included free in your plan.
            </p>
          </div>

          {/* Card 3 — Tablet Dashboard */}
          <div className="rounded-2xl p-6 bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-red-200 transition-all duration-300 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">Always on at home</Badge>
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Check className="w-3 h-3" /> Included
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
              <Monitor className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tablet Dashboard</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Fixed tablet at home. CLARA monitors activity and responds to voice commands. Use any tablet — no extra cost.</p>
          </div>
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
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium flex-shrink-0 hidden sm:inline-flex items-center gap-1">
              <Check className="w-3 h-3" /> Included
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section 4: What's Included vs Optional ──────────────────
function IncludedSection() {
  const navigate = useNavigate();
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Everything in your plan
          </h2>
          <p className="text-gray-500">
            One price. No surprises. The pendant is the only optional extra.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT — Included */}
          <div className="bg-white rounded-2xl border border-green-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Individual Plan</p>
                <p className="text-green-600 font-bold text-lg">€9.99/month</p>
              </div>
            </div>

            {[
              ['CLARA AI assistant 24/7', 'Always watching over you'],
              ['App SOS button', 'One tap from your phone'],
              ['Voice activation', '"CLARA, help me" — hands free'],
              ['Live GPS location sharing', 'Your circle always knows where you are'],
              ['Medical profile', 'Shared automatically in emergencies'],
              ['Family circle', '1 family link included free'],
              ['Conference bridge', 'Family joins a live call instantly'],
              ['Tablet dashboard', 'Always-on home monitoring — use any tablet'],
              ['7-day free trial', 'No card required to start'],
            ].map(([feature, detail]) => (
              <div key={feature} className="flex items-start gap-3 mb-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{feature}</p>
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Optional extras */}
          <div className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Optional Extras</p>
                <p className="text-amber-600 text-sm">Add only what you need</p>
              </div>
            </div>

            {/* SOS Pendant */}
            <div className="bg-amber-50 rounded-xl p-4 mb-3 border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 text-sm">SOS Pendant</p>
                <span className="font-bold text-gray-900 text-sm">~€49.99</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">One-time purchase. Waterproof, 6-month battery, always worn.</p>
              <span className="text-xs bg-white border border-amber-300 text-amber-700 px-2 py-0.5 rounded-full">One-time purchase</span>
            </div>

            {/* Family Links */}
            <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 text-sm">Extra Family Links</p>
                <span className="font-bold text-gray-900 text-sm">€2.99/mo</span>
              </div>
              <p className="text-xs text-gray-500">Add more family members to your circle. First link free.</p>
            </div>

            {/* Daily Wellbeing */}
            <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 text-sm">Daily Wellbeing</p>
                <span className="font-bold text-gray-900 text-sm">€2.99/mo</span>
              </div>
              <p className="text-xs text-gray-500">CLARA checks in daily. Tracks mood, sleep and pain.</p>
            </div>

            {/* Medication Reminder */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900 text-sm">Medication Reminder</p>
                <span className="font-bold text-gray-900 text-sm">€2.99/mo</span>
              </div>
              <p className="text-xs text-gray-500">CLARA reminds you to take medication and alerts family if missed.</p>
            </div>

            {/* CLARA Complete */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-green-800 text-sm">🎉 CLARA Complete</p>
                <span className="font-bold text-green-700 text-sm">FREE</span>
              </div>
              <p className="text-xs text-green-600">Auto-unlocked when you add both Wellbeing + Medication. Weekly AI health reports included.</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Button
            onClick={() => navigate('/onboarding')}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-semibold text-base shadow-lg shadow-red-500/25 h-auto"
          >
            Start free trial — €9.99/month
          </Button>
          <p className="text-gray-400 text-sm mt-3">
            No card required · 7 days free · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Section 5: Feature Grid (accurately labelled) ───────────
const featureCards: { icon: typeof Mic; title: string; desc: string; tag: string; type: 'included' | 'addon' | 'purchase' }[] = [
  { icon: Mic, title: 'Voice Activation', desc: 'Say "CLARA, help me" hands-free. Works on your phone, tablet, and smart speakers.', tag: 'Included', type: 'included' },
  { icon: Smartphone, title: 'Mobile App SOS', desc: 'One tap on the app triggers your full emergency circle instantly from anywhere.', tag: 'Included', type: 'included' },
  { icon: Radio, title: 'SOS Pendant', desc: 'Waterproof Bluetooth pendant. 6-month battery. Available as optional one-time purchase.', tag: 'Separate purchase', type: 'purchase' },
  { icon: Monitor, title: 'Tablet Dashboard', desc: 'Fixed tablet at home. Always-on CLARA monitoring. Voice activated. Use any tablet.', tag: 'Included', type: 'included' },
  { icon: Users, title: 'Family Circle', desc: 'Connect up to 5 emergency contacts. They get instant alerts, live location and your medical profile.', tag: 'Included', type: 'included' },
  { icon: MapPin, title: 'Live GPS Location', desc: 'Real-time location shared with your circle during any emergency — updated every 30 seconds.', tag: 'Included', type: 'included' },
  { icon: Heart, title: 'Medical Profile', desc: 'Blood type, allergies, medications and conditions sent automatically to first responders.', tag: 'Included', type: 'included' },
  { icon: Phone, title: 'Conference Bridge', desc: 'Your family joins a live call during any emergency to coordinate response together.', tag: 'Included', type: 'included' },
  { icon: Headphones, title: 'Instant Callback', desc: 'If no one responds, a real person calls you back within 60 seconds to confirm you are safe.', tag: 'Included', type: 'included' },
  { icon: Activity, title: 'Daily Wellbeing', desc: 'CLARA checks in daily. Tracks mood, sleep and pain. Sends a digest to your family.', tag: 'Add-on · €2.99/mo', type: 'addon' },
  { icon: Clock, title: 'Medication Reminder', desc: 'CLARA reminds you to take medication. Logs it. Alerts family if a dose is missed.', tag: 'Add-on · €2.99/mo', type: 'addon' },
  { icon: Star, title: 'CLARA AI 24/7', desc: 'Your personal AI safety companion. Available around the clock via chat, voice, or WhatsApp.', tag: 'Included', type: 'included' },
];

const tagStyles: Record<string, string> = {
  included: 'bg-green-50 text-green-700 border-green-200',
  addon: 'bg-blue-50 text-blue-600 border-blue-200',
  purchase: 'bg-amber-50 text-amber-700 border-amber-200',
};

function FeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Full feature breakdown
          </h2>
          <p className="text-gray-500">
            9 features included · 2 optional add-ons · 1 optional purchase
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
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${tagStyles[f.type]}`}>
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

// ── Section 6: What Happens When SOS Fires ──────────────────
const sosSteps = [
  { icon: MessageSquare, title: 'Your family is alerted instantly', desc: 'Every member of your emergency circle gets a WhatsApp, SMS and email alert simultaneously — within seconds.' },
  { icon: MapPin, title: 'Your live location is shared', desc: 'Your exact GPS coordinates are sent to your family circle and update in real time so they can find you.' },
  { icon: FileText, title: 'Your medical profile is sent', desc: 'Blood type, allergies, medications and conditions are automatically shared with your contacts and first responders.' },
  { icon: Phone, title: 'A conference bridge opens', desc: 'Your family can join a live call together to coordinate the response — no confusion, everyone connected.' },
  { icon: Headphones, title: 'Instant callback arranged', desc: 'If no one responds within 60 seconds, a real person calls you back to confirm you are safe.' },
];

function SOSFlowSection() {
  return (
    <section className="py-20 bg-white">
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

// ── Section 7: CTA ──────────────────────────────────────────
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
      <IncludedSection />
      <FeaturesSection />
      <SOSFlowSection />
      <CTASection />
      <Footer />
    </div>
  );
}
