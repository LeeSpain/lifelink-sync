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
/*  CSS-only animations — injected once via <style>                    */
/* ------------------------------------------------------------------ */
const animationStyles = `
@keyframes eco-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
@keyframes eco-radar {
  0% { transform: scale(1); opacity: 0.35; }
  100% { transform: scale(1.9); opacity: 0; }
}
@keyframes eco-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes eco-dot {
  0%, 100% { opacity: 0; transform: translateX(0); }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { opacity: 0; transform: translateX(var(--dot-travel, 60px)); }
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

type NodeColor = 'primary' | 'emergency' | 'wellness' | 'warning' | 'guardian';

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
/*  Color helpers — maps semantic name → Tailwind classes               */
/* ------------------------------------------------------------------ */
const colorMap: Record<NodeColor, { border: string; iconBg: string; iconText: string; tag: string; dot: string }> = {
  primary:   { border: 'border-l-primary',   iconBg: 'bg-primary/15',   iconText: 'text-primary',   tag: 'bg-primary/10 text-primary border-primary/20',     dot: 'bg-primary'   },
  emergency: { border: 'border-l-emergency', iconBg: 'bg-emergency/15', iconText: 'text-emergency', tag: 'bg-emergency/10 text-emergency border-emergency/20', dot: 'bg-emergency' },
  wellness:  { border: 'border-l-wellness',  iconBg: 'bg-wellness/15',  iconText: 'text-wellness',  tag: 'bg-wellness/10 text-wellness border-wellness/20',   dot: 'bg-wellness'  },
  warning:   { border: 'border-l-warning',   iconBg: 'bg-warning/15',   iconText: 'text-warning',   tag: 'bg-warning/10 text-warning border-warning/20',     dot: 'bg-warning'   },
  guardian:  { border: 'border-l-guardian',   iconBg: 'bg-guardian/15',  iconText: 'text-guardian',  tag: 'bg-guardian/10 text-guardian border-guardian/20',   dot: 'bg-guardian'  },
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
        group relative rounded-xl border border-sidebar-border bg-sidebar-accent
        border-l-4 ${c.border}
        p-4 transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5
      `}
      style={{ animation: `eco-fade-up 0.5s ease-out ${delay}ms both` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
          ${c.iconBg} ${c.iconText}
          transition-all duration-300 group-hover:shadow-md
        `}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-sidebar-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-sidebar-muted-foreground leading-relaxed">{description}</p>
          {children}
        </div>
      </div>

      {/* Category tag */}
      <div className="mt-3">
        <span className={`
          inline-block rounded-full border px-2.5 py-0.5
          text-[10px] font-medium uppercase tracking-wider
          ${c.tag}
        `}>
          {tag}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Connection line with animated dot (desktop only)                   */
/* ------------------------------------------------------------------ */
const ConnectionLine: React.FC<{ direction: 'left' | 'right'; delay: number }> = ({ direction, delay }) => (
  <div className={`
    hidden lg:flex items-center absolute top-1/2 -translate-y-1/2
    ${direction === 'left' ? 'right-full mr-1' : 'left-full ml-1'}
    w-8
  `}>
    <div className="relative w-full h-px bg-gradient-to-r from-primary/30 to-sidebar-border">
      <div
        className="absolute top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary"
        style={{
          '--dot-travel': direction === 'left' ? '-28px' : '28px',
          animation: `eco-dot 2.5s ease-in-out ${delay}s infinite`,
        } as React.CSSProperties}
      />
    </div>
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
          bg-sidebar border border-primary/10 rounded-2xl shadow-2xl
          data-[state=open]:animate-in data-[state=open]:fade-in-0
          data-[state=open]:zoom-in-[0.96] data-[state=open]:duration-300
        ">
          {/* ── Header ── */}
          <div className="relative px-6 pt-6 pb-4 backdrop-blur-sm border-b border-sidebar-border">
            <div className="flex items-start gap-3">
              {/* Red accent bar */}
              <div className="w-1 self-stretch rounded-full bg-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-extrabold text-sidebar-foreground tracking-tight">
                  {t('ecosystem.title')}
                </h2>
                <p className="mt-1 text-sm font-light text-sidebar-muted-foreground">
                  {t('ecosystem.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="relative px-6 pt-6 pb-4">
            {/* Radial glow behind centre */}
            <div className="hidden md:block absolute inset-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-primary/[0.06] blur-3xl" />
            </div>

            {/* ── Desktop 3-col layout ── */}
            <div className="hidden lg:grid lg:grid-cols-[1fr,auto,1fr] gap-6 items-center relative">
              {/* Left column */}
              <div className="flex flex-col gap-4">
                <FeatureNode
                  icon={Bot}
                  title={t('ecosystem.claraTitle')}
                  description={t('ecosystem.claraDesc')}
                  color="primary"
                  tag={t('ecosystem.legendFeature')}
                  delay={100}
                />
                <FeatureNode
                  icon={Sparkles}
                  title={t('ecosystem.addOnsTitle')}
                  description={t('ecosystem.addOnsDesc')}
                  color="warning"
                  tag={t('ecosystem.legendAddOn')}
                  delay={200}
                >
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground">
                      <Users className="h-2.5 w-2.5" /> Family
                    </Badge>
                    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground">
                      <Heart className="h-2.5 w-2.5" /> Wellbeing
                    </Badge>
                    <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground">
                      <Pill className="h-2.5 w-2.5" /> Meds
                    </Badge>
                  </div>
                </FeatureNode>
              </div>

              {/* Centre — Member hero node */}
              <div className="relative flex flex-col items-center gap-4 px-4"
                style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}
              >
                {/* Radar rings */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden="true">
                  <div
                    className="absolute -inset-4 rounded-full border border-primary/20"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }}
                  />
                  <div
                    className="absolute -inset-4 rounded-full border border-primary/20"
                    style={{ animation: 'eco-radar 3s ease-out 1.5s infinite' }}
                  />
                </div>

                {/* Main circle */}
                <div
                  className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary shadow-glow"
                  style={{ animation: 'eco-breathe 3s ease-in-out infinite' }}
                >
                  {/* Inner glow ring */}
                  <div className="absolute inset-0 rounded-full bg-primary/30 blur-md" aria-hidden="true" />
                  <User className="relative h-10 w-10 text-white" />
                </div>

                {/* Label */}
                <div className="text-center">
                  <p className="text-sm font-bold text-sidebar-foreground">{t('ecosystem.memberTitle')}</p>
                  <p className="text-xs text-sidebar-muted-foreground mt-0.5">{t('ecosystem.memberDesc')}</p>
                  <p className="text-sm font-bold text-primary mt-1 font-mono">{t('ecosystem.memberPrice')}</p>
                </div>

                {/* Free trial badge */}
                <Badge className="bg-primary text-white border-0 text-xs font-medium shadow-primary">
                  {t('ecosystem.freeTrialBadge')}
                </Badge>

                {/* Pendant node below */}
                <div className="mt-2 w-full">
                  <FeatureNode
                    icon={Bluetooth}
                    title={t('ecosystem.pendantTitle')}
                    description={t('ecosystem.pendantDesc')}
                    color="guardian"
                    tag={t('ecosystem.legendFeature')}
                    delay={300}
                  />
                </div>

                {/* Connection dots — left & right */}
                <ConnectionLine direction="left" delay={0} />
                <ConnectionLine direction="right" delay={0.8} />
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-4">
                <FeatureNode
                  icon={Users}
                  title={t('ecosystem.familyTitle')}
                  description={t('ecosystem.familyDesc')}
                  color="wellness"
                  tag={t('ecosystem.legendFeature')}
                  delay={150}
                />
                <FeatureNode
                  icon={Phone}
                  title={t('ecosystem.emergencyTitle')}
                  description={t('ecosystem.emergencyDesc')}
                  color="emergency"
                  tag={t('ecosystem.legendFeature')}
                  delay={250}
                />
              </div>
            </div>

            {/* ── Tablet 2-col layout ── */}
            <div className="hidden md:grid md:grid-cols-2 lg:hidden gap-4">
              {/* Member hero — spans both columns */}
              <div className="col-span-2 flex flex-col items-center gap-3 py-4"
                style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}
              >
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-full border border-primary/20"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }}
                  />
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-glow"
                    style={{ animation: 'eco-breathe 3s ease-in-out infinite' }}
                  >
                    <User className="h-9 w-9 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-sidebar-foreground">{t('ecosystem.memberTitle')}</p>
                  <p className="text-xs text-sidebar-muted-foreground">{t('ecosystem.memberDesc')}</p>
                  <p className="text-sm font-bold text-primary mt-1 font-mono">{t('ecosystem.memberPrice')}</p>
                </div>
                <Badge className="bg-primary text-white border-0 text-xs">{t('ecosystem.freeTrialBadge')}</Badge>
              </div>

              <FeatureNode icon={Bot} title={t('ecosystem.claraTitle')} description={t('ecosystem.claraDesc')} color="primary" tag={t('ecosystem.legendFeature')} delay={100} />
              <FeatureNode icon={Users} title={t('ecosystem.familyTitle')} description={t('ecosystem.familyDesc')} color="wellness" tag={t('ecosystem.legendFeature')} delay={150} />
              <FeatureNode icon={Sparkles} title={t('ecosystem.addOnsTitle')} description={t('ecosystem.addOnsDesc')} color="warning" tag={t('ecosystem.legendAddOn')} delay={200}>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Users className="h-2.5 w-2.5" /> Family</Badge>
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Heart className="h-2.5 w-2.5" /> Wellbeing</Badge>
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Pill className="h-2.5 w-2.5" /> Meds</Badge>
                </div>
              </FeatureNode>
              <FeatureNode icon={Phone} title={t('ecosystem.emergencyTitle')} description={t('ecosystem.emergencyDesc')} color="emergency" tag={t('ecosystem.legendFeature')} delay={250} />
              <div className="col-span-2">
                <FeatureNode icon={Bluetooth} title={t('ecosystem.pendantTitle')} description={t('ecosystem.pendantDesc')} color="guardian" tag={t('ecosystem.legendFeature')} delay={300} />
              </div>
            </div>

            {/* ── Mobile single-col layout ── */}
            <div className="flex flex-col gap-4 md:hidden">
              {/* Member hero */}
              <div className="flex flex-col items-center gap-3 py-4"
                style={{ animation: 'eco-fade-up 0.5s ease-out 0ms both' }}
              >
                <div className="relative">
                  <div
                    className="absolute -inset-3 rounded-full border border-primary/20"
                    style={{ animation: 'eco-radar 3s ease-out infinite' }}
                  />
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-glow"
                    style={{ animation: 'eco-breathe 3s ease-in-out infinite' }}
                  >
                    <User className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-sidebar-foreground">{t('ecosystem.memberTitle')}</p>
                  <p className="text-xs text-sidebar-muted-foreground">{t('ecosystem.memberDesc')}</p>
                  <p className="text-sm font-bold text-primary mt-1 font-mono">{t('ecosystem.memberPrice')}</p>
                </div>
                <Badge className="bg-primary text-white border-0 text-xs">{t('ecosystem.freeTrialBadge')}</Badge>
              </div>

              <FeatureNode icon={Bot} title={t('ecosystem.claraTitle')} description={t('ecosystem.claraDesc')} color="primary" tag={t('ecosystem.legendFeature')} delay={100} />
              <FeatureNode icon={Users} title={t('ecosystem.familyTitle')} description={t('ecosystem.familyDesc')} color="wellness" tag={t('ecosystem.legendFeature')} delay={150} />
              <FeatureNode icon={Phone} title={t('ecosystem.emergencyTitle')} description={t('ecosystem.emergencyDesc')} color="emergency" tag={t('ecosystem.legendFeature')} delay={200} />
              <FeatureNode icon={Bluetooth} title={t('ecosystem.pendantTitle')} description={t('ecosystem.pendantDesc')} color="guardian" tag={t('ecosystem.legendFeature')} delay={250} />
              <FeatureNode icon={Sparkles} title={t('ecosystem.addOnsTitle')} description={t('ecosystem.addOnsDesc')} color="warning" tag={t('ecosystem.legendAddOn')} delay={300}>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Users className="h-2.5 w-2.5" /> Family</Badge>
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Heart className="h-2.5 w-2.5" /> Wellbeing</Badge>
                  <Badge className="text-[10px] gap-1 px-1.5 py-0 bg-sidebar border-sidebar-border text-sidebar-muted-foreground"><Pill className="h-2.5 w-2.5" /> Meds</Badge>
                </div>
              </FeatureNode>
            </div>
          </div>

          {/* ── CLARA Complete Banner ── */}
          <div className="mx-6 mb-4 rounded-xl border border-primary/20 p-4 relative overflow-hidden">
            {/* Shimmer background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.06) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'eco-shimmer 3s linear infinite',
              }}
              aria-hidden="true"
            />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-bold text-sidebar-foreground">
                    {t('ecosystem.claraCompleteTitle')}
                  </span>
                  <span className="ml-2 text-xs text-sidebar-muted-foreground">
                    {t('ecosystem.claraCompleteDesc')}
                  </span>
                </div>
              </div>
              <Badge className="bg-primary text-white border-0 shrink-0 font-medium">
                {t('ecosystem.claraCompletePrice')}
              </Badge>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 pb-3
            text-[10px] font-medium uppercase tracking-wider text-sidebar-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
              <span>{t('ecosystem.legendMember')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-wellness" />
              <span>{t('ecosystem.legendFeature')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span>{t('ecosystem.legendAddOn')}</span>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="px-6 pb-6 pt-2 text-center space-y-3 border-t border-sidebar-border">
            <Button
              asChild
              size="lg"
              className="
                bg-primary text-white hover:bg-primary/90
                rounded-full px-8 shadow-primary
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg
              "
            >
              <Link to="/register?trial=true">
                <Shield className="h-4 w-4 mr-2" />
                {t('ecosystem.startTrial')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-[11px] text-sidebar-muted-foreground">
              {t('ecosystem.noCreditCard')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EcosystemMapModal;
