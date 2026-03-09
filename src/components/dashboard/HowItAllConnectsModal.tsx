import React, { useEffect } from 'react';
import {
  Bot,
  Shield,
  Users,
  Phone,
  Bluetooth,
  Sparkles,
  MapPin,
  ArrowRight,
  User,
  Smartphone,
  Mic,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HowItAllConnectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItAllConnectsModal: React.FC<HowItAllConnectsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const responseSteps = [
    { num: 1, label: 'CLARA\nActivates', bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-600' },
    { num: 2, label: 'Family\nAlerted', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-600' },
    { num: 3, label: 'GPS\nShared', bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-600' },
    { num: 4, label: 'Medical\nProfile Sent', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-600' },
    { num: 5, label: 'Conference\nBridge', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-600' },
    { num: 6, label: 'Instant\nCallback', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-600' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container — full screen, white */}
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10
            w-9 h-9 rounded-full
            bg-slate-100 border border-slate-200
            flex items-center justify-center
            text-slate-500 hover:bg-red-50 hover:text-red-500
            hover:border-red-200 transition-all duration-200
          "
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ─── SECTION 1 — HEADER ─── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 border-b border-slate-200 bg-white">
          <div className="flex items-center pr-10">
            <div className="w-1 h-8 bg-red-500 rounded-full shrink-0 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">How It All Connects</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Your complete protection ecosystem — every feature working together.
              </p>
            </div>
          </div>
        </div>

        {/* ─── SECTION 2 — THREE WAYS TO CALL FOR HELP ─── */}
        <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 bg-white border-b border-slate-100">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-3">
            THREE WAYS TO CALL FOR HELP
          </p>
          {/* Mobile: stacked / Tablet+: 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4">
              <Smartphone className="h-5 w-5 text-red-500" />
              <p className="text-sm font-semibold text-slate-900 mt-1.5">App SOS Button</p>
              <p className="text-xs text-slate-600 mt-1">One tap in the app</p>
              <span className="inline-block mt-2 text-[9px] bg-red-100 text-red-600 rounded px-2 py-0.5">
                ALWAYS AVAILABLE
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 md:p-4">
              <Bluetooth className="h-5 w-5 text-blue-500" />
              <p className="text-sm font-semibold text-slate-900 mt-1.5">Bluetooth Pendant</p>
              <p className="text-xs text-slate-600 mt-1">Press button, phone activates</p>
              <span className="inline-block mt-2 text-[9px] bg-blue-100 text-blue-600 rounded px-2 py-0.5">
                BLUETOOTH RANGE
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 md:p-4">
              <Mic className="h-5 w-5 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900 mt-1.5">Voice Activation</p>
              <p className="text-xs text-slate-600 mt-1 italic">"CLARA, help me"</p>
              <span className="inline-block mt-2 text-[9px] bg-emerald-100 text-emerald-600 rounded px-2 py-0.5">
                HANDS FREE
              </span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 3 — RESPONSE CHAIN ─── */}
        <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 bg-slate-50 border-b border-slate-200">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-3">
            WHAT HAPPENS IN THE NEXT 30 SECONDS
          </p>
          {/* Mobile: horizontal scroll / Tablet+: full row */}
          <div className="flex items-start overflow-x-auto md:overflow-visible md:justify-between gap-1 md:gap-0 pb-1 md:pb-0">
            {responseSteps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center text-center flex-shrink-0 min-w-[60px] md:min-w-0 md:flex-1">
                  <div className={`w-8 h-8 rounded-full border-2 ${step.bg} ${step.border} flex items-center justify-center mx-auto`}>
                    <span className={`text-xs font-bold ${step.text}`}>{step.num}</span>
                  </div>
                  <span className="text-[10px] text-slate-600 text-center leading-tight mt-1.5 whitespace-pre-line">
                    {step.label}
                  </span>
                </div>
                {i < responseSteps.length - 1 && (
                  <span className="text-slate-300 text-sm self-center pb-4 shrink-0">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ─── SECTION 4 — ECOSYSTEM GRID ─── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 md:px-6 md:py-4 bg-white">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-3">
            YOUR FULL ECOSYSTEM
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* CLARA AI */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 rounded-xl p-4">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">CLARA AI</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  24/7 AI safety companion. Answers every SOS, assesses situations, coordinates your response.
                </p>
                <span className="inline-block mt-2 text-[9px] bg-red-100 text-red-600 rounded px-2 py-0.5">
                  CORE FEATURE
                </span>
              </div>
              {/* Add-Ons */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-xl p-4">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">Add-Ons</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Daily Wellbeing checks, Medication Reminders, and Family Links to extend your protection.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Wellbeing</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Medication</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Family Links</span>
                </div>
              </div>
            </div>

            {/* CENTRE COLUMN */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Member node */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center flex-1">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border border-red-300 animate-ping opacity-30" />
                  <div className="absolute -inset-2 rounded-full border border-red-200 animate-ping opacity-20" style={{ animationDelay: '1s' }} />
                  <div className="relative w-14 h-14 rounded-full bg-white border-2 border-red-500 shadow shadow-red-200 flex items-center justify-center mx-auto mt-1">
                    <User className="h-7 w-7 text-red-500" />
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-3">You — The Member</p>
                <p className="text-xs font-mono text-red-500 mt-0.5">€9.99/mo</p>
                <span className="inline-block bg-red-500 text-white text-[9px] rounded-full px-3 py-1 mt-1">
                  7 days free
                </span>
              </div>
              {/* SOS Pendant */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-blue-500 rounded-xl p-4">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Bluetooth className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">SOS Pendant</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Pairs with your phone via Bluetooth to instantly activate CLARA and trigger your full emergency response.
                </p>
                <span className="inline-block mt-2 text-[9px] bg-blue-100 text-blue-600 rounded px-2 py-0.5">
                  BLUETOOTH
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-col gap-3 md:gap-4">
              {/* Family Network */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-cyan-500 rounded-xl p-4">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-cyan-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">Family Network</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  Unlimited contacts coordinated simultaneously. Live GPS, calls, alerts and wellbeing reports.
                </p>
                <span className="inline-block mt-2 text-[9px] bg-cyan-100 text-cyan-600 rounded px-2 py-0.5">
                  1 LINK FREE
                </span>
              </div>
              {/* Emergency Response */}
              <div className="bg-white border border-slate-200 border-l-4 border-l-orange-500 rounded-xl p-4">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-slate-900 mt-2">Emergency Response</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  SOS triggers instant response — contacts called, GPS shared, medical profile sent, ETA shown.
                </p>
                <span className="inline-block mt-2 text-[9px] bg-orange-100 text-orange-600 rounded px-2 py-0.5">
                  ALWAYS ON
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECTION 5 — FOOTER ─── */}
        <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 bg-white">
          {/* CLARA Complete banner */}
          <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <Sparkles className="h-4 w-4 text-red-500 shrink-0" />
            <span className="text-sm font-bold text-slate-900 shrink-0">CLARA Complete</span>
            <span className="text-xs text-slate-600 flex-1">
              Everything included — base plan plus all add-ons
            </span>
            <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-3 py-1 shrink-0">
              BEST VALUE
            </span>
          </div>

          {/* Legend + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-3">
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-slate-500">Member</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-400" /><span className="text-[10px] text-slate-500">Core</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-[10px] text-slate-500">Add-On</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[10px] text-slate-500">Family</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] text-slate-500">Emergency</span></div>
            </div>
            <Link
              to="/register?trial=true"
              className="
                inline-flex items-center gap-2
                bg-red-500 hover:bg-red-600 text-white text-xs font-semibold
                rounded-full px-5 py-2
                transition-all duration-200
                hover:shadow-md hover:shadow-red-200 hover:-translate-y-0.5
                w-full sm:w-auto justify-center
              "
            >
              <Shield className="h-3 w-3" />
              Start Free Trial
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItAllConnectsModal;
