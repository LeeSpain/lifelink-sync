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
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface EcosystemMapModalProps {
  trigger?: React.ReactNode;
}

interface NodeProps {
  icon: React.ElementType;
  title: string;
  description: string;
  variant?: 'hero' | 'feature' | 'addon';
  children?: React.ReactNode;
}

const EcosystemNode: React.FC<NodeProps> = ({ icon: Icon, title, description, variant = 'feature', children }) => {
  const isHero = variant === 'hero';
  const isAddon = variant === 'addon';

  return (
    <div
      className={`rounded-xl border p-4 transition-shadow duration-200 hover:shadow-md ${
        isHero
          ? 'border-primary bg-primary/5 shadow-sm'
          : isAddon
            ? 'border-dashed border-border bg-muted/30'
            : 'border-border bg-background'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isHero ? 'bg-primary text-white' : isAddon ? 'bg-muted text-primary' : 'bg-primary/10 text-primary'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className={`font-bold ${isHero ? 'text-base text-foreground' : 'text-sm text-foreground'}`}>
            {title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
};

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
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <h2 className="text-xl font-bold text-foreground">{t('ecosystem.title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('ecosystem.subtitle')}</p>
        </div>

        {/* Ecosystem Grid */}
        <div className="grid gap-3 px-6 py-4 md:grid-cols-3">
          {/* Left column — CLARA AI + Add-ons */}
          <div className="flex flex-col gap-3">
            <EcosystemNode
              icon={Bot}
              title={t('ecosystem.claraTitle')}
              description={t('ecosystem.claraDesc')}
            />
            <EcosystemNode
              icon={Sparkles}
              title={t('ecosystem.addOnsTitle')}
              description={t('ecosystem.addOnsDesc')}
              variant="addon"
            >
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                  <Users className="h-2.5 w-2.5" />
                  Family
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                  <Heart className="h-2.5 w-2.5" />
                  Wellbeing
                </Badge>
                <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                  <Pill className="h-2.5 w-2.5" />
                  Meds
                </Badge>
              </div>
            </EcosystemNode>
          </div>

          {/* Center column — Member (hero) + Pendant */}
          <div className="flex flex-col gap-3">
            <EcosystemNode
              icon={Shield}
              title={t('ecosystem.memberTitle')}
              description={t('ecosystem.memberDesc')}
              variant="hero"
            />
            <EcosystemNode
              icon={Bluetooth}
              title={t('ecosystem.pendantTitle')}
              description={t('ecosystem.pendantDesc')}
            />
          </div>

          {/* Right column — Family Network + Emergency Response */}
          <div className="flex flex-col gap-3">
            <EcosystemNode
              icon={Users}
              title={t('ecosystem.familyTitle')}
              description={t('ecosystem.familyDesc')}
            />
            <EcosystemNode
              icon={Phone}
              title={t('ecosystem.emergencyTitle')}
              description={t('ecosystem.emergencyDesc')}
            />
          </div>
        </div>

        {/* Connection lines — desktop only */}
        <div className="hidden md:flex items-center justify-center gap-2 px-6 pb-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {t('ecosystem.title')}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* CLARA Complete Banner */}
        <div className="mx-6 mb-3 rounded-xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <div>
                <span className="text-sm font-bold text-foreground">
                  {t('ecosystem.claraCompleteTitle')}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {t('ecosystem.claraCompleteDesc')}
                </span>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0">
              {t('ecosystem.claraCompletePrice')}
            </Badge>
          </div>
        </div>

        {/* CTA + Legend */}
        <div className="px-6 pb-6 space-y-4">
          <div className="text-center">
            <Button asChild className="bg-primary text-white hover:bg-primary/90">
              <Link to="/register?trial=true">
                <Shield className="h-4 w-4 mr-2" />
                {t('ecosystem.startTrial')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span>{t('ecosystem.legendMember')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
              <span>{t('ecosystem.legendFeature')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground" />
              <span>{t('ecosystem.legendAddOn')}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EcosystemMapModal;
