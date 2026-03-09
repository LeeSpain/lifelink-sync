import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Shield,
  Users,
  Phone,
  PhoneCall,
  Bluetooth,
  Sparkles,
  Heart,
  Pill,
  MapPin,
  ArrowRight,
  User,
  Smartphone,
  Mic,
  Zap,
  Bell,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/* ------------------------------------------------------------------ */
/*  CSS keyframe animations                                            */
/* ------------------------------------------------------------------ */
const animationStyles = `
@keyframes eco-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
@keyframes eco-radar {
  0% { transform: scale(1); opacity: 0.3; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes eco-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes eco-fade-up {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes eco-step-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface EcosystemMapModalProps {
  trigger?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */
const EcosystemMapModal: React.FC<EcosystemMapModalProps> = ({ trigger }) => {
  const { t } = useTranslation();

  const defaultTrigger = (
    <Button
      variant="outline"
      size="lg"
      className="border-primary text-primary hover:bg-primary/5"
    >
      <MapPin className="h-5 w-5 mr-2" />
      {t('ecosystem.triggerButton')}
    </Button>
  );

  /* Response chain steps */
  const steps = [
    { icon: Zap, label: t('ecosystem.step1'), color: 'red' },
    { icon: Bell, label: t('ecosystem.step2'), color: 'orange' },
    { icon: MapPin, label: t('ecosystem.step3'), color: 'cyan' },
    { icon: Heart, label: t('ecosystem.step4'), color: 'purple' },
    { icon: Phone, label: t('ecosystem.step5'), color: 'blue' },
    { icon: PhoneCall, label: t('ecosystem.step6'), color: 'emerald' },
  ];

  const stepColors: Record<string, { circle: string; text: string }> = {
    red:     { circle: 'bg-red-500/20 border-red-500/40',     text: 'text-red-400' },
    orange:  { circle: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-400' },
    cyan:    { circle: 'bg-cyan-500/20 border-cyan-500/40',    text: 'text-cyan-400' },
    purple:  { circle: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400' },
    blue:    { circle: 'bg-blue-500/20 border-blue-500/40',    text: 'text-blue-400' },
    emerald: { circle: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400' },
  };

  return (
    <>
      <style>{animationStyles}</style>

      <Dialog>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

        <DialogContent className="
          max-w-3xl w-[95vw] max-h-[90vh] p-0
          bg-slate-900 border border-slate-700/50 rounded-2xl
          flex flex-col overflow-hidden
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-[0.97] data-[state=open]:duration-[250ms]
        " style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 1 — HEADER                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-8 rounded-full bg-red-500 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t('ecosystem.title')}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                  {t('ecosystem.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 2 — THREE WAYS TO CALL FOR HELP                 */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-6 py-3">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">
              {t('ecosystem.triggerSectionLabel')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* App SOS */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2.5"
                style={{ animation: 'eco-fade-up 0.4s ease-out 60ms both' }}>
                <Smartphone className="h-4 w-4 text-red-400 mb-1" />
                <p className="text-xs font-semibold text-white leading-tight">{t('ecosystem.trigger1Title')}</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{t('ecosystem.trigger1Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-red-500/20 text-red-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger1Badge')}
                </span>
              </div>
              {/* Bluetooth Pendant */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 shadow shadow-blue-500/10"
                style={{ animation: 'eco-fade-up 0.4s ease-out 120ms both' }}>
                <Bluetooth className="h-4 w-4 text-blue-400 mb-1" />
                <p className="text-xs font-semibold text-white leading-tight">{t('ecosystem.trigger2Title')}</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{t('ecosystem.trigger2Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-blue-500/20 text-blue-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger2Badge')}
                </span>
              </div>
              {/* Voice */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5"
                style={{ animation: 'eco-fade-up 0.4s ease-out 180ms both' }}>
                <Mic className="h-4 w-4 text-emerald-400 mb-1" />
                <p className="text-xs font-semibold text-white leading-tight">{t('ecosystem.trigger3Title')}</p>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-tight italic">{t('ecosystem.trigger3Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger3Badge')}
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 3 — RESPONSE CHAIN                              */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-6 py-3 bg-slate-800/40 border-y border-slate-700/40">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">
              {t('ecosystem.responseSectionLabel')}
            </p>
            <div className="hidden sm:flex items-start justify-between">
              {steps.map((step, i) => {
                const sc = stepColors[step.color];
                return (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border ${sc.circle}`}
                        style={{ animation: `eco-step-pulse 2s ease-in-out ${i * 200}ms infinite` }}
                      >
                        <step.icon className={`h-3 w-3 ${sc.text}`} />
                      </div>
                      <span className={`text-[10px] ${sc.text} font-bold mt-1`}>{i + 1}</span>
                      <span className="text-[9px] text-slate-300 text-center leading-tight mt-0.5 whitespace-pre-line">
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-600 mt-2 shrink-0 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Mobile: 2-row grid */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
              {steps.map((step, i) => {
                const sc = stepColors[step.color];
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${sc.circle}`}>
                      <step.icon className={`h-2.5 w-2.5 ${sc.text}`} />
                    </div>
                    <span className={`text-[9px] ${sc.text} font-bold mt-0.5`}>{i + 1}</span>
                    <span className="text-[8px] text-slate-300 text-center leading-tight whitespace-pre-line">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 4 — ECOSYSTEM GRID (flex-1)                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-1 min-h-0 px-6 py-3 overflow-hidden">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-500 mb-2">
              {t('ecosystem.ecosystemSectionLabel')}
            </p>

            {/* Desktop/tablet 3-col grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-2.5 h-[calc(100%-24px)]">

              {/* Left col — CLARA AI + Add-Ons */}
              <div className="grid grid-rows-2 gap-2.5">
                {/* CLARA AI */}
                <div className="border-l-4 border-red-500 bg-slate-800/60 rounded-xl p-3 flex flex-col"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 60ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                      <Bot className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{t('ecosystem.claraTitle')}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.claraDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-red-500/20 text-red-300 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.claraBadge')}
                  </span>
                </div>
                {/* Add-Ons */}
                <div className="border-l-4 border-amber-500 bg-slate-800/60 rounded-xl p-3 flex flex-col"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 120ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{t('ecosystem.addonsTitle')}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.addonsDesc')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    <span className="text-[9px] bg-slate-700 text-slate-300 rounded px-1.5 py-0.5 whitespace-nowrap">Wellbeing</span>
                    <span className="text-[9px] bg-slate-700 text-slate-300 rounded px-1.5 py-0.5 whitespace-nowrap">Medication</span>
                    <span className="text-[9px] bg-slate-700 text-slate-300 rounded px-1.5 py-0.5 whitespace-nowrap">Family</span>
                  </div>
                </div>
              </div>

              {/* Centre col — Member + Pendant */}
              <div className="flex flex-col gap-2.5">
                {/* Member node */}
                <div className="flex-1 bg-slate-800/40 rounded-xl p-3 flex flex-col items-center justify-center"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}>
                  <div className="relative">
                    <div
                      className="absolute -inset-2 rounded-full border border-red-500/30 pointer-events-none"
                      style={{ animation: 'eco-radar 3s ease-out infinite' }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute -inset-2 rounded-full border border-red-500/30 pointer-events-none"
                      style={{ animation: 'eco-radar 3s ease-out 1.5s infinite' }}
                      aria-hidden="true"
                    />
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-red-500"
                      style={{
                        animation: 'eco-breathe 3s ease-in-out infinite',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <User className="h-7 w-7 text-red-500" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white mt-2">{t('ecosystem.memberLabel')}</p>
                  <p className="text-xs font-mono text-red-400">{t('ecosystem.memberPrice')}</p>
                  <Badge className="bg-red-500 text-white border-0 text-[9px] font-medium rounded-full px-2 py-0.5 mt-1">
                    {t('ecosystem.memberTrial')}
                  </Badge>
                </div>
                {/* SOS Pendant */}
                <div className="flex-shrink-0 border-l-4 border-blue-500 bg-slate-800/60 rounded-xl p-3"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 180ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15">
                      <Bluetooth className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{t('ecosystem.pendantTitle')}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.pendantDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-2 text-[9px] bg-blue-500/20 text-blue-300 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {t('ecosystem.pendantBadge')}
                  </span>
                </div>
              </div>

              {/* Right col — Family + Emergency */}
              <div className="grid grid-rows-2 gap-2.5">
                {/* Family Network */}
                <div className="border-l-4 border-cyan-500 bg-slate-800/60 rounded-xl p-3 flex flex-col"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 100ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15">
                      <Users className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{t('ecosystem.familyTitle')}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.familyDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-cyan-500/20 text-cyan-300 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.familyBadge')}
                  </span>
                </div>
                {/* Emergency Response */}
                <div className="border-l-4 border-orange-500 bg-slate-800/60 rounded-xl p-3 flex flex-col"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 160ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
                      <ShieldAlert className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{t('ecosystem.emergencyTitle')}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.emergencyDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-orange-500/20 text-orange-300 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.emergencyBadge')}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile single-col (scrollable) */}
            <div className="flex flex-col gap-2.5 md:hidden overflow-y-auto max-h-full pb-2">
              {/* Member */}
              <div className="flex flex-col items-center py-3" style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}>
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full border border-red-500/30 pointer-events-none"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }} aria-hidden="true" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-red-500"
                    style={{ animation: 'eco-breathe 3s ease-in-out infinite', boxShadow: '0 0 16px rgba(239,68,68,0.25)' }}>
                    <User className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <p className="text-sm font-bold text-white mt-1.5">{t('ecosystem.memberLabel')}</p>
                <p className="text-xs font-mono text-red-400">{t('ecosystem.memberPrice')}</p>
                <Badge className="bg-red-500 text-white border-0 text-[9px] rounded-full px-2 py-0.5 mt-1">{t('ecosystem.memberTrial')}</Badge>
              </div>
              {/* Cards */}
              {[
                { icon: Bot, title: t('ecosystem.claraTitle'), desc: t('ecosystem.claraDesc'), badge: t('ecosystem.claraBadge'), borderColor: 'border-red-500', iconBg: 'bg-red-500/15', iconColor: 'text-red-400', badgeBg: 'bg-red-500/20', badgeColor: 'text-red-300' },
                { icon: Users, title: t('ecosystem.familyTitle'), desc: t('ecosystem.familyDesc'), badge: t('ecosystem.familyBadge'), borderColor: 'border-cyan-500', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', badgeBg: 'bg-cyan-500/20', badgeColor: 'text-cyan-300' },
                { icon: ShieldAlert, title: t('ecosystem.emergencyTitle'), desc: t('ecosystem.emergencyDesc'), badge: t('ecosystem.emergencyBadge'), borderColor: 'border-orange-500', iconBg: 'bg-orange-500/15', iconColor: 'text-orange-400', badgeBg: 'bg-orange-500/20', badgeColor: 'text-orange-300' },
                { icon: Bluetooth, title: t('ecosystem.pendantTitle'), desc: t('ecosystem.pendantDesc'), badge: t('ecosystem.pendantBadge'), borderColor: 'border-blue-500', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', badgeBg: 'bg-blue-500/20', badgeColor: 'text-blue-300' },
                { icon: Sparkles, title: t('ecosystem.addonsTitle'), desc: t('ecosystem.addonsDesc'), badge: '', borderColor: 'border-amber-500', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', badgeBg: '', badgeColor: '' },
              ].map((card, i) => (
                <div key={i} className={`border-l-4 ${card.borderColor} bg-slate-800/60 rounded-xl p-3`}
                  style={{ animation: `eco-fade-up 0.4s ease-out ${(i + 1) * 60}ms both` }}>
                  <div className="flex items-start gap-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                      <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{card.title}</p>
                      <p className="text-xs text-slate-300 leading-snug mt-0.5 line-clamp-2">{card.desc}</p>
                    </div>
                  </div>
                  {card.badge && (
                    <span className={`inline-block mt-2 text-[9px] ${card.badgeBg} ${card.badgeColor} rounded px-1.5 py-0.5 whitespace-nowrap`}>
                      {card.badge}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 5 — FOOTER                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-6 py-3 border-t border-slate-700/60">
            {/* CLARA Complete banner */}
            <div className="rounded-xl px-3 py-2 flex items-center gap-3 border border-red-500/20 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.06) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'eco-shimmer 2s linear infinite',
                }}
                aria-hidden="true"
              />
              <Sparkles className="h-4 w-4 text-red-400 shrink-0 relative" />
              <span className="text-sm font-bold text-white shrink-0 relative">{t('ecosystem.claraCompleteTitle')}</span>
              <span className="text-xs text-slate-300 truncate flex-1 relative">{t('ecosystem.claraCompleteDesc')}</span>
              <Badge className="bg-red-500 text-white border-0 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 relative">
                {t('ecosystem.claraCompleteBadge')}
              </Badge>
            </div>

            {/* Legend + CTA row */}
            <div className="flex items-center justify-between mt-2">
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /><span>{t('ecosystem.legendMember')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-400" /><span>{t('ecosystem.legendCore')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" /><span>{t('ecosystem.legendAddon')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-cyan-500" /><span>{t('ecosystem.legendFamily')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-500" /><span>{t('ecosystem.legendEmergency')}</span></div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-slate-400 hidden lg:inline whitespace-nowrap">
                  {t('ecosystem.noCardNote')}
                </span>
                <Button
                  asChild
                  className="
                    bg-red-500 text-white hover:bg-red-600
                    rounded-full px-4 py-2 h-auto text-xs font-semibold
                    transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-px
                    whitespace-nowrap
                  "
                >
                  <Link to="/register?trial=true">
                    <Shield className="h-3 w-3 mr-1.5" />
                    {t('ecosystem.ctaButton')}
                    <ArrowRight className="h-3 w-3 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EcosystemMapModal;
