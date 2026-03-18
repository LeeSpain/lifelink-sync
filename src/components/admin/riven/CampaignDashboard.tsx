import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, Zap, Calendar, List, BarChart3, BookOpen } from "lucide-react";
import { ContentCalendar } from "./ContentCalendar";
import { PostsList } from "./PostsList";
import { CampaignAnalytics } from "./CampaignAnalytics";
import { BlogManager } from "./BlogManager";
import type { Campaign, CampaignContent } from "@/hooks/useRivenCampaign";

interface CampaignDashboardProps {
  campaign: Campaign;
  content: CampaignContent[];
  stats: {
    totalPosts: number;
    published: number;
    scheduled: number;
    failed: number;
    pendingManual: number;
    todayPosts: CampaignContent[];
    healthScore: number;
  };
  onTogglePause: (campaignId: string, status: string) => void;
  onPublishPost: (post: CampaignContent) => void;
  onUpdateContent: (id: string, updates: Partial<CampaignContent>) => void;
  onDeleteContent: (id: string) => void;
  onGenerateImage?: (post: CampaignContent) => void;
}

export function CampaignDashboard({
  campaign,
  content,
  stats,
  onTogglePause,
  onPublishPost,
  onUpdateContent,
  onDeleteContent,
  onGenerateImage,
}: CampaignDashboardProps) {
  const isPaused = campaign.status === "paused";

  return (
    <div className="space-y-6">
      {/* Campaign header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{campaign.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={isPaused ? "secondary" : "default"}>
              {campaign.status}
            </Badge>
            {campaign.platforms?.map((p) => (
              <Badge key={p} variant="outline" className="text-xs capitalize">
                {p}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePause(campaign.id, campaign.status)}
          >
            {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Health" value={`${stats.healthScore}%`} accent={stats.healthScore > 80 ? "green" : stats.healthScore > 50 ? "amber" : "red"} />
        <StatCard label="Total Posts" value={stats.totalPosts.toString()} />
        <StatCard label="Published" value={stats.published.toString()} accent="green" />
        <StatCard label="Scheduled" value={stats.scheduled.toString()} accent="blue" />
        <StatCard label="Failed" value={stats.failed.toString()} accent={stats.failed > 0 ? "red" : undefined} />
      </div>

      {/* Today's posts */}
      {stats.todayPosts.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Today's Posts ({stats.todayPosts.length})</CardTitle>
          </CardHeader>
          <CardContent className="py-0 pb-3">
            <div className="space-y-2">
              {stats.todayPosts.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
                    )}
                    <Badge variant="outline" className="text-xs capitalize">{post.platform}</Badge>
                    <span className="truncate max-w-[200px]">{post.title || "Untitled"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={post.status === "published" ? "default" : "secondary"} className="text-xs">
                      {post.status}
                    </Badge>
                    {post.status === "scheduled" && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onPublishPost(post)}>
                        <Zap className="h-3 w-3 mr-1" /> Post Now
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-1">
            <Calendar className="h-3 w-3" /> Calendar
          </TabsTrigger>
          <TabsTrigger value="posts" className="gap-1">
            <List className="h-3 w-3" /> Posts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1">
            <BarChart3 className="h-3 w-3" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="blog" className="gap-1">
            <BookOpen className="h-3 w-3" /> Blog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <ContentCalendar
            content={content}
            startDate={campaign.start_date || campaign.created_at}
            onPublish={onPublishPost}
            onUpdate={onUpdateContent}
            onDelete={onDeleteContent}
          />
        </TabsContent>

        <TabsContent value="posts">
          <PostsList
            content={content}
            onPublish={onPublishPost}
            onUpdate={onUpdateContent}
            onDelete={onDeleteContent}
            onGenerateImage={onGenerateImage}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <CampaignAnalytics content={content} campaign={campaign} />
        </TabsContent>

        <TabsContent value="blog">
          <BlogManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "blue" | "red" | "amber";
}) {
  const textColor = accent
    ? {
        green: "text-green-500",
        blue: "text-blue-500",
        red: "text-red-500",
        amber: "text-amber-500",
      }[accent]
    : "text-foreground";

  return (
    <Card className="p-3 text-center">
      <p className={`text-base font-semibold ${textColor}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}
