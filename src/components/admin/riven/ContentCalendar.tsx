import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Zap, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignContent } from "@/hooks/useRivenCampaign";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-sky-500",
  tiktok: "bg-pink-500",
  facebook: "bg-blue-600",
  linkedin: "bg-blue-700",
  instagram: "bg-purple-500",
  blog: "bg-emerald-500",
  email: "bg-amber-500",
};

interface ContentCalendarProps {
  content: CampaignContent[];
  startDate: string;
  onPublish: (post: CampaignContent) => void;
  onUpdate: (id: string, updates: Partial<CampaignContent>) => void;
  onDelete: (id: string) => void;
}

export function ContentCalendar({
  content,
  startDate,
  onPublish,
  onUpdate,
  onDelete,
}: ContentCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(startDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);

  // Group content by date
  const contentByDate = useMemo(() => {
    const map: Record<string, CampaignContent[]> = {};
    for (const item of content) {
      if (!item.scheduled_at) continue;
      if (platformFilter && item.platform !== platformFilter) continue;
      const dateKey = item.scheduled_at.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(item);
    }
    return map;
  }, [content, platformFilter]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.year, viewMonth.month, 1);
    const lastDay = new Date(viewMonth.year, viewMonth.month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun
    const days: Array<{ date: string; day: number; inMonth: boolean }> = [];

    // Padding days from previous month
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      days.push({
        date: d.toISOString().split("T")[0],
        day: d.getDate(),
        inMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewMonth.year, viewMonth.month, d);
      days.push({
        date: date.toISOString().split("T")[0],
        day: d,
        inMonth: true,
      });
    }

    // Padding to fill 6 rows
    while (days.length < 42) {
      const d = new Date(lastDay);
      d.setDate(d.getDate() + (days.length - startPad - lastDay.getDate() + 1));
      days.push({
        date: d.toISOString().split("T")[0],
        day: d.getDate(),
        inMonth: false,
      });
    }

    return days;
  }, [viewMonth]);

  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const allPlatforms = [...new Set(content.map((c) => c.platform))];
  const selectedDayPosts = selectedDay ? contentByDate[selectedDay] || [] : [];

  return (
    <div className="space-y-4">
      {/* Platform filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={platformFilter === null ? "default" : "outline"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setPlatformFilter(null)}
        >
          All
        </Button>
        {allPlatforms.map((p) => (
          <Button
            key={p}
            variant={platformFilter === p ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 capitalize"
            onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
          >
            <span className={cn("w-2 h-2 rounded-full mr-1", PLATFORM_COLORS[p] || "bg-gray-400")} />
            {p}
          </Button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setViewMonth((v) => {
              const d = new Date(v.year, v.month - 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold text-sm">{monthLabel}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setViewMonth((v) => {
              const d = new Date(v.year, v.month + 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {calendarDays.map((day, i) => {
          const posts = contentByDate[day.date] || [];
          const isSelected = selectedDay === day.date;
          const isToday = day.date === new Date().toISOString().split("T")[0];

          return (
            <div
              key={i}
              className={cn(
                "bg-background p-1.5 min-h-[60px] cursor-pointer transition-colors hover:bg-muted/50",
                !day.inMonth && "opacity-40",
                isSelected && "ring-2 ring-primary ring-inset",
                isToday && "bg-primary/5"
              )}
              onClick={() => setSelectedDay(isSelected ? null : day.date)}
            >
              <p
                className={cn(
                  "text-xs font-medium mb-1",
                  isToday && "text-primary font-bold"
                )}
              >
                {day.day}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {posts.slice(0, 4).map((post) => (
                  <span
                    key={post.id}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      post.status === "published"
                        ? "bg-green-500"
                        : post.status === "failed"
                        ? "bg-red-500"
                        : PLATFORM_COLORS[post.platform] || "bg-gray-400"
                    )}
                    title={`${post.platform}: ${post.title || "Untitled"}`}
                  />
                ))}
                {posts.length > 4 && (
                  <span className="text-[9px] text-muted-foreground">+{posts.length - 4}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
              {" "}
              ({selectedDayPosts.length} post{selectedDayPosts.length !== 1 ? "s" : ""})
            </h4>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDay(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedDayPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No posts scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayPosts.map((post) => (
                <div key={post.id} className="flex items-start justify-between p-2 rounded-lg bg-muted/50">
                  {post.image_url && (
                    <img src={post.image_url} alt="" className="h-14 w-14 rounded object-cover flex-shrink-0 mr-2" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("w-2 h-2 rounded-full", PLATFORM_COLORS[post.platform])} />
                      <span className="text-xs font-medium capitalize">{post.platform}</span>
                      <Badge variant="outline" className="text-[10px]">{post.content_angle}</Badge>
                      <Badge
                        variant={post.status === "published" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{post.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {post.body_text}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {post.status === "scheduled" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onPublish(post)}>
                        <Zap className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
