import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAddons, useAddonMutation, AddonCatalogItem } from '@/hooks/useAddons';
import { useToast } from '@/hooks/use-toast';
import { Heart, Users, Pill, Sparkles, Plus, X, Loader2 } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Pill: <Pill className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  family: 'bg-muted/50',
  wellness: 'bg-muted/50',
};

const AddOnCard: React.FC<{
  addon: AddonCatalogItem;
  isActive: boolean;
  onAdd: () => void;
  onRemove: () => void;
  isLoading: boolean;
}> = ({ addon, isActive, onAdd, onRemove, isLoading }) => {
  const { t } = useTranslation();
  const features: string[] = Array.isArray(addon.features)
    ? addon.features
    : [];

  return (
    <div className={`rounded-lg border p-4 ${categoryColors[addon.category] || 'bg-muted/50'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-primary">
            {iconMap[addon.icon || ''] || <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{addon.name}</h4>
            {addon.slug === 'family_link' && (
              <span className="text-xs text-green-600 font-medium">{t('addons.firstLinkFree')}</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold text-base">&euro;{addon.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">/mo</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{addon.description}</p>

      {features.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 mb-3">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <span className="text-green-500">&#10003;</span> {f}
            </li>
          ))}
        </ul>
      )}

      {isActive ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onRemove}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
          {t('addons.remove')}
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full"
          onClick={onAdd}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          {t('addons.addBtn')}
        </Button>
      )}
    </div>
  );
};

const AddOnMarketplace: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useAddons();
  const mutation = useAddonMutation();
  const { toast } = useToast();

  const handleAdd = async (slug: string) => {
    try {
      await mutation.mutateAsync({ action: 'add', addon_slug: slug });
      toast({ title: t('addons.activated'), description: t('addons.activatedDesc', { name: slug.replace('_', ' ') }) });
    } catch (err: any) {
      toast({ title: t('subscriptionCard.errorTitle'), description: err.message, variant: 'destructive' });
    }
  };

  const handleRemove = async (slug: string) => {
    try {
      await mutation.mutateAsync({ action: 'remove', addon_slug: slug });
      toast({ title: t('addons.removed'), description: t('addons.removedDesc', { name: slug.replace('_', ' ') }) });
    } catch (err: any) {
      toast({ title: t('subscriptionCard.errorTitle'), description: err.message, variant: 'destructive' });
    }
  };

  const activeSlugs = data?.active_addons || [];

  if (isLoading) {
    return (
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('addons.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('addons.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('addons.unableToLoad')}</p>
        </CardContent>
      </Card>
    );
  }

  const catalog = data?.catalog || [];

  // Calculate monthly cost
  const addonCost = catalog
    .filter(a => activeSlugs.includes(a.slug))
    .reduce((sum, a) => {
      if (a.slug === 'family_link') return sum; // 1st free
      return sum + a.price;
    }, 0);

  return (
    <Card className="">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('addons.title')}
            {activeSlugs.length > 0 && (
              <Badge variant="secondary">{t('addons.active', { count: activeSlugs.length })}</Badge>
            )}
          </CardTitle>
          {addonCost > 0 && (
            <span className="text-sm text-muted-foreground">
              +&euro;{addonCost.toFixed(2)}/mo
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CLARA Complete banner */}
        <div className={`rounded-lg border p-3 ${data?.clara_complete_unlocked
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
          : 'bg-muted/50'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className={`h-4 w-4 ${data?.clara_complete_unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="font-semibold text-sm">{t('addons.claraComplete')}</span>
            <Badge variant={data?.clara_complete_unlocked ? 'default' : 'secondary'} className="text-xs">
              {data?.clara_complete_unlocked ? t('addons.unlocked') : t('addons.locked')}
            </Badge>
            <Badge variant="outline" className="text-xs ml-auto">{t('addons.free')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data?.clara_complete_unlocked
              ? t('addons.claraUnlockedDesc')
              : t('addons.claraLockedDesc')}
          </p>
        </div>

        {/* Add-on cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {catalog.map(addon => (
            <AddOnCard
              key={addon.id}
              addon={addon}
              isActive={activeSlugs.includes(addon.slug)}
              onAdd={() => handleAdd(addon.slug)}
              onRemove={() => handleRemove(addon.slug)}
              isLoading={mutation.isPending}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddOnMarketplace;
