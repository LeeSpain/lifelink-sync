import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Smartphone, Radio, Mic, MessageSquare, MapPin, FileText, Phone, AlertTriangle, Shield } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const triggerCards = [
  { icon: Smartphone, label: 'App SOS Button', sub: 'One tap', color: 'bg-red-500/20 text-red-400' },
  { icon: Radio, label: 'Bluetooth Pendant', sub: 'Press anywhere', color: 'bg-blue-500/20 text-blue-400' },
  { icon: Mic, label: 'Say: CLARA, help me', sub: 'Hands-free', color: 'bg-purple-500/20 text-purple-400' },
];

const responseItems = [
  { n: 1, title: 'Family alerted instantly', sub: 'WhatsApp + SMS to all contacts' },
  { n: 2, title: 'Location shared live', sub: 'GPS coordinates sent' },
  { n: 3, title: 'Medical profile sent', sub: 'To emergency responders' },
  { n: 4, title: 'Conference bridge opens', sub: 'Family coordinating live' },
  { n: 5, title: 'Callback arranged', sub: 'Real person calls back' },
];

const chips = ['CLARA AI', 'Family Circle', 'SOS Pendant', 'Daily Wellbeing', 'Medication', 'Tablet', 'Conference Bridge', 'GPS Live'];

const dashStyle = `
@keyframes hiw-dash { to { stroke-dashoffset: -16; } }
@keyframes hiw-fade { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes hiw-ping { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.1); opacity: 0.3; } }
`;

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{dashStyle}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: 'rgba(4,8,20,0.95)', backdropFilter: 'blur(16px)' }} />

        {/* Modal */}
        <div
          className="relative w-full max-w-[900px] max-h-[88vh] flex flex-col overflow-hidden"
          style={{
            background: '#070f1e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20,
            boxShadow: '0 0 0 1px rgba(239,68,68,0.15), 0 40px 100px rgba(0,0,0,0.8)',
            animation: 'hiw-fade 200ms ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ──────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-semibold text-white">LifeLink Sync</span>
              <span className="text-white/20">·</span>
              <span className="text-gray-400">How It All Works</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>

          {/* ── Main Content ────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Desktop: 3 columns, Mobile: stacked */}
            <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-0 items-center min-h-[380px]">

              {/* COL A — Triggers */}
              <div style={{ animation: 'hiw-fade 300ms ease' }}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">You need help</p>
                <p className="text-[11px] text-gray-500 mb-4">3 ways to call CLARA</p>
                <div className="space-y-2">
                  {triggerCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-[#0d1627] border border-white/[0.06] px-3 py-2.5 hover:border-l-red-500 hover:border-l-2 transition-all group">
                        <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white">{c.label}</p>
                          <p className="text-[10px] text-gray-500">{c.sub}</p>
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
                    <path d="M0,40 Q30,40 58,100" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite' }} />
                    <path d="M0,100 L58,100" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.3s' }} />
                    <path d="M0,160 Q30,160 58,100" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.6s' }} />
                  </svg>

                  {/* CLARA Orb */}
                  <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 120, height: 120 }}>
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/20" style={{ animation: 'hiw-ping 2.5s ease-in-out infinite' }} />
                    <div className="absolute rounded-full border-2 border-red-500/30" style={{ width: 90, height: 90, top: 15, left: 15 }} />
                    <div
                      className="relative rounded-full flex flex-col items-center justify-center"
                      style={{ width: 70, height: 70, background: 'radial-gradient(circle, #1a0505 0%, #2d0808 100%)', border: '2px solid #ef4444', boxShadow: '0 0 30px rgba(239,68,68,0.25)' }}
                    >
                      <span className="text-[13px] font-bold text-white">CLARA</span>
                      <span className="text-[10px] text-red-400 tracking-widest">AI</span>
                    </div>
                  </div>

                  {/* Right lines splitting */}
                  <svg width="60" height="200" className="overflow-visible flex-shrink-0">
                    <path d="M2,100 Q30,40 60,20" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite' }} />
                    <path d="M2,100 Q30,60 60,55" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.15s' }} />
                    <path d="M2,100 L60,100" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.3s' }} />
                    <path d="M2,100 Q30,140 60,145" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.45s' }} />
                    <path d="M2,100 Q30,160 60,180" fill="none" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: 'hiw-dash 1.5s linear infinite 0.6s' }} />
                  </svg>
                </div>
              </div>

              {/* COL C — Response */}
              <div style={{ animation: 'hiw-fade 300ms ease 300ms both' }}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Help is on the way</p>
                <p className="text-[11px] text-gray-500 mb-4">In the next 30 seconds</p>
                <div className="space-y-1.5">
                  {responseItems.map((item) => (
                    <div key={item.n} className="flex items-start gap-2.5 py-1.5 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">{item.n}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{item.title}</p>
                        <p className="text-[10px] text-gray-500">{item.sub}</p>
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
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">3 ways to call CLARA</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {triggerCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                      <div key={i} className="flex-shrink-0 w-[140px] rounded-lg bg-[#0d1627] border border-white/[0.06] p-3 text-center">
                        <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center mx-auto mb-2`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-[11px] font-medium text-white">{c.label}</p>
                        <p className="text-[10px] text-gray-500">{c.sub}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CLARA orb */}
              <div className="flex justify-center py-2">
                <div className="relative" style={{ width: 80, height: 80 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/20" style={{ animation: 'hiw-ping 2.5s ease-in-out infinite' }} />
                  <div className="absolute inset-2 rounded-full" style={{ background: 'radial-gradient(circle, #1a0505 0%, #2d0808 100%)', border: '2px solid #ef4444' }}>
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="text-[11px] font-bold text-white">CLARA</span>
                      <span className="text-[9px] text-red-400 tracking-widest">AI</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 text-center -mt-3">Responds in seconds</p>

              {/* Response items */}
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Help arrives in 30 seconds</p>
                <div className="space-y-2">
                  {responseItems.map((item) => (
                    <div key={item.n} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-white">{item.n}</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{item.title}</p>
                        <p className="text-[10px] text-gray-500">{item.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 flex-shrink-0 gap-4">
            <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 scrollbar-hide">
              {chips.map((c) => (
                <span key={c} className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[9px] text-gray-500 whitespace-nowrap">
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
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItWorksModal;
