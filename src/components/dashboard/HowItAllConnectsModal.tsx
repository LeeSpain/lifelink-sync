import React, { useEffect, useRef } from 'react';
import {
  Bot,
  Smartphone,
  Bluetooth,
  Mic,
  Users,
  Sparkles,
  ShieldAlert,
  X,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const modalStyles = `
@keyframes eco-fadeSlideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes eco-ringPulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.3); opacity: 0; }
}
@keyframes eco-livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes eco-triggerEnter {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes eco-responseEnter {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}
`;

interface HowItAllConnectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Trigger colours (source) ── */
const triggerDotColors = [
  'rgba(244,63,94,0.6)',   // rose — App SOS
  'rgba(99,102,241,0.6)',  // indigo — Pendant
  'rgba(13,148,136,0.6)',  // teal — Voice
];

/* ── Response colours (destination) ── */
const responseDotColors = [
  'rgba(249,115,22,0.6)',  // orange — Family
  'rgba(6,182,212,0.6)',   // cyan — GPS
  'rgba(139,92,246,0.6)',  // violet — Medical
  'rgba(59,130,246,0.6)',  // blue — Conference
  'rgba(16,185,129,0.6)',  // emerald — Callback
];

/* ── SVG connecting lines with animated dots ── */
const LeftLines: React.FC<{ height: number }> = ({ height }) => {
  if (height <= 0) return null;
  const mid = height / 2;
  const t1 = height * 0.17;
  const t3 = height * 0.83;
  const paths = [
    `M 0,${t1} C 40,${t1} 40,${mid} 60,${mid}`,
    `M 0,${mid} L 60,${mid}`,
    `M 0,${t3} C 40,${t3} 40,${mid} 60,${mid}`,
  ];
  const delays = ['0s', '0.6s', '1.2s'];
  return (
    <svg width="60" height={height} style={{ display: 'block', overflow: 'visible' }}>
      {paths.map((d, i) => (
        <React.Fragment key={i}>
          <path d={d} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle r="3" fill={triggerDotColors[i]}>
            <animateMotion dur="2s" repeatCount="indefinite" begin={delays[i]} path={d} />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="2s" repeatCount="indefinite" begin={delays[i]} />
          </circle>
        </React.Fragment>
      ))}
    </svg>
  );
};

const RightLines: React.FC<{ height: number }> = ({ height }) => {
  if (height <= 0) return null;
  const mid = height / 2;
  const positions = [0.1, 0.3, 0.5, 0.7, 0.9].map(p => height * p);
  return (
    <svg width="60" height={height} style={{ display: 'block', overflow: 'visible' }}>
      {positions.map((y, i) => {
        const d = i === 2
          ? `M 0,${mid} L 60,${y}`
          : `M 0,${mid} C 20,${mid} 40,${y} 60,${y}`;
        return (
          <React.Fragment key={i}>
            <path d={d} fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
            <circle r="3" fill={responseDotColors[i]}>
              <animateMotion dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} path={d} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="2s" repeatCount="indefinite" begin={`${i * 0.4}s`} />
            </circle>
          </React.Fragment>
        );
      })}
    </svg>
  );
};

const HowItAllConnectsModal: React.FC<HowItAllConnectsModalProps> = ({ isOpen, onClose }) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [diagramH, setDiagramH] = React.useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || !diagramRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDiagramH(entry.contentRect.height);
      }
    });
    ro.observe(diagramRef.current);
    return () => ro.disconnect();
  }, [isOpen]);

  if (!isOpen) return null;

  /* ── Triggers: rose-red, indigo, teal ── */
  const triggers = [
    {
      icon: Smartphone,
      name: 'App SOS',
      sub: 'One tap',
      bg: '#fff1f2',       // rose-50
      border: '#fecdd3',   // rose-200
      gradFrom: '#ffe4e6', // rose-100
      gradTo: '#fecdd3',   // rose-200
      iconColor: '#f43f5e', // rose-500
      delay: 0,
    },
    {
      icon: Bluetooth,
      name: 'Pendant',
      sub: 'Press button',
      bg: '#eef2ff',       // indigo-50
      border: '#c7d2fe',   // indigo-200
      gradFrom: '#e0e7ff', // indigo-100
      gradTo: '#c7d2fe',   // indigo-200
      iconColor: '#6366f1', // indigo-500
      delay: 60,
    },
    {
      icon: Mic,
      name: 'Voice',
      sub: '"CLARA, help me"',
      bg: '#f0fdfa',       // teal-50
      border: '#99f6e4',   // teal-200
      gradFrom: '#ccfbf1', // teal-100
      gradTo: '#99f6e4',   // teal-200
      iconColor: '#0d9488', // teal-500
      delay: 120,
    },
  ];

  /* ── Responses: warm→cool arc ── */
  const responses = [
    { num: 1, name: 'Family Alerted', sub: 'All contacts notified instantly', bg: '#fff7ed', border: '#fed7aa', color: '#f97316', delay: 0 },
    { num: 2, name: 'GPS Shared', sub: 'Live location to family & services', bg: '#ecfeff', border: '#a5f3fc', color: '#06b6d4', delay: 80 },
    { num: 3, name: 'Medical Profile Sent', sub: 'Critical info to first responders', bg: '#f5f3ff', border: '#ddd6fe', color: '#8b5cf6', delay: 160 },
    { num: 4, name: 'Conference Bridge', sub: 'Family connected on live call', bg: '#eff6ff', border: '#bfdbfe', color: '#3b82f6', delay: 240 },
    { num: 5, name: 'Instant Callback', sub: 'Real person calls you back', bg: '#ecfdf5', border: '#a7f3d0', color: '#10b981', delay: 320 },
  ];

  /* ── Bottom chips: match parent colours ── */
  const chips = [
    { icon: Bot, label: 'CLARA AI', bg: '#fff1f2', border: '#fecdd3', iconColor: '#ef4444', textColor: '#0f172a' },
    { icon: Users, label: 'Family Network', bg: '#ecfeff', border: '#a5f3fc', iconColor: '#06b6d4', textColor: '#0f172a' },
    { icon: Sparkles, label: 'Add-Ons', bg: '#fffbeb', border: '#fde68a', iconColor: '#d97706', textColor: '#0f172a' },
    { icon: Bluetooth, label: 'SOS Pendant', bg: '#eef2ff', border: '#c7d2fe', iconColor: '#6366f1', textColor: '#0f172a' },
    { icon: ShieldAlert, label: 'Emergency', bg: '#fff7ed', border: '#fed7aa', iconColor: '#f97316', textColor: '#0f172a' },
  ];

  return (
    <>
      <style>{modalStyles}</style>

      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Popup container — 80vw × 80vh */}
      <div
        className="w-[80vw] h-[80vh] max-sm:w-[95vw] max-sm:h-[90vh]"
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          zIndex: 9999, backgroundColor: '#ffffff', borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.10), 0 48px 80px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'eco-fadeSlideUp 300ms cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ ROW 1 — TOP BAR (52px) ═══ */}
        <div
          style={{
            flexShrink: 0, height: '52px', padding: '0 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' }} />
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>How It All Connects</span>
            <span style={{ color: '#cbd5e1', margin: '0 2px' }}>·</span>
            <span className="hidden sm:inline" style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 400 }}>Your complete emergency ecosystem</span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              color: '#94a3b8', cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = '#fff1f2'; t.style.borderColor = '#fecaca'; t.style.color = '#ef4444'; }}
            onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = '#f8fafc'; t.style.borderColor = '#e2e8f0'; t.style.color = '#94a3b8'; }}
            aria-label="Close"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* ═══ ROW 2 — MAIN DIAGRAM (flex: 1) ═══ */}
        <div
          ref={diagramRef}
          style={{
            flex: 1, minHeight: 0,
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr 60px auto 60px 1fr',
            gap: 0,
            alignItems: 'center',
            position: 'relative',
          }}
          className="max-sm:flex max-sm:flex-col max-sm:gap-4 max-sm:overflow-y-auto"
        >
          {/* LEFT COLUMN — 3 Triggers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }} className="max-sm:flex-row max-sm:overflow-x-auto max-sm:items-stretch max-sm:gap-2">
            {triggers.map((tr, i) => (
              <div
                key={tr.name}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  background: tr.bg, border: `1px solid ${tr.border}`,
                  borderRadius: '12px', width: 'fit-content', cursor: 'default',
                  animation: `eco-triggerEnter 300ms cubic-bezier(0.16,1,0.3,1) ${tr.delay}ms both`,
                }}
                className="max-sm:min-w-[140px] max-sm:w-auto"
              >
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${tr.gradFrom}, ${tr.gradTo})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <tr.icon style={{ width: '16px', height: '16px', color: tr.iconColor }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>{tr.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', fontStyle: i === 2 ? 'italic' : undefined }}>{tr.sub}</div>
                </div>
                <div
                  style={{
                    width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                    background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
                    animation: 'eco-livePulse 2s infinite',
                  }}
                />
              </div>
            ))}
          </div>

          {/* LEFT SVG LINES */}
          <div className="max-sm:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LeftLines height={diagramH > 0 ? diagramH - 40 : 0} />
          </div>

          {/* CENTRE — CLARA NODE */}
          <div
            style={{
              flexShrink: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Pulse rings */}
              <div style={{ position: 'absolute', width: '112px', height: '112px', borderRadius: '50%', border: '1px solid rgba(239,68,68,0.15)', animation: 'eco-ringPulse 2.5s ease-out infinite', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ position: 'absolute', width: '96px', height: '96px', borderRadius: '50%', border: '1px solid rgba(239,68,68,0.2)', animation: 'eco-ringPulse 2.5s ease-out infinite', animationDelay: '0.4s', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', border: '1px solid rgba(239,68,68,0.25)', animation: 'eco-ringPulse 2.5s ease-out infinite', animationDelay: '0.8s', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              {/* Main circle */}
              <div
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  boxShadow: '0 0 0 3px rgba(239,68,68,0.15), 0 4px 24px rgba(239,68,68,0.35), 0 8px 40px rgba(239,68,68,0.2)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}
                className="max-sm:!w-12 max-sm:!h-12"
              >
                <Bot style={{ width: '24px', height: '24px', color: 'white' }} />
                <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>AI</span>
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginTop: '8px' }}>CLARA</div>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '2px' }}>Always watching</div>
          </div>

          {/* RIGHT SVG LINES */}
          <div className="max-sm:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RightLines height={diagramH > 0 ? diagramH - 40 : 0} />
          </div>

          {/* RIGHT COLUMN — 5 Responses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', justifyContent: 'center' }}>
            {responses.map((r) => (
              <div
                key={r.num}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  animation: `eco-responseEnter 300ms cubic-bezier(0.16,1,0.3,1) ${r.delay}ms both`,
                }}
              >
                <div
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: r.bg, border: `1px solid ${r.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '9px', fontWeight: 800, color: r.color }}>{r.num}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ ROW 3 — BOTTOM ECOSYSTEM STRIP (44px) ═══ */}
        <div
          style={{
            flexShrink: 0, height: '44px', padding: '0 24px',
            background: '#f8fafc', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          {/* Ecosystem chips */}
          <div className="hidden md:flex items-center" style={{ gap: '8px' }}>
            {chips.map((chip) => (
              <div
                key={chip.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '20px',
                  background: chip.bg, border: `1px solid ${chip.border}`,
                }}
              >
                <chip.icon style={{ width: '12px', height: '12px', color: chip.iconColor }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: chip.textColor }}>{chip.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
            <span className="hidden sm:inline" style={{ fontSize: '10px', color: '#94a3b8' }}>7 days free · No card needed</span>
            <Link
              to="/register?trial=true"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white', fontSize: '0.75rem', fontWeight: 700,
                padding: '7px 18px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Free Trial
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItAllConnectsModal;
