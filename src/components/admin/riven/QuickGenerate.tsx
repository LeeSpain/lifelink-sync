import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { RivenSpeech } from "./RivenSpeech";
import { useRivenCampaign } from "@/hooks/useRivenCampaign";
import { useToast } from "@/hooks/use-toast";

const CONTENT_TYPES = [
  { value: "blog", label: "Blog Post" },
  { value: "email", label: "Email Newsletter" },
  { value: "twitter", label: "Twitter / X" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

interface GeneratedContent {
  platform: string;
  title: string;
  body_text: string;
  hashtags: string[];
}

export function QuickGenerate() {
  const { generateSingleContent } = useRivenCampaign();
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["blog"]);
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedContent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleGenerate = async () => {
    if (!topic.trim() || selectedPlatforms.length === 0) return;
    setLoading(true);
    setResults([]);

    try {
      const data = await generateSingleContent({
        goal: "content generation",
        audience: "general",
        tone,
        platforms: selectedPlatforms,
        topic: topic.trim(),
        seo_optimize: selectedPlatforms.includes("blog"),
      });

      if (data?.content) {
        setResults(data.content);
      }
    } catch (err) {
      toast({
        title: "Generation failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <RivenSpeech text="Need a quick piece of content? Tell me what you need and I'll write it." />

      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Topic</Label>
          <Textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Write about why families need emergency protection in 2026"
            className="mt-1 min-h-[80px]"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Platforms</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CONTENT_TYPES.map((ct) => (
              <Button
                key={ct.value}
                variant={selectedPlatforms.includes(ct.value) ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={() => togglePlatform(ct.value)}
              >
                {ct.label}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold">Tone</Label>
          <Input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            placeholder="professional, warm, urgent..."
            className="mt-1"
          />
        </div>

        <Button onClick={handleGenerate} disabled={loading || !topic.trim() || selectedPlatforms.length === 0}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Riven is writing...
            </>
          ) : (
            "Generate Content"
          )}
        </Button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Generated Content</h3>
          {results.map((result, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase text-primary">
                  {result.platform}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    handleCopy(
                      `${result.title}\n\n${result.body_text}\n\n${result.hashtags?.join(" ") || ""}`,
                      `${i}`
                    )
                  }
                >
                  {copiedId === `${i}` ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="font-medium text-sm mb-2">{result.title}</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {result.body_text}
              </p>
              {result.hashtags?.length > 0 && (
                <p className="text-xs text-primary/70 mt-2">{result.hashtags.join(" ")}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
