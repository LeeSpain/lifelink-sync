import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Loader2 } from "lucide-react";
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

  const generatePreviews = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("riven-content-single", {
        body: {
          goal,
          audience: audiences.join(", "),
          tone,
          platforms: enabledPlatforms,
          topic: "Day 1 sample: Introduce LifeLink Sync emergency protection for families",
        },
      });

      if (error) throw error;
      if (data?.content) {
        setPreviews(data.content);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Preview generation failed. Check your API key configuration.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateSingle = async (platform: string) => {
    setLoadingPlatform(platform);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.functions.invoke("riven-content-single", {
        body: {
          goal,
          audience: audiences.join(", "),
          tone,
          platforms: [platform],
          topic: "Day 1 sample: Introduce LifeLink Sync emergency protection for families",
        },
      });

      if (error) throw error;
      if (data?.content?.[0]) {
        setPreviews((prev) =>
          prev.map((p) => (p.platform === platform ? data.content[0] : p))
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setLoadingPlatform(null);
    }
  };

  return (
    <div className="space-y-6">
      <RivenSpeech
        text={
          previews.length > 0
            ? "Here's Day 1 content for each platform. Happy with the style?"
            : "Let me generate a Day 1 preview so you can approve the style before I build the full campaign."
        }
      />

      {errorMsg && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      {previews.length === 0 && (
        <div className="text-center py-8">
          <Button onClick={generatePreviews} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Riven is writing...
              </>
            ) : (
              "Generate Day 1 Previews"
            )}
          </Button>
        </div>
      )}

      {previews.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {previews.map((preview) => (
              <Card key={preview.platform} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-primary">
                    {preview.platform}
                  </span>
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

          <div className="flex justify-center">
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
    </div>
  );
}
