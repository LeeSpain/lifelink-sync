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
  Bluetooth,
  Sparkles,
  Heart,
  Pill,
  MapPin,
  ArrowRight,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/* ------------------------------------------------------------------ */
/*  CSS-only animations                                                */
/* ------------------------------------------------------------------ */
const animationStyles = `
@keyframes eco-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes eco-radar {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes eco-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes eco-fade-up {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface EcosystemMapModalProps {
  trigger?: React.ReactNode;
}

type NodeColor = 'red' | 'amber' | 'cyan' | 'orange' | 'blue';

interface FeatureNodeProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: NodeColor;
  tag: string;
  delay: number;
  children?: React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Color map                                                          */
/* ------------------------------------------------------------------ */
const colorMap: Record<NodeColor, {
  border: string;
  iconBg: string;
  iconText: string;
  tagBg: string;
  tagText: string;
}> = {
  red:    { border: 'border-l-red-500',    iconBg: 'bg-red-500/20',    iconText: 'text-red-400',    tagBg: 'bg-red-500/15',    tagText: 'text-red-300'    },
  amber:  { border: 'border-l-amber-500',  iconBg: 'bg-amber-500/20',  iconText: 'text-amber-400',  tagBg: 'bg-amber-500/15',  tagText: 'text-amber-300'  },
  cyan:   { border: 'border-l-cyan-500',   iconBg: 'bg-cyan-500/20',   iconText: 'text-cyan-400',   tagBg: 'bg-cyan-500/15',   tagText: 'text-cyan-300'   },
  orange: { border: 'border-l-orange-500', iconBg: 'bg-orange-500/20', iconText: 'text-orange-400', tagBg: 'bg-orange-500/15', tagText: 'text-orange-300' },
  blue:   { border: 'border-l-blue-500',   iconBg: 'bg-blue-500/20',   iconText: 'text-blue-400',   tagBg: 'bg-blue-500/15',   tagText: 'text-blue-300'   },
};

/* ------------------------------------------------------------------ */
/*  Compact Feature Node Card                                          */
/* ------------------------------------------------------------------ */
const FeatureNode: React.FC<FeatureNodeProps> = ({
  icon: Icon, title, description, color, tag, delay, children,
}) => {
  const c = colorMap[color];

  return (
    <div
      className={`
        group rounded-lg border border-slate-700 bg-slate-800/70
        border-l-4 ${c.border}
        p-3 transition-all duration-300 ease-out
        hover:bg-slate-700/80
      `}
      style={{ animation: `eco-fade-up 0.4s ease-out ${delay}ms both` }}
    >
      <div className="flex items-start gap-2.5">
        <div className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-md
          ${c.iconBg} ${c.iconText}
        `}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white leading-tight">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-300 leading-snug line-clamp-2">{description}</p>
          {children}
        </div>
      </div>
      <div className="mt-2">
        <span className={`
          inline-block whitespace-nowrap rounded-full px-2 py-0.5
          text-[10px] font-medium uppercase tracking-wider
          ${c.tagBg} ${c.tagText}
        `}>
          {tag}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Add-on sub-badges                                                  */
/* ------------------------------------------------------------------ */
const AddOnBadges = () => (
  <div className="mt-1.5 flex flex-wrap gap-1">
    <Badge className="text-[9px] gap-0.5 px-1 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Users className="h-2 w-2" /> Family
    </Badge>
    <Badge className="text-[9px] gap-0.5 px-1 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Heart className="h-2 w-2" /> Wellbeing
    </Badge>
    <Badge className="text-[9px] gap-0.5 px-1 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Pill className="h-2 w-2" /> Meds
    </Badge>
  </div>
);

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

  return (
    <>
      <style>{animationStyles}</style>

      <Dialog>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

        <DialogContent className="
          max-w-[900px] w-[95vw] max-h-[90vh] p-0
          bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-300
        ">
          {/* ── Header (flex-shrink-0) ── */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-10 rounded-full bg-red-500 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {t('ecosystem.title')}
                </h2>
                <p className="text-xs text-slate-400 leading-tight">
                  {t('ecosystem.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Main Grid (flex-1, fills remaining space) ── */}
          <div className="flex-1 min-h-0 relative">
            {/* Radial glow */}
            <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-red-500/[0.04] blur-3xl" />
            </div>

            {/* ── Desktop/Tablet 3-col (md+) ── */}
            <div className="hidden md:grid md:grid-cols-[1fr,auto,1fr] gap-3 p-4 h-full items-stretch relative">
              {/* Left column — 2 stacked cards */}
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <FeatureNode
                    icon={Bot}
                    title={t('ecosystem.claraTitle')}
                    description={t('ecosystem.claraDesc')}
                    color="red"
                    tag={t('ecosystem.legendFeature')}
                    delay={100}
                  />
                </div>
                <div className="flex-1">
                  <FeatureNode
                    icon={Sparkles}
                    title={t('ecosystem.addOnsTitle')}
                    description={t('ecosystem.addOnsDesc')}
                    color="amber"
                    tag={t('ecosystem.legendAddOn')}
                    delay={200}
                  >
                    <AddOnBadges />
                  </FeatureNode>
                </div>
              </div>

              {/* Centre — Member node + connector + Pendant */}
              <div
                className="flex flex-col items-center justify-center gap-2 px-3 w-48"
                style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}
              >
                {/* Member circle */}
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-full border-2 border-red-500/25 pointer-events-none"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }}
                    aria-hidden="true"
                  />
                  <div
                    className="absolute -inset-3 rounded-full border-2 border-red-500/25 pointer-events-none"
                    style={{ animation: 'eco-radar 3s ease-out 1.5s infinite' }}
                    aria-hidden="true"
                  />
                  <div
                    className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white border-2 border-red-500"
                    style={{
                      animation: 'eco-breathe 3s ease-in-out infinite',
                      boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <User className="h-8 w-8 text-red-500" />
                  </div>
                </div>

                <div className="text-center mt-1">
                  <p className="text-sm font-bold text-white">{t('ecosystem.memberTitle')}</p>
                  <p className="text-[11px] text-slate-300">{t('ecosystem.memberDesc')}</p>
                  <p className="text-xs font-bold text-red-400 mt-0.5 font-mono">{t('ecosystem.memberPrice')}</p>
                </div>

                <Badge className="bg-red-500 text-white border-0 text-[10px] font-medium px-2 py-0">
                  {t('ecosystem.freeTrialBadge')}
                </Badge>

                {/* Connector line */}
                <div className="w-px h-3 bg-slate-600" aria-hidden="true" />

                {/* Pendant card */}
                <FeatureNode
                  icon={Bluetooth}
                  title={t('ecosystem.pendantTitle')}
                  description={t('ecosystem.pendantDesc')}
                  color="blue"
                  tag={t('ecosystem.legendFeature')}
                  delay={300}
                />
              </div>

              {/* Right column — 2 stacked cards */}
              <div className="flex flex-col gap-3">
                <div className="flex-1">
                  <FeatureNode
                    icon={Users}
                    title={t('ecosystem.familyTitle')}
                    description={t('ecosystem.familyDesc')}
                    color="cyan"
                    tag={t('ecosystem.legendFeature')}
                    delay={150}
                  />
                </div>
                <div className="flex-1">
                  <FeatureNode
                    icon={Phone}
                    title={t('ecosystem.emergencyTitle')}
                    description={t('ecosystem.emergencyDesc')}
                    color="orange"
                    tag={t('ecosystem.legendFeature')}
                    delay={250}
                  />
                </div>
              </div>
            </div>

            {/* ── Mobile single-col (scrollable) ── */}
            <div className="flex flex-col gap-3 p-4 md:hidden overflow-y-auto max-h-full">
              {/* Member node */}
              <div className="flex flex-col items-center gap-2 py-3" style={{ animation: 'eco-fade-up 0.4s ease-out 0ms both' }}>
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-full border-2 border-red-500/25 pointer-events-none"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }}
                    aria-hidden="true"
                  />
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-2 border-red-500"
                    style={{
                      animation: 'eco-breathe 3s ease-in-out infinite',
                      boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <User className="h-7 w-7 text-red-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">{t('ecosystem.memberTitle')}</p>
                  <p className="text-xs text-slate-300">{t('ecosystem.memberDesc')}</p>
                  <p className="text-xs font-bold text-red-400 mt-0.5 font-mono">{t('ecosystem.memberPrice')}</p>
                </div>
                <Badge className="bg-red-500 text-white border-0 text-[10px] font-medium px-2 py-0">
                  {t('ecosystem.freeTrialBadge')}
                </Badge>
              </div>

              <FeatureNode icon={Bot} title={t('ecosystem.claraTitle')} description={t('ecosystem.claraDesc')} color="red" tag={t('ecosystem.legendFeature')} delay={100} />
              <FeatureNode icon={Users} title={t('ecosystem.familyTitle')} description={t('ecosystem.familyDesc')} color="cyan" tag={t('ecosystem.legendFeature')} delay={150} />
              <FeatureNode icon={Phone} title={t('ecosystem.emergencyTitle')} description={t('ecosystem.emergencyDesc')} color="orange" tag={t('ecosystem.legendFeature')} delay={200} />
              <FeatureNode icon={Bluetooth} title={t('ecosystem.pendantTitle')} description={t('ecosystem.pendantDesc')} color="blue" tag={t('ecosystem.legendFeature')} delay={250} />
              <FeatureNode icon={Sparkles} title={t('ecosystem.addOnsTitle')} description={t('ecosystem.addOnsDesc')} color="amber" tag={t('ecosystem.legendAddOn')} delay={300}>
                <AddOnBadges />
              </FeatureNode>
            </div>
          </div>

          {/* ── CLARA Complete Banner (flex-shrink-0) ── */}
          <div className="flex-shrink-0 mx-4 mb-2 rounded-lg border border-slate-700 border-l-4 border-l-red-500 bg-slate-800/80 py-2.5 px-3 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.05) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'eco-shimmer 3s linear infinite',
              }}
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-red-500/20">
                  <Sparkles className="h-3.5 w-3.5 text-red-400" />
                </div>
                <span className="text-sm font-bold text-white shrink-0">
                  {t('ecosystem.claraCompleteTitle')}
                </span>
                <span className="text-xs text-slate-300 truncate hidden sm:inline">
                  {t('ecosystem.claraCompleteDesc')}
                </span>
              </div>
              <Badge className="bg-red-500 text-white border-0 shrink-0 font-semibold text-xs whitespace-nowrap">
                {t('ecosystem.claraCompletePrice')}
              </Badge>
            </div>
          </div>

          {/* ── Bottom Row: Legend + CTA (flex-shrink-0, same row) ── */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-slate-700/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Legend */}
              <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>{t('ecosystem.legendMember')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-cyan-500" />
                  <span>{t('ecosystem.legendFeature')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>{t('ecosystem.legendAddOn')}</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 hidden sm:inline whitespace-nowrap">
                  {t('ecosystem.noCreditCard')}
                </span>
                <Button
                  asChild
                  size="sm"
                  className="
                    bg-red-500 text-white hover:bg-red-600
                    rounded-full px-5 h-9 text-sm font-semibold
                    transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25
                    whitespace-nowrap
                  "
                >
                  <Link to="/register?trial=true">
                    <Shield className="h-3.5 w-3.5 mr-1.5" />
                    {t('ecosystem.startTrial')}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
            {/* Mobile-only note */}
            <p className="text-[10px] text-slate-400 text-center mt-2 sm:hidden">
              {t('ecosystem.noCreditCard')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EcosystemMapModal;
