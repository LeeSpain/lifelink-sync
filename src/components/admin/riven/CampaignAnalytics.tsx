import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Campaign, CampaignContent } from "@/hooks/useRivenCampaign";

interface CampaignAnalyticsProps {
  content: CampaignContent[];
  campaign: Campaign;
}

export function CampaignAnalytics({ content, campaign }: CampaignAnalyticsProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSyncAnalytics = async () => {
    setSyncing(true);
    try {
      const publishedFbPosts = content.filter(
        (c) => c.platform === "facebook" && c.status === "published"
      );

      if (publishedFbPosts.length === 0) {
        toast.info("No published Facebook posts to sync");
        setSyncing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("facebook-manager", {
        body: { action: "get_insights", period: "day" },
      });

      if (error) throw new Error(error.message);

      // Update campaign analytics with latest data
      const insights = data?.data?.data || [];
      const impressions = insights.find((m: any) => m.name === "page_impressions")?.values?.[0]?.value || 0;
      const engaged = insights.find((m: any) => m.name === "page_engaged_users")?.values?.[0]?.value || 0;

      await supabase.from("campaign_analytics").upsert({
        campaign_id: campaign.id,
        total_impressions: impressions,
        total_engagement: engaged,
        synced_at: new Date().toISOString(),
      }, { onConflict: "campaign_id" });

      toast.success(`Synced: ${impressions} impressions, ${engaged} engaged`);
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };
  const platformStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; published: number; failed: number; scheduled: number }
    > = {};

    for (const item of content) {
      if (!stats[item.platform]) {
        stats[item.platform] = { total: 0, published: 0, failed: 0, scheduled: 0 };
      }
      stats[item.platform].total++;
      if (item.status === "published") stats[item.platform].published++;
      if (item.status === "failed") stats[item.platform].failed++;
      if (item.status === "scheduled") stats[item.platform].scheduled++;
    }

    return stats;
  }, [content]);

  const angleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of content) {
      const angle = item.content_angle || "unknown";
      counts[angle] = (counts[angle] || 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([angle, count]) => ({ angle, count }));
  }, [content]);

  const dayOfWeekStats = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    for (const item of content) {
      if (item.scheduled_at) {
        const day = new Date(item.scheduled_at).getDay();
        counts[day]++;
      }
    }
    return days.map((name, i) => ({ name, count: counts[i] }));
  }, [content]);

  const totalPublished = content.filter((c) => c.status === "published").length;
  const totalScheduled = content.filter((c) => c.status === "scheduled").length;
  const completionRate =
    content.length > 0 ? Math.round((totalPublished / content.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Sync button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleSyncAnalytics} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Facebook Analytics'}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{content.length}</p>
          <p className="text-xs text-muted-foreground">Total Content</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{totalPublished}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-500">{totalScheduled}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{completionRate}%</p>
          <p className="text-xs text-muted-foreground">Completion Rate</p>
        </Card>
      </div>

      {/* Per-platform breakdown */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Platform Performance</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-4">
          <div className="space-y-3">
            {Object.entries(platformStats).map(([platform, stats]) => {
              const publishRate =
                stats.total > 0
                  ? Math.round((stats.published / stats.total) * 100)
                  : 0;
              return (
                <div key={platform} className="flex items-center gap-3">
                  <span className="text-sm font-medium capitalize w-20">{platform}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${publishRate}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600">{stats.published}</span>
                    <span className="text-muted-foreground">/</span>
                    <span>{stats.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content angle distribution */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Content Angle Distribution</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-4">
          <div className="flex flex-wrap gap-2">
            {angleStats.map(({ angle, count }) => (
              <Badge key={angle} variant="outline" className="text-xs">
                {angle}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Day of week distribution */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Posts by Day of Week</CardTitle>
        </CardHeader>
        <CardContent className="py-0 pb-4">
          <div className="flex items-end gap-2 h-24">
            {dayOfWeekStats.map(({ name, count }) => {
              const max = Math.max(...dayOfWeekStats.map((d) => d.count), 1);
              const height = (count / max) * 100;
              return (
                <div key={name} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                  <div className="w-full bg-muted rounded-t relative" style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-primary/60 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium">{name}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
