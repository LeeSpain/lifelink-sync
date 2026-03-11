import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Campaign {
  id: string;
  title: string;
  status: string;
  goal: string | null;
  tone: string | null;
  duration_days: number | null;
  platform_schedules: Record<string, unknown> | null;
  weekly_themes: unknown[] | null;
  start_date: string | null;
  platforms: string[] | null;
  created_at: string;
  completed_at: string | null;
}

export interface CampaignContent {
  id: string;
  campaign_id: string;
  platform: string;
  content_type: string;
  title: string | null;
  body_text: string | null;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  content_angle: string | null;
  hook_style: string | null;
  cta_type: string | null;
  week_number: number | null;
  day_number: number | null;
  post_url: string | null;
  platform_post_id: string | null;
  hashtags: string[] | null;
}

export function useRivenCampaign() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [content, setContent] = useState<CampaignContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Load all campaigns
  const loadCampaigns = useCallback(async () => {
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCampaigns(data as Campaign[]);
      // Auto-select first active campaign
      const active = data.find(
        (c: Campaign) => c.status === "active" || c.status === "processing"
      );
      if (active && !activeCampaign) {
        setActiveCampaign(active as Campaign);
      }
    }
    setLoading(false);
  }, [activeCampaign]);

  // Load content for active campaign
  const loadContent = useCallback(async (campaignId: string) => {
    const { data, error } = await supabase
      .from("marketing_content")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("scheduled_at", { ascending: true });

    if (!error && data) {
      setContent(data as CampaignContent[]);
    }
  }, []);

  // Generate a new campaign via edge function
  const generateCampaign = useCallback(
    async (payload: Record<string, unknown>) => {
      setGenerating(true);
      setGenerationProgress(0);

      try {
        // Simulate progress while waiting for response
        const progressInterval = setInterval(() => {
          setGenerationProgress((p) => Math.min(p + 2, 90));
        }, 500);

        const { data, error } = await supabase.functions.invoke(
          "riven-campaign-generator",
          { body: payload }
        );

        clearInterval(progressInterval);

        if (error) throw error;

        setGenerationProgress(100);

        // Reload campaigns to include the new one
        await loadCampaigns();

        if (data?.campaign_id) {
          const newCampaign = campaigns.find((c) => c.id === data.campaign_id);
          if (newCampaign) setActiveCampaign(newCampaign);
          await loadContent(data.campaign_id);
        }

        return data;
      } catch (err) {
        console.error("Campaign generation failed:", err);
        throw err;
      } finally {
        setGenerating(false);
      }
    },
    [loadCampaigns, loadContent, campaigns]
  );

  // Generate single content piece
  const generateSingleContent = useCallback(
    async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke(
        "riven-content-single",
        { body: payload }
      );

      if (error) throw error;
      return data;
    },
    []
  );

  // Publish a single post
  const publishPost = useCallback(async (post: CampaignContent) => {
    const { data, error } = await supabase.functions.invoke(
      "riven-social-publisher",
      {
        body: {
          content_id: post.id,
          platform: post.platform,
          title: post.title,
          body_text: post.body_text,
          hashtags: post.hashtags,
        },
      }
    );

    if (error) throw error;

    // Refresh content
    if (post.campaign_id) {
      await loadContent(post.campaign_id);
    }

    return data;
  }, [loadContent]);

  // Pause/resume campaign
  const toggleCampaignPause = useCallback(
    async (campaignId: string, currentStatus: string) => {
      const newStatus = currentStatus === "paused" ? "active" : "paused";
      await supabase
        .from("marketing_campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);

      await loadCampaigns();
    },
    [loadCampaigns]
  );

  // Update a content item
  const updateContent = useCallback(
    async (contentId: string, updates: Partial<CampaignContent>) => {
      const { error } = await supabase
        .from("marketing_content")
        .update(updates)
        .eq("id", contentId);

      if (error) throw error;

      // Refresh
      if (activeCampaign) {
        await loadContent(activeCampaign.id);
      }
    },
    [activeCampaign, loadContent]
  );

  // Delete a content item
  const deleteContent = useCallback(
    async (contentId: string) => {
      await supabase.from("marketing_content").delete().eq("id", contentId);
      if (activeCampaign) {
        await loadContent(activeCampaign.id);
      }
    },
    [activeCampaign, loadContent]
  );

  // Select a campaign
  const selectCampaign = useCallback(
    async (campaign: Campaign) => {
      setActiveCampaign(campaign);
      await loadContent(campaign.id);
    },
    [loadContent]
  );

  // Computed stats
  const stats = {
    totalPosts: content.length,
    published: content.filter((c) => c.status === "published").length,
    scheduled: content.filter((c) => c.status === "scheduled").length,
    failed: content.filter((c) => c.status === "failed").length,
    pendingManual: content.filter((c) => c.status === "pending_manual").length,
    todayPosts: content.filter((c) => {
      if (!c.scheduled_at) return false;
      const today = new Date().toISOString().split("T")[0];
      return c.scheduled_at.startsWith(today);
    }),
    healthScore:
      content.length > 0
        ? Math.round(
            ((content.filter((c) => c.status === "published").length +
              content.filter((c) => c.status === "scheduled").length) /
              content.length) *
              100
          )
        : 100,
  };

  // Initial load
  useEffect(() => {
    loadCampaigns();
  }, []);

  // Load content when active campaign changes
  useEffect(() => {
    if (activeCampaign) {
      loadContent(activeCampaign.id);
    }
  }, [activeCampaign?.id]);

  // Real-time subscription for content updates
  useEffect(() => {
    if (!activeCampaign) return;

    const channel = supabase
      .channel(`riven-content-${activeCampaign.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketing_content",
          filter: `campaign_id=eq.${activeCampaign.id}`,
        },
        () => {
          loadContent(activeCampaign.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCampaign?.id]);

  return {
    campaigns,
    activeCampaign,
    content,
    loading,
    generating,
    generationProgress,
    stats,
    loadCampaigns,
    selectCampaign,
    generateCampaign,
    generateSingleContent,
    publishPost,
    toggleCampaignPause,
    updateContent,
    deleteContent,
  };
}
