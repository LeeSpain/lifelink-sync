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
  0% { opacity: 0; transform: translateY(12px); }
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
/*  Color map — high contrast on dark bg                               */
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
/*  Feature Node Card                                                  */
/* ------------------------------------------------------------------ */
const FeatureNode: React.FC<FeatureNodeProps> = ({
  icon: Icon, title, description, color, tag, delay, children,
}) => {
  const c = colorMap[color];

  return (
    <div
      className={`
        group rounded-xl border border-slate-700 bg-slate-800/70
        border-l-4 ${c.border}
        p-5 transition-all duration-300 ease-out
        hover:bg-slate-700/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20
      `}
      style={{ animation: `eco-fade-up 0.5s ease-out ${delay}ms both` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
          ${c.iconBg} ${c.iconText}
        `}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs text-slate-300 leading-relaxed">{description}</p>
          {children}
        </div>
      </div>

      {/* Category tag — single line */}
      <div className="mt-3">
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
/*  Member Node (shared across layouts)                                */
/* ------------------------------------------------------------------ */
const MemberNode: React.FC<{
  size: 'sm' | 'md' | 'lg';
  title: string;
  desc: string;
  price: string;
  badge: string;
}> = ({ size, title, desc, price, badge }) => {
  const sizes = {
    sm: { circle: 'h-20 w-20', icon: 'h-8 w-8', ring: '-inset-3' },
    md: { circle: 'h-24 w-24', icon: 'h-9 w-9', ring: '-inset-4' },
    lg: { circle: 'h-28 w-28', icon: 'h-10 w-10', ring: '-inset-5' },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circle with radar rings */}
      <div className="relative">
        {/* Radar ring 1 */}
        <div
          className={`absolute ${s.ring} rounded-full border-2 border-red-500/30 pointer-events-none`}
          style={{ animation: 'eco-radar 3s ease-out infinite' }}
          aria-hidden="true"
        />
        {/* Radar ring 2 */}
        <div
          className={`absolute ${s.ring} rounded-full border-2 border-red-500/30 pointer-events-none`}
          style={{ animation: 'eco-radar 3s ease-out 1.5s infinite' }}
          aria-hidden="true"
        />
        {/* Main circle — white bg, red border */}
        <div
          className={`
            relative flex ${s.circle} items-center justify-center rounded-full
            bg-white border-2 border-red-500
          `}
          style={{
            animation: 'eco-breathe 3s ease-in-out infinite',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
          }}
        >
          <User className={`${s.icon} text-red-500`} />
        </div>
      </div>

      {/* Labels */}
      <div className="text-center">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-slate-300 mt-0.5">{desc}</p>
        <p className="text-sm font-bold text-red-400 mt-1 font-mono">{price}</p>
      </div>

      {/* Free trial badge */}
      <Badge className="bg-red-500 text-white border-0 text-xs font-medium">
        {badge}
      </Badge>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Add-on sub-badges (Family, Wellbeing, Meds)                        */
/* ------------------------------------------------------------------ */
const AddOnBadges = () => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Users className="h-2.5 w-2.5" /> Family
    </Badge>
    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Heart className="h-2.5 w-2.5" /> Wellbeing
    </Badge>
    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-slate-700 border-slate-600 text-slate-300">
      <Pill className="h-2.5 w-2.5" /> Meds
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
          max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto p-0
          bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-300
        ">
          {/* ── Header ── */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-700/60">
            <div className="flex items-start gap-3">
              {/* Red accent bar */}
              <div className="w-1 self-stretch rounded-full bg-red-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  {t('ecosystem.title')}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {t('ecosystem.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Subtle radial glow behind centre */}
            <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-red-500/[0.05] blur-3xl" />
            </div>

            {/* ── Desktop 3-col layout ── */}
            <div className="hidden lg:grid lg:grid-cols-[1fr,auto,1fr] gap-6 items-start relative">
              {/* Left column */}
              <div className="flex flex-col gap-4 pt-4">
                <FeatureNode
                  icon={Bot}
                  title={t('ecosystem.claraTitle')}
                  description={t('ecosystem.claraDesc')}
                  color="red"
                  tag={t('ecosystem.legendFeature')}
                  delay={100}
                />
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

              {/* Centre — Member hero node + Pendant */}
              <div
                className="flex flex-col items-center gap-5 px-6 py-4"
                style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}
              >
                <MemberNode
                  size="lg"
                  title={t('ecosystem.memberTitle')}
                  desc={t('ecosystem.memberDesc')}
                  price={t('ecosystem.memberPrice')}
                  badge={t('ecosystem.freeTrialBadge')}
                />

                {/* Connection indicator */}
                <div className="w-px h-6 bg-slate-600" aria-hidden="true" />

                {/* Pendant node below */}
                <div className="w-full max-w-xs">
                  <FeatureNode
                    icon={Bluetooth}
                    title={t('ecosystem.pendantTitle')}
                    description={t('ecosystem.pendantDesc')}
                    color="blue"
                    tag={t('ecosystem.legendFeature')}
                    delay={300}
                  />
                </div>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-4 pt-4">
                <FeatureNode
                  icon={Users}
                  title={t('ecosystem.familyTitle')}
                  description={t('ecosystem.familyDesc')}
                  color="cyan"
                  tag={t('ecosystem.legendFeature')}
                  delay={150}
                />
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

            {/* ── Tablet 2-col layout ── */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4">
              <div className="col-span-2 py-4" style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}>
                <MemberNode
                  size="md"
                  title={t('ecosystem.memberTitle')}
                  desc={t('ecosystem.memberDesc')}
                  price={t('ecosystem.memberPrice')}
                  badge={t('ecosystem.freeTrialBadge')}
                />
              </div>
              <FeatureNode icon={Bot} title={t('ecosystem.claraTitle')} description={t('ecosystem.claraDesc')} color="red" tag={t('ecosystem.legendFeature')} delay={100} />
              <FeatureNode icon={Users} title={t('ecosystem.familyTitle')} description={t('ecosystem.familyDesc')} color="cyan" tag={t('ecosystem.legendFeature')} delay={150} />
              <FeatureNode icon={Sparkles} title={t('ecosystem.addOnsTitle')} description={t('ecosystem.addOnsDesc')} color="amber" tag={t('ecosystem.legendAddOn')} delay={200}>
                <AddOnBadges />
              </FeatureNode>
              <FeatureNode icon={Phone} title={t('ecosystem.emergencyTitle')} description={t('ecosystem.emergencyDesc')} color="orange" tag={t('ecosystem.legendFeature')} delay={250} />
              <div className="col-span-2">
                <FeatureNode icon={Bluetooth} title={t('ecosystem.pendantTitle')} description={t('ecosystem.pendantDesc')} color="blue" tag={t('ecosystem.legendFeature')} delay={300} />
              </div>
            </div>

            {/* ── Mobile single-col layout ── */}
            <div className="flex flex-col gap-4 md:hidden">
              <div className="py-4" style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}>
                <MemberNode
                  size="sm"
                  title={t('ecosystem.memberTitle')}
                  desc={t('ecosystem.memberDesc')}
                  price={t('ecosystem.memberPrice')}
                  badge={t('ecosystem.freeTrialBadge')}
                />
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

          {/* ── CLARA Complete Banner ── */}
          <div className="mx-6 mb-4 rounded-xl border border-slate-700 border-l-4 border-l-red-500 bg-slate-800/80 p-5 relative overflow-hidden">
            {/* Shimmer */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(239,68,68,0.06) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'eco-shimmer 3s linear infinite',
              }}
              aria-hidden="true"
            />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/20">
                  <Sparkles className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <span className="text-base font-bold text-white">
                    {t('ecosystem.claraCompleteTitle')}
                  </span>
                  <span className="ml-2 text-sm text-slate-300">
                    {t('ecosystem.claraCompleteDesc')}
                  </span>
                </div>
              </div>
              <Badge className="bg-red-500 text-white border-0 shrink-0 font-semibold whitespace-nowrap">
                {t('ecosystem.claraCompletePrice')}
              </Badge>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 pb-3
            text-[11px] font-medium uppercase tracking-wider text-slate-300">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span>{t('ecosystem.legendMember')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              <span>{t('ecosystem.legendFeature')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>{t('ecosystem.legendAddOn')}</span>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="px-6 pb-6 pt-3 text-center space-y-3 border-t border-slate-700/60">
            <Button
              asChild
              size="lg"
              className="
                bg-red-500 text-white hover:bg-red-600
                rounded-full px-8 font-semibold
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/25
                w-full sm:w-auto
              "
            >
              <Link to="/register?trial=true">
                <Shield className="h-4 w-4 mr-2" />
                {t('ecosystem.startTrial')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-slate-400">
              {t('ecosystem.noCreditCard')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EcosystemMapModal;
