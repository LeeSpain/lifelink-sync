import { Users, HeartPulse, Building2, Globe, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AudienceSegment, ToneOption } from "@/hooks/useRivenWizard";
import { RivenSpeech } from "../RivenSpeech";

const AUDIENCES: Array<{ value: AudienceSegment; label: string; desc: string; icon: React.ElementType }> = [
  { value: "adult_children", label: "Worried Adult Children (35-55)", desc: "Caring for aging parents", icon: Users },
  { value: "active_seniors", label: "Active Seniors (65+)", desc: "Independent and safety-aware", icon: UserCheck },
  { value: "health_families", label: "Families with Health Conditions", desc: "Managing chronic conditions", icon: HeartPulse },
  { value: "businesses", label: "Businesses & Care Facilities", desc: "Professional care providers", icon: Building2 },
  { value: "general_public", label: "General Public", desc: "Anyone interested in safety", icon: Globe },
];

const TONES: Array<{ value: ToneOption; label: string; desc: string }> = [
  { value: "warm_reassuring", label: "Warm & Reassuring", desc: "Empathetic, calming, trust-building" },
  { value: "professional_authoritative", label: "Professional & Authoritative", desc: "Expert credibility, data-driven" },
  { value: "urgent_action", label: "Urgent & Action-Focused", desc: "FOMO, time-sensitive, decisive" },
  { value: "friendly_conversational", label: "Friendly & Conversational", desc: "Casual, relatable, approachable" },
  { value: "educational_informative", label: "Educational & Informative", desc: "Teaching, explaining, guiding" },
];

interface Step2AudienceProps {
  selectedAudiences: AudienceSegment[];
  selectedTone: ToneOption | null;
  onToggleAudience: (segment: AudienceSegment) => void;
  onSelectTone: (tone: ToneOption) => void;
}

export function Step2Audience({
  selectedAudiences,
  selectedTone,
  onToggleAudience,
  onSelectTone,
}: Step2AudienceProps) {
  return (
    <div className="space-y-6">
      <RivenSpeech text="Who are we talking to and how should we sound?" />

      <div>
        <h3 className="text-sm font-semibold mb-3">Target Audiences (select multiple)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AUDIENCES.map((aud) => {
            const Icon = aud.icon;
            const isSelected = selectedAudiences.includes(aud.value);
            return (
              <Card
                key={aud.value}
                className={cn(
                  "p-3 cursor-pointer transition-all hover:border-primary/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onToggleAudience(aud.value)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <p className="font-medium text-sm">{aud.label}</p>
                    <p className="text-xs text-muted-foreground">{aud.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Voice & Tone</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TONES.map((t) => (
            <Card
              key={t.value}
              className={cn(
                "p-3 cursor-pointer transition-all hover:border-primary/50",
                selectedTone === t.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onSelectTone(t.value)}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
