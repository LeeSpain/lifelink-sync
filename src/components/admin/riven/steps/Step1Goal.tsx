import { Megaphone, Target, Tag, CalendarDays, BookOpen, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CampaignGoal } from "@/hooks/useRivenWizard";
import { RivenSpeech } from "../RivenSpeech";

const GOALS: Array<{ value: CampaignGoal; label: string; desc: string; icon: React.ElementType }> = [
  { value: "brand_awareness", label: "Brand Awareness", desc: "Introduce LifeLink to new audiences", icon: Megaphone },
  { value: "lead_generation", label: "Lead Generation", desc: "Drive sign-ups and free trials", icon: Target },
  { value: "product_promotion", label: "Product Promotion", desc: "Highlight features and devices", icon: Tag },
  { value: "event_announcement", label: "Event / Announcement", desc: "Launch events and news", icon: CalendarDays },
  { value: "educational_content", label: "Educational Content", desc: "Teach about safety and protection", icon: BookOpen },
  { value: "customer_retention", label: "Customer Retention", desc: "Engage and retain existing users", icon: Heart },
];

interface Step1GoalProps {
  selected: CampaignGoal | null;
  onSelect: (goal: CampaignGoal) => void;
}

export function Step1Goal({ selected, onSelect }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <RivenSpeech text="Hi, I'm Riven. Let's build your campaign. What's the goal?" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected === goal.value;
          return (
            <Card
              key={goal.value}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-primary/50",
                isSelected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onSelect(goal.value)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm">{goal.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{goal.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
