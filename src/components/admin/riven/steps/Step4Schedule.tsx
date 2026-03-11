import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { RivenSpeech } from "../RivenSpeech";
import type { PlatformConfig } from "@/hooks/useRivenWizard";

const DURATION_OPTIONS = [7, 14, 30, 60, 90];
const DAY_OPTIONS: Array<{ value: "all" | "weekdays" | "weekends"; label: string }> = [
  { value: "all", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekends", label: "Weekends" },
];

interface Step4ScheduleProps {
  platforms: Record<string, PlatformConfig>;
  duration: number;
  totalPosts: number;
  enabledPlatforms: string[];
  onUpdatePlatform: (platform: string, config: Partial<PlatformConfig>) => void;
  onSetDuration: (days: number) => void;
}

export function Step4Schedule({
  platforms,
  duration,
  totalPosts,
  enabledPlatforms,
  onUpdatePlatform,
  onSetDuration,
}: Step4ScheduleProps) {
  return (
    <div className="space-y-6">
      <RivenSpeech text="How often should I post on each platform?" />

      {/* Duration selector */}
      <div>
        <Label className="text-sm font-semibold">Campaign Duration</Label>
        <div className="flex gap-2 mt-2">
          {DURATION_OPTIONS.map((d) => (
            <Button
              key={d}
              variant={duration === d ? "default" : "outline"}
              size="sm"
              onClick={() => onSetDuration(d)}
            >
              {d} days
            </Button>
          ))}
        </div>
      </div>

      {/* Per-platform config */}
      <div className="space-y-3">
        {enabledPlatforms.map((platform) => {
          const config = platforms[platform];
          if (!config?.enabled) return null;

          return (
            <Card key={platform} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium text-sm capitalize">{platform}</p>
                <div className="flex items-center gap-2">
                  {DAY_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={config.days === opt.value ? "default" : "ghost"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => onUpdatePlatform(platform, { days: opt.value })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Posts/day:</Label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdatePlatform(platform, {
                          posts_per_day: Math.max(1, config.posts_per_day - 1),
                        })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-bold">
                      {config.posts_per_day}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdatePlatform(platform, {
                          posts_per_day: Math.min(10, config.posts_per_day + 1),
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Posting times:</Label>
                  <Input
                    type="text"
                    className="h-7 text-xs mt-1"
                    placeholder="09:00, 12:00, 18:00"
                    value={config.times.join(", ")}
                    onChange={(e) =>
                      onUpdatePlatform(platform, {
                        times: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Total summary */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 text-center">
        <p className="text-sm">
          I'll create{" "}
          <span className="text-primary font-bold text-lg">{totalPosts}</span>{" "}
          unique posts across {enabledPlatforms.length} platform
          {enabledPlatforms.length !== 1 ? "s" : ""} over {duration} days
        </p>
      </div>
    </div>
  );
}
