import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Smartphone, Radio, Mic, Shield } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dashStyle = `
@keyframes hiw-dash { to { stroke-dashoffset: -16; } }
@keyframes hiw-fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes hiw-ping { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 0.3; } }
`;

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const triggerCards = [
    { icon: Smartphone, label: t('howItWorksModal.trigger1Label'), sub: t('howItWorksModal.trigger1Sub'), color: 'bg-red-100 text-red-500' },
    { icon: Radio, label: t('howItWorksModal.trigger2Label'), sub: t('howItWorksModal.trigger2Sub'), color: 'bg-blue-100 text-blue-500' },
    { icon: Mic, label: t('howItWorksModal.trigger3Label'), sub: t('howItWorksModal.trigger3Sub'), color: 'bg-purple-100 text-purple-500' },
  ];

  const responseItems = [
    { n: 1, title: t('howItWorksModal.response1Title'), sub: t('howItWorksModal.response1Sub') },
    { n: 2, title: t('howItWorksModal.response2Title'), sub: t('howItWorksModal.response2Sub') },
    { n: 3, title: t('howItWorksModal.response3Title'), sub: t('howItWorksModal.response3Sub') },
    { n: 4, title: t('howItWorksModal.response4Title'), sub: t('howItWorksModal.response4Sub') },
    { n: 5, title: t('howItWorksModal.response5Title'), sub: t('howItWorksModal.response5Sub') },
  ];

  const chips = [
    t('howItWorksModal.chipClaraAI'),
    t('howItWorksModal.chipFamilyCircle'),
    t('howItWorksModal.chipSOSPendant'),
    t('howItWorksModal.chipDailyWellbeing'),
    t('howItWorksModal.chipMedication'),
    t('howItWorksModal.chipTablet'),
    t('howItWorksModal.chipConferenceBridge'),
    t('howItWorksModal.chipGPSLive'),
  ];

  return (
    <>
      <style>{dashStyle}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          className="relative w-full max-w-[900px] max-h-[88vh] flex flex-col overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-2xl"
          style={{ animation: 'hiw-fade 200ms ease' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-[hsl(215,25%,27%)]">LifeLink Sync</span>
              <span className="text-gray-300">&middot;</span>
              <span className="text-gray-500">{t('howItWorksModal.headerTitle')}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>

          {/* ── Main Content ────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Desktop: 3 columns, Mobile: stacked */}
            <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-0 items-center min-h-[380px]">

              {/* COL A — Triggers */}
              <div style={{ animation: 'hiw-fade 300ms ease' }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('howItWorksModal.youNeedHelp')}</p>
                <p className="text-[11px] text-gray-400 mb-4">{t('howItWorksModal.threeWays')}</p>
                <div className="space-y-2">
                  {triggerCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 hover:border-red-300 hover:bg-red-50 transition-all group">
                        <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[hsl(215,25%,27%)]">{c.label}</p>
                          <p className="text-[10px] text-gray-400">{c.sub}</p>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Centre — Lines + CLARA Orb */}
              <div className="flex items-center justify-center px-2" style={{ animation: 'hiw-fade 300ms ease 150ms both' }}>
                <div className="flex items-center gap-0">
                  {/* Left lines merging */}
                  <svg width="60" height="200" className="overflow-visible flex-shrink-0">
                    <path d="M0,40 Q30,40 58,100" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite' }} />
                    <path d="M0,100 L58,100" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.3s' }} />
                    <path d="M0,160 Q30,160 58,100" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.6s' }} />
                  </svg>

                  {/* CLARA Orb */}
                  <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 120, height: 120 }}>
                    <div className="absolute inset-0 rounded-full border-2 border-red-200" style={{ animation: 'hiw-ping 2.5s ease-in-out infinite' }} />
                    <div className="absolute rounded-full border-2 border-red-200" style={{ width: 90, height: 90, top: 15, left: 15 }} />
                    <div
                      className="relative rounded-full flex flex-col items-center justify-center bg-red-50 border-2 border-red-500"
                      style={{ width: 70, height: 70, boxShadow: '0 0 20px rgba(239,68,68,0.15)' }}
                    >
                      <span className="text-[13px] font-bold text-red-600">CLARA</span>
                      <span className="text-[10px] text-red-400 tracking-widest">AI</span>
                    </div>
                  </div>

                  {/* Right lines splitting */}
                  <svg width="60" height="200" className="overflow-visible flex-shrink-0">
                    <path d="M2,100 Q30,40 60,20" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite' }} />
                    <path d="M2,100 Q30,60 60,55" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.15s' }} />
                    <path d="M2,100 L60,100" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.3s' }} />
                    <path d="M2,100 Q30,140 60,145" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.45s' }} />
                    <path d="M2,100 Q30,160 60,180" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.6s' }} />
                  </svg>
                </div>
              </div>

              {/* COL C — Response */}
              <div style={{ animation: 'hiw-fade 300ms ease 300ms both' }}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('howItWorksModal.helpOnTheWay')}</p>
                <p className="text-[11px] text-gray-400 mb-4">{t('howItWorksModal.inThirtySeconds')}</p>
                <div className="space-y-1.5">
                  {responseItems.map((item) => (
                    <div key={item.n} className="flex items-start gap-2.5 py-1.5 px-2 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">{item.n}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[hsl(215,25%,27%)]">{item.title}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Mobile Layout ─────────────────────── */}
            <div className="md:hidden space-y-6">
              {/* Triggers */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('howItWorksModal.threeWays')}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {triggerCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="flex-shrink-0 w-[140px] rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                        <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-medium text-[hsl(215,25%,27%)]">{c.label}</p>
                        <p className="text-[10px] text-gray-400">{c.sub}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CLARA orb */}
              <div className="flex justify-center py-2">
                <div className="relative" style={{ width: 80, height: 80 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-red-200" style={{ animation: 'hiw-ping 2.5s ease-in-out infinite' }} />
                  <div className="absolute inset-2 rounded-full bg-red-50 border-2 border-red-500">
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-[11px] font-bold text-red-600">CLARA</span>
                      <span className="text-[9px] text-red-400 tracking-widest">AI</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center -mt-3">{t('howItWorksModal.respondsInSeconds')}</p>

              {/* Response items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('howItWorksModal.helpArrivesInThirty')}</p>
                <div className="space-y-2">
                  {responseItems.map((item) => (
                    <div key={item.n} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">{item.n}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[hsl(215,25%,27%)]">{item.title}</p>
                        <p className="text-[10px] text-gray-400">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 gap-4">
            <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
              {chips.map((c) => (
                <span key={c} className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[9px] text-gray-600 whitespace-nowrap">
                  {c}
                </span>
              ))}
            </div>
            <Link
              to="/register"
              onClick={onClose}
              className="flex-shrink-0 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Shield className="h-3.5 w-3.5" />
              {t('howItWorksModal.startFreeTrial')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorksModal;
