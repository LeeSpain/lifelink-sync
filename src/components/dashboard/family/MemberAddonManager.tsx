import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Heart, Pill, Sparkles, Settings2, Loader2 } from "lucide-react";
import { useAddons, useAddonMutation } from "@/hooks/useAddons";

interface MemberAddonManagerProps {
  memberId: string;
  memberName: string;
}

const MemberAddonManager = ({ memberId, memberName }: MemberAddonManagerProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: addonsData } = useAddons();
  const addonMutation = useAddonMutation();
  const [open, setOpen] = useState(false);

  const activeAddons = addonsData?.active_addons ?? [];
  const hasWellbeing = activeAddons.includes('daily_wellbeing');
  const hasMedication = activeAddons.includes('medication_reminder');
  const claraComplete = hasWellbeing && hasMedication;

  const handleToggleAddon = async (slug: string, isActive: boolean) => {
    try {
      await addonMutation.mutateAsync({
        action: isActive ? 'remove' : 'add',
        addon_slug: slug,
      });
      toast({
        title: isActive
          ? t('familyDashboard.addonMedication')
          : t('familyDashboard.addonWellbeing'),
        description: isActive ? 'Removed' : 'Added',
      });
    } catch (error) {
      toast({
        title: t('familyDashboard.error'),
        description: error instanceof Error ? error.message : 'Failed to update add-on',
        variant: "destructive",
      });
    }
  };

  const addonCount = (hasWellbeing ? 1 : 0) + (hasMedication ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
          <Settings2 className="h-3 w-3" />
          {t('familyDashboard.manageAddons')}
          {addonCount > 0 && (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">{addonCount}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* Wellbeing toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{t('familyDashboard.addonWellbeing')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{t('familyDashboard.addonPerMonth')}</span>
              <Button
                variant={hasWellbeing ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[10px]"
                disabled={addonMutation.isPending}
                onClick={() => handleToggleAddon('daily_wellbeing', hasWellbeing)}
              >
                {addonMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hasWellbeing ? (
                  t('familyDashboard.active')
                ) : (
                  '+ Add'
                )}
              </Button>
            </div>
          </div>

          {/* Medication toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">{t('familyDashboard.addonMedication')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{t('familyDashboard.addonPerMonth')}</span>
              <Button
                variant={hasMedication ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-[10px]"
                disabled={addonMutation.isPending}
                onClick={() => handleToggleAddon('medication_reminder', hasMedication)}
              >
                {addonMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : hasMedication ? (
                  t('familyDashboard.active')
                ) : (
                  '+ Add'
                )}
              </Button>
            </div>
          </div>

          {/* CLARA Complete badge */}
          {claraComplete && (
            <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/20">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <div>
                <p className="text-xs font-medium text-primary">{t('familyDashboard.claraComplete')}</p>
                <p className="text-[10px] text-muted-foreground">{t('familyDashboard.claraCompleteUnlocked')}</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MemberAddonManager;
