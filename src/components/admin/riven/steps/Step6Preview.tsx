import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RivenSpeech } from "../RivenSpeech";
import { supabase } from "@/integrations/supabase/client";

interface PreviewContent {
  platform: string;
  title: string;
  body_text: string;
  hashtags: string[];
}

interface Step6PreviewProps {
  enabledPlatforms: string[];
  goal: string;
  tone: string;
  audiences: string[];
  approved: boolean;
  onApprove: (approved: boolean) => void;
}

// Static fallback previews when edge function is unavailable
const FALLBACK_PREVIEWS: Record<string, PreviewContent> = {
  twitter: {
    platform: "twitter",
    title: "Emergency protection for families",
    body_text:
      "Your family's safety shouldn't depend on luck. LifeLink Sync gives you 24/7 AI-powered emergency protection — one tap and help is on the way. 🛡️",
    hashtags: ["#FamilySafety", "#EmergencyProtection", "#LifeLinkSync"],
  },
  facebook: {
    platform: "facebook",
    title: "Why every family needs an emergency plan",
    body_text:
      "Most families think emergencies won't happen to them — until they do.\n\nLifeLink Sync provides round-the-clock protection with AI-powered emergency detection, instant SOS alerts, and real-time family coordination.\n\nBecause peace of mind isn't optional. It's essential.",
    hashtags: ["#FamilySafety", "#LifeLinkSync"],
  },
  linkedin: {
    platform: "linkedin",
    title: "The future of family emergency response",
    body_text:
      "Emergency response is being transformed by AI. At LifeLink Sync, we've built an intelligent protection platform that monitors, detects, and coordinates — so families are never left waiting.\n\nOur CLARA AI assistant provides 24/7 guidance, medication reminders, and instant SOS coordination. This isn't just an app — it's a safety net powered by technology.",
    hashtags: ["#SafetyTech", "#AIInnovation", "#EmergencyResponse"],
  },
  instagram: {
    platform: "instagram",
    title: "Always there. Always ready. 🛡️",
    body_text:
      "Your family deserves protection that never sleeps. ✨\n\nLifeLink Sync uses AI to keep your loved ones safe — 24/7 monitoring, instant SOS, and smart emergency coordination.\n\nBecause every second counts. 💙",
    hashtags: ["#FamilyFirst", "#SafetyFirst", "#LifeLinkSync", "#EmergencyReady", "#Protection"],
  },
  tiktok: {
    platform: "tiktok",
    title: "What if your phone could save your life?",
    body_text:
      "[HOOK] What if your phone could save your life in an emergency?\n\n[BODY] LifeLink Sync uses AI to detect emergencies, alert your family, and share your exact location — all with one tap.\n\n[CTA] Link in bio to start your free trial 🛡️",
    hashtags: ["#SafetyTech", "#LifeHack", "#Emergency", "#FamilySafety"],
  },
  blog: {
    platform: "blog",
    title: "5 Reasons Every Family Needs an Emergency Protection Plan",
    body_text:
      "Emergencies don't announce themselves. Whether it's a medical event, a natural disaster, or a safety concern, having a coordinated plan can make the difference between chaos and calm.\n\nIn this article, we explore why modern families are turning to AI-powered protection platforms like LifeLink Sync to stay safe.",
    hashtags: ["#EmergencyPlanning", "#FamilySafety"],
  },
  email: {
    platform: "email",
    title: "Your family's safety starts here",
    body_text:
      "Hi there,\n\nWe built LifeLink Sync because we believe every family deserves round-the-clock protection.\n\nWith our AI assistant CLARA, instant SOS alerts, and real-time family coordination, you'll have peace of mind knowing help is always one tap away.\n\nStart your free 7-day trial today.",
    hashtags: [],
  },
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const TIMEOUT_MS = 60_000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function Step6Preview({
  enabledPlatforms,
  goal,
  tone,
  audiences,
  approved,
  onApprove,
}: Step6PreviewProps) {
  const [previews, setPreviews] = useState<PreviewContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const invokeWithRetry = async (
    platforms: string[],
    retries = MAX_RETRIES
  ): Promise<PreviewContent[] | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const { data, error } = await supabase.functions.invoke(
          "riven-content-single",
          {
            body: {
              goal,
              audience: audiences.join(", "),
              tone,
              platforms,
              topic:
                "Day 1 sample: Introduce LifeLink Sync emergency protection for families",
            },
          }
        );

        clearTimeout(timeout);

        if (error) {
          // Parse structured error from edge function
          const errorBody = typeof error === "object" && error?.context?.body
            ? JSON.parse(error.context.body)
            : null;
          const code = errorBody?.code || data?.code;

          // Don't retry if not configured — it won't help
          if (code === "NOT_CONFIGURED") {
            throw new Error("NOT_CONFIGURED");
          }

          throw new Error(
            errorBody?.error || data?.error || "Edge function error"
          );
        }

        if (data?.content) {
          return data.content;
        }

        throw new Error("No content in response");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);

        // Don't retry on non-recoverable errors
        if (msg === "NOT_CONFIGURED") {
          throw err;
        }

        if (attempt < retries) {
          console.warn(`Preview attempt ${attempt} failed: ${msg}. Retrying...`);
          await sleep(RETRY_DELAY_MS);
        } else {
          throw err;
        }
      }
    }
    return null;
  };

  const generatePreviews = async () => {
    setLoading(true);
    setErrorMsg(null);
    setUsingFallback(false);

    try {
      const content = await invokeWithRetry(enabledPlatforms);
      if (content) {
        setPreviews(content);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Show fallback previews
      const fallbacks = enabledPlatforms
        .map((p) => FALLBACK_PREVIEWS[p])
        .filter(Boolean);

      if (fallbacks.length > 0) {
        setPreviews(fallbacks);
        setUsingFallback(true);

        if (msg === "NOT_CONFIGURED") {
          setErrorMsg(
            "The AI content engine is not configured yet. Showing example previews — you can still launch your campaign and Riven will generate all content once configured."
          );
        } else {
          setErrorMsg(
            "Live preview is temporarily unavailable. Showing example previews — you can still launch your campaign and Riven will generate all content."
          );
        }
      } else {
        setErrorMsg(
          "Preview generation failed after multiple attempts. You can skip this step and launch anyway — Riven will generate content when available."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const regenerateSingle = async (platform: string) => {
    setLoadingPlatform(platform);
    setErrorMsg(null);

    try {
      const content = await invokeWithRetry([platform], 2);
      if (content?.[0]) {
        setPreviews((prev) =>
          prev.map((p) => (p.platform === platform ? content[0] : p))
        );
        // If we successfully regenerated, clear fallback for this platform
        if (usingFallback) {
          setUsingFallback(false);
        }
      }
    } catch {
      setErrorMsg("Regeneration failed. The example preview is still shown.");
    } finally {
      setLoadingPlatform(null);
    }
  };

  // Allow proceeding even without previews when fallback is active
  const canSkipPreview = usingFallback || errorMsg !== null;

  return (
    <div className="space-y-6">
      <RivenSpeech
        text={
          usingFallback
            ? "I'm showing example previews for now. You can still approve the style and launch — I'll generate fresh content for every post."
            : previews.length > 0
            ? "Here's Day 1 content for each platform. Happy with the style?"
            : "Let me generate a Day 1 preview so you can approve the style before I build the full campaign."
        }
      />

      {/* Fallback banner */}
      {usingFallback && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              Live preview unavailable
            </p>
            <p className="text-amber-700 mt-1">
              {errorMsg ||
                "Showing example content. You can still launch your campaign and Riven will generate all content."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={generatePreviews}
              disabled={loading}
            >
              <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Error without fallback */}
      {errorMsg && !usingFallback && previews.length === 0 && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <p className="text-sm text-destructive mb-3">{errorMsg}</p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={generatePreviews}
            disabled={loading}
          >
            <RefreshCw className={cn("h-3 w-3 mr-1", loading && "animate-spin")} />
            Try Again
          </Button>
        </div>
      )}

      {/* Generate button */}
      {previews.length === 0 && !errorMsg && (
        <div className="text-center py-8">
          <Button onClick={generatePreviews} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Riven is writing your Day 1 preview...
              </>
            ) : (
              "Generate Day 1 Previews"
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            This may take 15-30 seconds
          </p>
        </div>
      )}

      {/* Preview cards */}
      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {previews.map((preview) => (
              <Card
                key={preview.platform}
                className={cn("p-4", usingFallback && "border-dashed border-amber-300")}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-primary">
                      {preview.platform}
                    </span>
                    {usingFallback && (
                      <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                        example
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => regenerateSingle(preview.platform)}
                    disabled={loadingPlatform === preview.platform}
                  >
                    {loadingPlatform === preview.platform ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    <span className="ml-1 text-xs">Regenerate</span>
                  </Button>
                </div>
                <p className="font-medium text-sm mb-1">{preview.title}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {preview.body_text}
                </p>
                {preview.hashtags?.length > 0 && (
                  <p className="text-xs text-primary/70 mt-2">
                    {preview.hashtags.join(" ")}
                  </p>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              variant={approved ? "outline" : "default"}
              onClick={() => onApprove(!approved)}
              className={cn(approved && "border-green-500 text-green-600")}
            >
              {approved ? (
                <>
                  <Check className="h-4 w-4 mr-2" /> Style Approved
                </>
              ) : (
                "Approve Style"
              )}
            </Button>
          </div>
        </>
      )}

      {/* Skip button when preview completely failed */}
      {canSkipPreview && previews.length === 0 && (
        <div className="text-center pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onApprove(true)}
            className="text-xs text-muted-foreground"
          >
            Skip preview and continue to launch
          </Button>
        </div>
      )}
    </div>
  );
}
