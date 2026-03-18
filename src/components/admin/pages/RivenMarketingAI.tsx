import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Link2, Brain } from "lucide-react";
import { useRivenCampaign } from "@/hooks/useRivenCampaign";
import { RivenWizard } from "@/components/admin/riven/RivenWizard";
import { CampaignDashboard } from "@/components/admin/riven/CampaignDashboard";
import { QuickGenerate } from "@/components/admin/riven/QuickGenerate";
import { PlatformConnections } from "@/components/admin/riven/PlatformConnections";
import { RivenSpeech } from "@/components/admin/riven/RivenSpeech";

const RivenMarketingAI = () => {
  const campaign = useRivenCampaign();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("campaigns");

  const activeCampaigns = campaign.campaigns.filter(
    (c) => c.status === "active" || c.status === "processing" || c.status === "paused" || c.status === "completed"
  );

  if (campaign.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading Riven...</p>
        </div>
      </div>
    );
  }

  // Wizard mode
  if (isCreating) {
    return (
      <div className="p-6">
        <RivenWizard
          onComplete={() => {
            setIsCreating(false);
            setActiveTab("campaigns");
          }}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  // Landing — no campaigns
  if (activeCampaigns.length === 0 && activeTab === "campaigns") {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
          <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
            <Brain className="h-10 w-10 text-primary" />
          </div>
          <RivenSpeech text="I'm Riven, your AI marketing engine. I can build full campaign schedules, generate unique content for every platform, and publish it all automatically. Let's get started!" />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button size="lg" onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Start New Campaign
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setActiveTab("quick")}
              className="gap-2"
            >
              <Zap className="h-4 w-4" /> Quick Generate
            </Button>
          </div>
        </div>

        {/* Still show tabs for quick generate / connections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="quick">Quick Generate</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          <TabsContent value="quick">
            <QuickGenerate />
          </TabsContent>
          <TabsContent value="connections">
            <PlatformConnections />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Active campaign dashboard
  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
            <TabsTrigger value="quick">Quick Generate</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={() => setIsCreating(true)} className="gap-1">
            <Plus className="h-3 w-3" /> New Campaign
          </Button>
        </div>

        <TabsContent value="campaigns">
          {/* Campaign selector if multiple */}
          {activeCampaigns.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {activeCampaigns.map((c) => (
                <Button
                  key={c.id}
                  variant={campaign.activeCampaign?.id === c.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs whitespace-nowrap"
                  onClick={() => campaign.selectCampaign(c)}
                >
                  {c.title}
                </Button>
              ))}
            </div>
          )}

          {campaign.activeCampaign && (
            <CampaignDashboard
              campaign={campaign.activeCampaign}
              content={campaign.content}
              stats={campaign.stats}
              onTogglePause={campaign.toggleCampaignPause}
              onPublishPost={campaign.publishPost}
              onUpdateContent={campaign.updateContent}
              onDeleteContent={campaign.deleteContent}
              onGenerateImage={campaign.generateImage}
            />
          )}
        </TabsContent>

        <TabsContent value="quick">
          <QuickGenerate />
        </TabsContent>

        <TabsContent value="connections">
          <PlatformConnections />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RivenMarketingAI;
