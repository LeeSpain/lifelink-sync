import { Megaphone, Target, Tag, CalendarDays, BookOpen, Heart, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CampaignGoal } from "@/hooks/useRivenWizard";
import { RivenSpeech } from "../RivenSpeech";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

function LeadPipelineHint() {
  const { data: counts } = useQuery({
    queryKey: ['lead-pipeline-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('leads').select('invite_status');
      if (!data) return null;
      const c: Record<string, number> = {};
      data.forEach((l: any) => { c[l.invite_status || 'not_invited'] = (c[l.invite_status || 'not_invited'] || 0) + 1; });
      return c;
    },
    staleTime: 60_000,
  });

  if (!counts || Object.values(counts).reduce((a, b) => a + b, 0) === 0) return null;

  const invited = counts.invited || 0;
  const clicked = counts.clicked || 0;
  const talking = counts.talking || 0;
  const trial = counts.trial || 0;
  const subscribed = counts.subscribed || 0;

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-3">
      <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="text-xs">
        <p className="font-medium text-blue-800">Your lead pipeline</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {invited > 0 && <Badge className="bg-blue-100 text-blue-700 text-[10px]">{invited} invited</Badge>}
          {clicked > 0 && <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">{clicked} clicked</Badge>}
          {talking > 0 && <Badge className="bg-purple-100 text-purple-700 text-[10px]">{talking} talking</Badge>}
          {trial > 0 && <Badge className="bg-green-100 text-green-700 text-[10px]">{trial} in trial</Badge>}
          {subscribed > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{subscribed} subscribed</Badge>}
        </div>
        {trial > 0 && (
          <p className="text-blue-600 mt-1">Consider a "trial conversion" campaign targeting your {trial} trial user{trial > 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
}

export function Step1Goal({ selected, onSelect }: Step1GoalProps) {
  return (
    <div className="space-y-6">
      <RivenSpeech text="Hi, I'm Riven. Let's build your campaign. What's the goal?" />

      <LeadPipelineHint />

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
