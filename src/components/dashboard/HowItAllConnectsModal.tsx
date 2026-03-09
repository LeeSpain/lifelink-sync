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
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const modalStyles = `
@keyframes eco-fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes eco-ping {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(1.3); opacity: 0; }
}
`;

interface HowItAllConnectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItAllConnectsModal: React.FC<HowItAllConnectsModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const responseSteps = [
    { num: 1, label: 'CLARA\nActivates', color: '#ef4444', border: '#fecaca', ring: 'rgba(239,68,68,0.12)' },
    { num: 2, label: 'Family\nAlerted', color: '#f97316', border: '#fed7aa', ring: 'rgba(249,115,22,0.12)' },
    { num: 3, label: 'GPS\nShared', color: '#06b6d4', border: '#a5f3fc', ring: 'rgba(6,182,212,0.12)' },
    { num: 4, label: 'Medical\nProfile Sent', color: '#8b5cf6', border: '#ddd6fe', ring: 'rgba(139,92,246,0.12)' },
    { num: 5, label: 'Conference\nBridge', color: '#3b82f6', border: '#bfdbfe', ring: 'rgba(59,130,246,0.12)' },
    { num: 6, label: 'Instant\nCallback', color: '#10b981', border: '#a7f3d0', ring: 'rgba(16,185,129,0.12)' },
  ];

  const ec = {
    clara:  { g1: '#fef2f2', g2: '#fee2e2', b: '#fecaca', c: '#dc2626', bg: '#fef2f2', bc: '#b91c1c' },
    amber:  { g1: '#fffbeb', g2: '#fef3c7', b: '#fde68a', c: '#d97706', bg: '#fffbeb', bc: '#92400e' },
    blue:   { g1: '#eff6ff', g2: '#dbeafe', b: '#bfdbfe', c: '#2563eb', bg: '#eff6ff', bc: '#1e40af' },
    cyan:   { g1: '#ecfeff', g2: '#cffafe', b: '#a5f3fc', c: '#0891b2', bg: '#ecfeff', bc: '#155e75' },
    orange: { g1: '#fff7ed', g2: '#ffedd5', b: '#fed7aa', c: '#ea580c', bg: '#fff7ed', bc: '#9a3412' },
  };

  const anim = (d: number) => ({ animation: `eco-fadeSlideUp 250ms cubic-bezier(0.16,1,0.3,1) ${d}ms both` });

  /* Shared eco card renderer */
  const EcoCard = ({ icon: Icon, title, desc, badge, colors, gradFrom, gradTo, delay }: {
    icon: React.ElementType; title: string; desc: string; badge: string;
    colors: typeof ec.clara; gradFrom: string; gradTo: string; delay: number;
  }) => (
    <div
      className="relative overflow-hidden transition-all duration-200 hover:-translate-y-px"
      style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '10px', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04)', ...anim(delay) }}
    >
      <div style={{ position: 'absolute', left: 0, top: '8px', bottom: '8px', width: '3px', borderRadius: '0 3px 3px 0', background: `linear-gradient(180deg, ${gradFrom}, ${gradTo})` }} />
      <div className="flex items-center justify-center" style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg, ${colors.g1}, ${colors.g2})`, border: `1px solid ${colors.b}` }}>
        <Icon style={{ width: '14px', height: '14px', color: colors.c }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0f172a', letterSpacing: '-0.01em', marginTop: '6px' }}>{title}</p>
      <p style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1.4, marginTop: '2px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>
      <span style={{ display: 'inline-block', marginTop: '4px', borderRadius: '6px', fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em', padding: '1px 6px', border: `1px solid ${colors.b}`, background: colors.bg, color: colors.bc }}>{badge}</span>
    </div>
  );

  const SectionLabel = ({ text }: { text: string }) => (
    <p className="inline-flex items-center gap-1.5" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>
      <span style={{ width: '12px', height: '1.5px', background: '#ef4444', borderRadius: '1px', display: 'inline-block' }} />
      {text}
    </p>
  );

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
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '10px', right: '10px', zIndex: 10,
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#f8fafc', border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#94a3b8', transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = '#fff1f2'; t.style.borderColor = '#fecaca'; t.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = '#f8fafc'; t.style.borderColor = '#e2e8f0'; t.style.color = '#94a3b8'; }}
          aria-label="Close"
        >
          <X style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
        </button>

        {/* ═══ SECTION 1 — HEADER (~44px) ═══ */}
        <div
          style={{
            flexShrink: 0, overflow: 'hidden',
            padding: '10px 20px 8px 20px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(255,255,255,0) 60%)',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div className="flex items-center" style={{ paddingRight: '36px' }}>
            <div style={{ width: '3px', height: '24px', background: 'linear-gradient(180deg, #ef4444, #dc2626)', borderRadius: '2px', boxShadow: '0 2px 8px rgba(239,68,68,0.3)', flexShrink: 0, marginRight: '10px' }} />
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>How It All Connects</h2>
              <p style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 400, marginTop: '1px', lineHeight: 1.3 }}>Your complete protection ecosystem — every feature working together.</p>
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2 — TRIGGER CARDS (~90px) ═══ */}
        <div style={{ flexShrink: 0, overflow: 'hidden', padding: '8px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <SectionLabel text="THREE WAYS TO CALL FOR HELP" />
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '8px' }}>
            {[
              { icon: Smartphone, title: 'App SOS Button', desc: 'One tap in the app', badge: 'ALWAYS AVAILABLE', borderColor: '#fecaca', topColor: '#ef4444', iconBg: ['#fef2f2','#fee2e2'], iconColor: '#ef4444', badgeBg: '#fef2f2', badgeColor: '#dc2626', badgeBorder: '#fecaca', shadow: 'rgba(239,68,68,' },
              { icon: Bluetooth, title: 'Bluetooth Pendant', desc: 'Press button, phone activates', badge: 'BLUETOOTH RANGE', borderColor: '#bfdbfe', topColor: '#3b82f6', iconBg: ['#eff6ff','#dbeafe'], iconColor: '#3b82f6', badgeBg: '#eff6ff', badgeColor: '#2563eb', badgeBorder: '#bfdbfe', shadow: 'rgba(59,130,246,' },
              { icon: Mic, title: 'Voice Activation', desc: '"CLARA, help me"', badge: 'HANDS FREE', borderColor: '#a7f3d0', topColor: '#10b981', iconBg: ['#ecfdf5','#d1fae5'], iconColor: '#10b981', badgeBg: '#ecfdf5', badgeColor: '#059669', badgeBorder: '#a7f3d0', shadow: 'rgba(16,185,129,' },
            ].map((c, i) => (
              <div
                key={i}
                className="transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: '#fff', border: `1px solid ${c.borderColor}`, borderTop: `2px solid ${c.topColor}`,
                  borderRadius: '10px', padding: '10px 12px',
                  boxShadow: `0 1px 2px ${c.shadow}0.06), 0 4px 12px ${c.shadow}0.08)`,
                  ...anim(60 + i * 60),
                }}
              >
                <div className="flex items-center justify-center" style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg, ${c.iconBg[0]}, ${c.iconBg[1]})`, border: `1px solid ${c.borderColor}` }}>
                  <c.icon style={{ width: '16px', height: '16px', color: c.iconColor }} />
                </div>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem', letterSpacing: '-0.01em', marginTop: '4px' }}>{c.title}</p>
                <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px', fontStyle: i === 2 ? 'italic' : undefined }}>{c.desc}</p>
                <span style={{ display: 'inline-block', marginTop: '4px', background: c.badgeBg, color: c.badgeColor, border: `1px solid ${c.badgeBorder}`, borderRadius: '6px', fontSize: '8px', fontWeight: 700, padding: '1px 6px' }}>{c.badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 3 — RESPONSE CHAIN (~80px) ═══ */}
        <div style={{ flexShrink: 0, overflow: 'hidden', padding: '8px 20px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '1px solid #f1f5f9' }}>
          <SectionLabel text="WHAT HAPPENS IN THE NEXT 30 SECONDS" />
          <div className="relative flex items-start overflow-x-auto md:overflow-visible md:justify-between" style={{ gap: '2px', paddingBottom: '2px' }}>
            <div className="hidden md:block absolute left-0 right-0" style={{ top: '14px', height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0 10%, #e2e8f0 90%, transparent)', zIndex: 0 }} />
            {responseSteps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center text-center flex-shrink-0 min-w-[50px] md:min-w-0 md:flex-1 relative z-[1]" style={anim(i * 50)}>
                  <div className="flex items-center justify-center mx-auto" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff', border: `1.5px solid ${step.border}`, boxShadow: `0 1px 3px rgba(0,0,0,0.06), 0 0 0 2px ${step.ring}` }}>
                    <span style={{ fontWeight: 800, fontSize: '0.7rem', color: step.color }}>{step.num}</span>
                  </div>
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#475569', lineHeight: 1.3, marginTop: '4px', whiteSpace: 'pre-line', textAlign: 'center' }}>{step.label}</span>
                </div>
                {i < responseSteps.length - 1 && (
                  <ChevronRight className="self-center shrink-0" style={{ width: '10px', height: '10px', color: '#cbd5e1', marginBottom: '14px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 4 — ECOSYSTEM GRID (flex-1, only scrollable section) ═══ */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '8px 20px' }}>
          <SectionLabel text="YOUR FULL ECOSYSTEM" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" style={{ gap: '6px' }}>
            {/* LEFT COL */}
            <div className="flex flex-col" style={{ gap: '6px' }}>
              <EcoCard icon={Bot} title="CLARA AI" desc="24/7 AI safety companion. Answers every SOS, assesses situations, coordinates your response." badge="CORE FEATURE" colors={ec.clara} gradFrom="#f87171" gradTo="#dc2626" delay={40} />
              <EcoCard icon={Sparkles} title="Add-Ons" desc="Daily Wellbeing checks, Medication Reminders, and Family Links to extend your protection." badge="" colors={ec.amber} gradFrom="#fbbf24" gradTo="#d97706" delay={80} />
            </div>

            {/* CENTRE COL */}
            <div className="flex flex-col" style={{ gap: '6px' }}>
              {/* Member node */}
              <div
                className="flex flex-col items-center justify-center flex-1"
                style={{
                  background: 'linear-gradient(135deg, #fff5f5, #ffffff)', border: '1px solid #fecaca',
                  borderRadius: '10px', padding: '12px',
                  boxShadow: '0 0 0 1px rgba(239,68,68,0.08), 0 4px 16px rgba(239,68,68,0.08)',
                  ...anim(0),
                }}
              >
                <div className="relative" style={{ width: '56px', height: '56px' }}>
                  <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1.5px solid rgba(239,68,68,0.25)', animation: 'eco-ping 2.5s ease-out infinite' }} />
                  <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: '1px solid rgba(239,68,68,0.12)', animation: 'eco-ping 2.5s ease-out infinite', animationDelay: '0.8s' }} />
                  <div className="flex items-center justify-center mx-auto" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fff, #fef2f2)', border: '2px solid #ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.08), 0 4px 12px rgba(239,68,68,0.2)', marginTop: '4px' }}>
                    <User style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                  </div>
                </div>
                <p style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', letterSpacing: '-0.02em', marginTop: '8px' }}>You — The Member</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums', marginTop: '1px' }}>€9.99/mo</p>
                <span style={{ display: 'inline-block', marginTop: '4px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em', borderRadius: '20px', padding: '2px 10px', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>7 days free</span>
              </div>
              {/* SOS Pendant */}
              <EcoCard icon={Bluetooth} title="SOS Pendant" desc="Pairs with your phone via Bluetooth to instantly activate CLARA and trigger your full emergency response." badge="BLUETOOTH" colors={ec.blue} gradFrom="#60a5fa" gradTo="#2563eb" delay={120} />
            </div>

            {/* RIGHT COL */}
            <div className="flex flex-col" style={{ gap: '6px' }}>
              <EcoCard icon={Users} title="Family Network" desc="Unlimited contacts coordinated simultaneously. Live GPS, calls, alerts and wellbeing reports." badge="1 LINK FREE" colors={ec.cyan} gradFrom="#22d3ee" gradTo="#0891b2" delay={80} />
              <EcoCard icon={ShieldAlert} title="Emergency Response" desc="SOS triggers instant response — contacts called, GPS shared, medical profile sent, ETA shown." badge="ALWAYS ON" colors={ec.orange} gradFrom="#fb923c" gradTo="#ea580c" delay={120} />
            </div>
          </div>
        </div>

        {/* ═══ SECTION 5 — FOOTER (~80px) ═══ */}
        <div style={{ flexShrink: 0, overflow: 'hidden', padding: '8px 20px', borderTop: '1px solid #f1f5f9' }}>
          {/* CLARA Complete banner */}
          <div
            className="flex items-center"
            style={{
              gap: '10px', padding: '8px 12px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0.02) 100%)',
              border: '1px solid rgba(239,68,68,0.15)', borderLeft: '3px solid #ef4444',
              boxShadow: '0 2px 8px rgba(239,68,68,0.06)',
            }}
          >
            <div className="flex items-center justify-center shrink-0" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fecaca' }}>
              <Sparkles style={{ width: '12px', height: '12px', color: '#ef4444' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a', letterSpacing: '-0.02em' }} className="shrink-0">CLARA Complete</span>
            <span style={{ fontSize: '0.7rem', color: '#64748b' }} className="flex-1 hidden sm:inline">Everything included — base plan plus all add-ons</span>
            <span className="shrink-0" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: 800, fontSize: '8px', letterSpacing: '0.06em', borderRadius: '20px', padding: '2px 8px', boxShadow: '0 2px 8px rgba(239,68,68,0.35)' }}>BEST VALUE</span>
          </div>

          {/* Legend + CTA */}
          <div className="flex items-center justify-between" style={{ marginTop: '6px' }}>
            <div className="hidden sm:flex items-center" style={{ gap: '12px' }}>
              {[
                { color: '#ef4444', label: 'Member' },
                { color: '#94a3b8', label: 'Core' },
                { color: '#f59e0b', label: 'Add-On' },
                { color: '#06b6d4', label: 'Family' },
                { color: '#f97316', label: 'Emergency' },
              ].map((item) => (
                <div key={item.label} className="flex items-center" style={{ gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 0 2px ${item.color}33` }} />
                  <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.02em' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <Link
              to="/register?trial=true"
              className="inline-flex items-center justify-center sm:w-auto"
              style={{
                gap: '6px', background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '-0.01em',
                borderRadius: '20px', padding: '6px 16px', border: 'none',
                boxShadow: '0 2px 4px rgba(239,68,68,0.2), 0 4px 16px rgba(239,68,68,0.25)',
                transition: 'all 200ms ease', textDecoration: 'none',
              }}
              onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = 'linear-gradient(135deg, #dc2626, #b91c1c)'; t.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)'; t.style.transform = 'translateY(0)'; }}
            >
              <Shield style={{ width: '12px', height: '12px' }} />
              Start Free Trial
              <ArrowRight style={{ width: '12px', height: '12px' }} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HowItAllConnectsModal;
