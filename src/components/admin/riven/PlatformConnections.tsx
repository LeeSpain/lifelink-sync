import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";
import { RivenSpeech } from "./RivenSpeech";

interface PlatformStatus {
  name: string;
  key: string;
  connected: boolean;
  description: string;
  oauthUrl?: string;
}

const PLATFORMS: PlatformStatus[] = [
  {
    name: "Twitter / X",
    key: "twitter",
    connected: false,
    description: "Post tweets, threads, and engage with your audience",
    oauthUrl: "/admin-dashboard/settings?connect=twitter",
  },
  {
    name: "LinkedIn",
    key: "linkedin",
    connected: false,
    description: "Share professional articles and company updates",
    oauthUrl: "/admin-dashboard/settings?connect=linkedin",
  },
  {
    name: "Facebook",
    key: "facebook",
    connected: false,
    description: "Publish to your Facebook Page",
    oauthUrl: "/admin-dashboard/settings?connect=facebook",
  },
  {
    name: "TikTok",
    key: "tiktok",
    connected: false,
    description: "Share video scripts and captions (manual posting)",
  },
  {
    name: "Instagram",
    key: "instagram",
    connected: false,
    description: "Captions and hashtags (manual posting via Facebook API)",
  },
  {
    name: "Blog",
    key: "blog",
    connected: true,
    description: "Publish directly to the LifeLink Sync blog",
  },
  {
    name: "Email (Resend)",
    key: "email",
    connected: true,
    description: "Send newsletters via the configured Resend integration",
  },
];

export function PlatformConnections() {
  return (
    <div className="space-y-6 max-w-3xl">
      <RivenSpeech text="Here's the status of your platform connections. Connect accounts to enable auto-publishing, or use manual copy-paste mode." />

      <div className="space-y-3">
        {PLATFORMS.map((platform) => (
          <Card key={platform.key} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {platform.connected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{platform.name}</p>
                    <Badge
                      variant={platform.connected ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {platform.connected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {platform.description}
                  </p>
                </div>
              </div>

              <div>
                {platform.connected ? (
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                    Active
                  </Badge>
                ) : platform.oauthUrl ? (
                  <Button variant="outline" size="sm" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Manual Mode
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <strong>Manual Mode:</strong> When a platform isn't connected, Riven generates the
          content and saves it as "Pending Manual". You can copy the content and post it
          yourself from the Posts tab.
        </p>
      </Card>
    </div>
  );
}
