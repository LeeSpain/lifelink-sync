import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RivenSpeech } from "../RivenSpeech";
import type { PlatformConfig } from "@/hooks/useRivenWizard";

const PLATFORM_INFO: Record<string, { label: string; color: string; desc: string }> = {
  twitter: { label: "Twitter / X", color: "bg-sky-500", desc: "Threads & single posts" },
  tiktok: { label: "TikTok", color: "bg-pink-500", desc: "Video scripts & captions" },
  facebook: { label: "Facebook", color: "bg-blue-600", desc: "Posts & stories" },
  linkedin: { label: "LinkedIn", color: "bg-blue-700", desc: "Articles & posts" },
  instagram: { label: "Instagram", color: "bg-gradient-to-br from-purple-500 to-pink-500", desc: "Captions & hashtags" },
  blog: { label: "Blog", color: "bg-emerald-500", desc: "Full SEO articles" },
  email: { label: "Email Newsletter", color: "bg-amber-500", desc: "Via Resend" },
};

interface Step3PlatformsProps {
  platforms: Record<string, PlatformConfig>;
  onToggle: (platform: string) => void;
  onSelectAll: () => void;
  totalPosts: number;
}

export function Step3Platforms({ platforms, onToggle, onSelectAll, totalPosts }: Step3PlatformsProps) {
  const enabledCount = Object.values(platforms).filter((p) => p.enabled).length;

  return (
    <div className="space-y-6">
      <RivenSpeech text="Which platforms do you want to publish on?" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {enabledCount} platform{enabledCount !== 1 ? "s" : ""} selected
        </p>
        <Button variant="outline" size="sm" onClick={onSelectAll}>
          Full Pack (All)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(PLATFORM_INFO).map(([key, info]) => {
          const isEnabled = platforms[key]?.enabled ?? false;
          return (
            <Card
              key={key}
              className={cn(
                "p-4 cursor-pointer transition-all",
                isEnabled
                  ? "border-primary ring-2 ring-primary/20"
                  : "opacity-60 hover:opacity-100 hover:border-primary/30"
              )}
              onClick={() => onToggle(key)}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full flex-shrink-0", info.color)} />
                <div>
                  <p className="font-medium text-sm">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {enabledCount > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
          <p className="text-sm font-medium">
            Estimated: <span className="text-primary font-bold">{totalPosts}</span> unique posts across{" "}
            {enabledCount} platform{enabledCount !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
