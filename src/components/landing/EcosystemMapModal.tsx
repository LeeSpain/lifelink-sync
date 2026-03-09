import React, { useState, useEffect } from 'react';
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
  X,
  Zap,
  Bell,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as DialogPrimitive from '@radix-ui/react-dialog';

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
@keyframes eco-fullscreen-in {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes eco-fullscreen-out {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(16px); }
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
  const [isOpen, setIsOpen] = useState(false);

  /* Body scroll lock */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
    red:     { circle: 'bg-red-100 border-red-200',       text: 'text-red-600' },
    orange:  { circle: 'bg-orange-100 border-orange-200', text: 'text-orange-600' },
    cyan:    { circle: 'bg-cyan-100 border-cyan-200',     text: 'text-cyan-600' },
    purple:  { circle: 'bg-purple-100 border-purple-200', text: 'text-purple-600' },
    blue:    { circle: 'bg-blue-100 border-blue-200',     text: 'text-blue-600' },
    emerald: { circle: 'bg-emerald-100 border-emerald-200', text: 'text-emerald-600' },
  };

  /* Ecosystem cards data (shared for tablet 2-col and mobile 1-col) */
  const ecosystemCards = [
    { icon: Bot, title: t('ecosystem.claraTitle'), desc: t('ecosystem.claraDesc'), badge: t('ecosystem.claraBadge'), borderColor: 'border-red-500', iconBg: 'bg-red-50', iconColor: 'text-red-500', badgeBg: 'bg-red-100', badgeColor: 'text-red-600' },
    { icon: Users, title: t('ecosystem.familyTitle'), desc: t('ecosystem.familyDesc'), badge: t('ecosystem.familyBadge'), borderColor: 'border-cyan-500', iconBg: 'bg-cyan-50', iconColor: 'text-cyan-500', badgeBg: 'bg-cyan-100', badgeColor: 'text-cyan-600' },
    { icon: ShieldAlert, title: t('ecosystem.emergencyTitle'), desc: t('ecosystem.emergencyDesc'), badge: t('ecosystem.emergencyBadge'), borderColor: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500', badgeBg: 'bg-orange-100', badgeColor: 'text-orange-600' },
    { icon: Bluetooth, title: t('ecosystem.pendantTitle'), desc: t('ecosystem.pendantDesc'), badge: t('ecosystem.pendantBadge'), borderColor: 'border-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-500', badgeBg: 'bg-blue-100', badgeColor: 'text-blue-600' },
    { icon: Sparkles, title: t('ecosystem.addonsTitle'), desc: t('ecosystem.addonsDesc'), badge: '', borderColor: 'border-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-500', badgeBg: '', badgeColor: '' },
  ];

  return (
    <>
      <style>{animationStyles}</style>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

        <DialogContent
          className="
            inset-0 z-[70] w-screen h-screen max-w-none
            translate-x-0 translate-y-0
            bg-white p-0 gap-0 border-0 rounded-none shadow-none
            flex flex-col overflow-hidden
            data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100
            data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0
            data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0
            [&>button:last-child]:hidden
          "
          style={{
            animation: isOpen ? 'eco-fullscreen-in 300ms ease-out' : undefined,
          }}
        >

          {/* ═══════════════════════════════════════════════════════ */}
          {/* CUSTOM CLOSE BUTTON                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <DialogPrimitive.Close
            className="
              absolute top-4 right-4 z-10
              bg-slate-100 border border-slate-200 rounded-full
              w-9 h-9 flex items-center justify-center
              text-slate-500 hover:bg-red-50 hover:text-red-500
              hover:border-red-200 transition-all duration-200
            "
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 1 — HEADER                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 pt-4 pb-3 md:px-5 md:pt-5 xl:px-6 xl:pt-6 border-b border-slate-200">
            <div className="flex items-center gap-2.5 pr-10">
              <div className="w-1 h-8 rounded-full bg-red-500 shrink-0" />
              <div>
                <h2 className="text-lg md:text-xl xl:text-2xl font-bold text-slate-900 tracking-tight">
                  {t('ecosystem.title')}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5 leading-tight">
                  {t('ecosystem.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 2 — THREE WAYS TO CALL FOR HELP                 */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 py-3 md:px-5 md:py-4 xl:px-6">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
              {t('ecosystem.triggerSectionLabel')}
            </p>
            {/* Mobile: stacked */}
            <div className="flex flex-col gap-2 md:hidden">
              {/* App SOS */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3"
                style={{ animation: 'eco-fade-up 0.4s ease-out 60ms both' }}>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger1Title')}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{t('ecosystem.trigger1Desc')}</p>
                    <span className="inline-block mt-1.5 text-[9px] bg-red-100 text-red-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {t('ecosystem.trigger1Badge')}
                    </span>
                  </div>
                </div>
              </div>
              {/* Bluetooth Pendant */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"
                style={{ animation: 'eco-fade-up 0.4s ease-out 120ms both' }}>
                <div className="flex items-start gap-3">
                  <Bluetooth className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger2Title')}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{t('ecosystem.trigger2Desc')}</p>
                    <span className="inline-block mt-1.5 text-[9px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {t('ecosystem.trigger2Badge')}
                    </span>
                  </div>
                </div>
              </div>
              {/* Voice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"
                style={{ animation: 'eco-fade-up 0.4s ease-out 180ms both' }}>
                <div className="flex items-start gap-3">
                  <Mic className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger3Title')}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-tight italic">{t('ecosystem.trigger3Desc')}</p>
                    <span className="inline-block mt-1.5 text-[9px] bg-emerald-100 text-emerald-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {t('ecosystem.trigger3Badge')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Tablet + Desktop: 3-column row */}
            <div className="hidden md:grid md:grid-cols-3 gap-3 xl:gap-4">
              {/* App SOS */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 xl:p-5"
                style={{ animation: 'eco-fade-up 0.4s ease-out 60ms both' }}>
                <Smartphone className="h-4 w-4 text-red-500 mb-1" />
                <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger1Title')}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{t('ecosystem.trigger1Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-red-100 text-red-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger1Badge')}
                </span>
              </div>
              {/* Bluetooth Pendant */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 xl:p-5"
                style={{ animation: 'eco-fade-up 0.4s ease-out 120ms both' }}>
                <Bluetooth className="h-4 w-4 text-blue-500 mb-1" />
                <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger2Title')}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">{t('ecosystem.trigger2Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger2Badge')}
                </span>
              </div>
              {/* Voice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 xl:p-5"
                style={{ animation: 'eco-fade-up 0.4s ease-out 180ms both' }}>
                <Mic className="h-4 w-4 text-emerald-500 mb-1" />
                <p className="text-xs font-semibold text-slate-900 leading-tight">{t('ecosystem.trigger3Title')}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight italic">{t('ecosystem.trigger3Desc')}</p>
                <span className="inline-block mt-1.5 text-[9px] bg-emerald-100 text-emerald-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                  {t('ecosystem.trigger3Badge')}
                </span>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 3 — RESPONSE CHAIN                              */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 py-3 md:px-5 md:py-4 xl:px-6 bg-slate-50 border-y border-slate-200">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
              {t('ecosystem.responseSectionLabel')}
            </p>
            {/* Mobile: horizontal scroll */}
            <div className="flex items-start gap-1 overflow-x-auto pb-1 sm:hidden">
              {steps.map((step, i) => {
                const sc = stepColors[step.color];
                return (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center min-w-[72px] shrink-0">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${sc.circle}`}>
                        <step.icon className={`h-2.5 w-2.5 ${sc.text}`} />
                      </div>
                      <span className={`text-[9px] ${sc.text} font-bold mt-0.5`}>{i + 1}</span>
                      <span className="text-[8px] text-slate-500 text-center leading-tight whitespace-pre-line">
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-300 mt-1.5 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Tablet + Desktop: full row */}
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
                      <span className="text-[9px] text-slate-500 text-center leading-tight mt-0.5 whitespace-pre-line">
                        {step.label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-slate-300 mt-2 shrink-0 mx-0.5" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 4 — ECOSYSTEM GRID (flex-1, scrollable)         */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-1 min-h-0 px-4 py-3 md:px-5 md:py-4 xl:px-6 overflow-y-auto">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
              {t('ecosystem.ecosystemSectionLabel')}
            </p>

            {/* Desktop 3-col nested layout (xl+) */}
            <div className="hidden xl:grid xl:grid-cols-3 gap-4 h-[calc(100%-24px)]">

              {/* Left col — CLARA AI + Add-Ons */}
              <div className="grid grid-rows-2 gap-4">
                {/* CLARA AI */}
                <div className="border-l-4 border-red-500 bg-white border border-slate-200 rounded-xl p-3 flex flex-col shadow-sm"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 60ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50">
                      <Bot className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{t('ecosystem.claraTitle')}</p>
                      <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.claraDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-red-100 text-red-600 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.claraBadge')}
                  </span>
                </div>
                {/* Add-Ons */}
                <div className="border-l-4 border-amber-500 bg-white border border-slate-200 rounded-xl p-3 flex flex-col shadow-sm"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 120ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{t('ecosystem.addonsTitle')}</p>
                      <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.addonsDesc')}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-auto pt-2">
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 whitespace-nowrap">Wellbeing</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 whitespace-nowrap">Medication</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 whitespace-nowrap">Family</span>
                  </div>
                </div>
              </div>

              {/* Centre col — Member + Pendant */}
              <div className="flex flex-col gap-4">
                {/* Member node */}
                <div className="flex-1 bg-slate-50 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-200"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}>
                  <div className="relative">
                    <div
                      className="absolute -inset-2 rounded-full border border-red-300 pointer-events-none"
                      style={{ animation: 'eco-radar 3s ease-out infinite' }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute -inset-2 rounded-full border border-red-300 pointer-events-none"
                      style={{ animation: 'eco-radar 3s ease-out 1.5s infinite' }}
                      aria-hidden="true"
                    />
                    <div
                      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white border-2 border-red-500"
                      style={{
                        animation: 'eco-breathe 3s ease-in-out infinite',
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <User className="h-7 w-7 text-red-500" />
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-2">{t('ecosystem.memberLabel')}</p>
                  <p className="text-xs font-mono text-red-500">{t('ecosystem.memberPrice')}</p>
                  <Badge className="bg-red-500 text-white border-0 text-[9px] font-medium rounded-full px-2 py-0.5 mt-1">
                    {t('ecosystem.memberTrial')}
                  </Badge>
                </div>
                {/* SOS Pendant */}
                <div className="flex-shrink-0 border-l-4 border-blue-500 bg-white border border-slate-200 rounded-xl p-3 shadow-sm"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 180ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Bluetooth className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{t('ecosystem.pendantTitle')}</p>
                      <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.pendantDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-2 text-[9px] bg-blue-100 text-blue-600 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {t('ecosystem.pendantBadge')}
                  </span>
                </div>
              </div>

              {/* Right col — Family + Emergency */}
              <div className="grid grid-rows-2 gap-4">
                {/* Family Network */}
                <div className="border-l-4 border-cyan-500 bg-white border border-slate-200 rounded-xl p-3 flex flex-col shadow-sm"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 100ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-50">
                      <Users className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{t('ecosystem.familyTitle')}</p>
                      <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.familyDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-cyan-100 text-cyan-600 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.familyBadge')}
                  </span>
                </div>
                {/* Emergency Response */}
                <div className="border-l-4 border-orange-500 bg-white border border-slate-200 rounded-xl p-3 flex flex-col shadow-sm"
                  style={{ animation: 'eco-fade-up 0.4s ease-out 160ms both' }}>
                  <div className="flex items-start gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                      <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{t('ecosystem.emergencyTitle')}</p>
                      <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{t('ecosystem.emergencyDesc')}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-auto pt-2 text-[9px] bg-orange-100 text-orange-600 rounded px-1.5 py-0.5 whitespace-nowrap w-fit">
                    {t('ecosystem.emergencyBadge')}
                  </span>
                </div>
              </div>
            </div>

            {/* Tablet 2-col + Mobile 1-col (below xl) */}
            <div className="xl:hidden">
              {/* Member — centered, spans full width */}
              <div className="flex flex-col items-center py-3 mb-3" style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}>
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full border border-red-300 pointer-events-none"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }} aria-hidden="true" />
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-red-500"
                    style={{ animation: 'eco-breathe 3s ease-in-out infinite', boxShadow: '0 0 16px rgba(239,68,68,0.15)' }}>
                    <User className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1.5">{t('ecosystem.memberLabel')}</p>
                <p className="text-xs font-mono text-red-500">{t('ecosystem.memberPrice')}</p>
                <Badge className="bg-red-500 text-white border-0 text-[9px] rounded-full px-2 py-0.5 mt-1">{t('ecosystem.memberTrial')}</Badge>
              </div>
              {/* Cards grid: 1-col mobile, 2-col tablet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {ecosystemCards.map((card, i) => (
                  <div key={i} className={`border-l-4 ${card.borderColor} bg-white border border-slate-200 rounded-xl p-3 shadow-sm`}
                    style={{ animation: `eco-fade-up 0.4s ease-out ${(i + 1) * 60}ms both` }}>
                    <div className="flex items-start gap-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                        <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-tight">{card.title}</p>
                        <p className="text-xs text-slate-600 leading-snug mt-0.5 line-clamp-2">{card.desc}</p>
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
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION 5 — FOOTER                                      */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 py-3 md:px-5 md:py-4 xl:px-6 border-t border-slate-200">
            {/* CLARA Complete banner */}
            <div className="rounded-xl px-3 py-2 flex items-center gap-3 border border-red-200 bg-red-50/50 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.06) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'eco-shimmer 2s linear infinite',
                }}
                aria-hidden="true"
              />
              <Sparkles className="h-4 w-4 text-red-500 shrink-0 relative" />
              <span className="text-sm font-bold text-slate-900 shrink-0 relative">{t('ecosystem.claraCompleteTitle')}</span>
              <span className="text-xs text-slate-600 truncate flex-1 relative hidden sm:inline">{t('ecosystem.claraCompleteDesc')}</span>
              <Badge className="bg-red-500 text-white border-0 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 relative">
                {t('ecosystem.claraCompleteBadge')}
              </Badge>
            </div>

            {/* Legend + CTA row */}
            {/* Mobile: stack legend above CTA */}
            <div className="flex flex-col gap-2 mt-2 sm:hidden">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /><span>{t('ecosystem.legendMember')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-400" /><span>{t('ecosystem.legendCore')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" /><span>{t('ecosystem.legendAddon')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-cyan-500" /><span>{t('ecosystem.legendFamily')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-500" /><span>{t('ecosystem.legendEmergency')}</span></div>
              </div>
              <Button
                asChild
                className="
                  bg-red-500 text-white hover:bg-red-600
                  rounded-full px-4 py-2 h-auto text-xs font-semibold w-full
                  transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20
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
            {/* Tablet + Desktop: legend left, CTA right */}
            <div className="hidden sm:flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /><span>{t('ecosystem.legendMember')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-slate-400" /><span>{t('ecosystem.legendCore')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-500" /><span>{t('ecosystem.legendAddon')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-cyan-500" /><span>{t('ecosystem.legendFamily')}</span></div>
                <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-orange-500" /><span>{t('ecosystem.legendEmergency')}</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 hidden lg:inline whitespace-nowrap">
                  {t('ecosystem.noCardNote')}
                </span>
                <Button
                  asChild
                  className="
                    bg-red-500 text-white hover:bg-red-600
                    rounded-full px-4 py-2 h-auto text-xs font-semibold
                    transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-px
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
