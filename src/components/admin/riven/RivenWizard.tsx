import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRivenWizard } from "@/hooks/useRivenWizard";
import { useRivenCampaign } from "@/hooks/useRivenCampaign";
import { useToast } from "@/hooks/use-toast";
import { Step1Goal } from "./steps/Step1Goal";
import { Step2Audience } from "./steps/Step2Audience";
import { Step3Platforms } from "./steps/Step3Platforms";
import { Step4Schedule } from "./steps/Step4Schedule";
import { Step5Themes } from "./steps/Step5Themes";
import { Step6Preview } from "./steps/Step6Preview";
import { Step7Launch } from "./steps/Step7Launch";

const STEP_LABELS = ["Goal", "Audience", "Platforms", "Schedule", "Themes", "Preview", "Launch"];

interface RivenWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function RivenWizard({ onComplete, onCancel }: RivenWizardProps) {
  const wizard = useRivenWizard();
  const campaign = useRivenCampaign();
  const { toast } = useToast();
  const [launchComplete, setLaunchComplete] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const handleLaunch = async () => {
    setLaunchError(null);
    try {
      const payload = wizard.buildPayload();
      await campaign.generateCampaign(payload);
      setLaunchComplete(true);
      setTimeout(() => onComplete(), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Campaign generation failed";
      setLaunchError(message);
      toast({
        title: "Launch Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (wizard.state.step) {
      case 1:
        return <Step1Goal selected={wizard.state.goal} onSelect={wizard.setGoal} />;
      case 2:
        return (
          <Step2Audience
            selectedAudiences={wizard.state.audiences}
            selectedTone={wizard.state.tone}
            onToggleAudience={wizard.toggleAudience}
            onSelectTone={wizard.setTone}
          />
        );
      case 3:
        return (
          <Step3Platforms
            platforms={wizard.state.platforms}
            onToggle={wizard.togglePlatform}
            onSelectAll={wizard.selectAllPlatforms}
            totalPosts={wizard.totalPosts}
          />
        );
      case 4:
        return (
          <Step4Schedule
            platforms={wizard.state.platforms}
            duration={wizard.state.duration}
            totalPosts={wizard.totalPosts}
            enabledPlatforms={wizard.enabledPlatforms}
            onUpdatePlatform={wizard.updatePlatformConfig}
            onSetDuration={wizard.setDuration}
          />
        );
      case 5:
        return (
          <Step5Themes
            themes={wizard.state.weeklyThemes}
            duration={wizard.state.duration}
            onUpdate={wizard.updateTheme}
            onAdd={wizard.addTheme}
            onRemove={wizard.removeTheme}
          />
        );
      case 6:
        return (
          <Step6Preview
            enabledPlatforms={wizard.enabledPlatforms}
            goal={wizard.state.goal || ""}
            tone={wizard.state.tone || ""}
            audiences={wizard.state.audiences}
            approved={wizard.state.previewApproved}
            onApprove={wizard.setPreviewApproved}
          />
        );
      case 7:
        return (
          <Step7Launch
            campaignTitle={wizard.state.campaignTitle}
            startDate={wizard.state.startDate}
            totalPosts={wizard.totalPosts}
            enabledPlatforms={wizard.enabledPlatforms}
            duration={wizard.state.duration}
            generating={campaign.generating}
            progress={campaign.generationProgress}
            onSetTitle={wizard.setCampaignTitle}
            onSetStartDate={wizard.setStartDate}
            onLaunch={handleLaunch}
            launchComplete={launchComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step progress */}
      <div className="flex items-center justify-between mb-8">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = wizard.state.step === stepNum;
          const isComplete = wizard.state.step > stepNum;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? "✓" : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1 hidden sm:block",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-6 sm:w-10 mx-1",
                    isComplete ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation */}
      {!launchComplete && !campaign.generating && (
        <div className="flex items-center justify-between mt-8 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={wizard.state.step === 1 ? onCancel : wizard.prevStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {wizard.state.step === 1 ? "Cancel" : "Back"}
          </Button>

          {wizard.state.step < wizard.totalSteps && (
            <Button onClick={wizard.nextStep} disabled={!wizard.canProceed}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
