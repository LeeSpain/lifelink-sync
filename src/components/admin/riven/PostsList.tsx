import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Zap, Trash2, Search, Download, CheckSquare, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CampaignContent } from "@/hooks/useRivenCampaign";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  published: "bg-green-500/10 text-green-600 border-green-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
  pending_manual: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  draft: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

interface PostsListProps {
  content: CampaignContent[];
  onPublish: (post: CampaignContent) => void;
  onUpdate: (id: string, updates: Partial<CampaignContent>) => void;
  onDelete: (id: string) => void;
  onGenerateImage?: (post: CampaignContent) => void;
}

export function PostsList({ content, onPublish, onUpdate, onDelete, onGenerateImage }: PostsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = content.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (platformFilter && item.platform !== platformFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (item.title || "").toLowerCase().includes(q) ||
        (item.body_text || "").toLowerCase().includes(q) ||
        item.platform.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const platforms = [...new Set(content.map((c) => c.platform))];
  const statuses = [...new Set(content.map((c) => c.status))];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const handleBulkDelete = () => {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }
    selected.forEach((id) => onDelete(id));
    setSelected(new Set());
    setConfirmBulkDelete(false);
  };

  const exportCSV = () => {
    const headers = ["Platform", "Title", "Body", "Angle", "Hook Style", "CTA", "Hashtags", "Week", "Day", "Scheduled", "Status", "Post URL", "Platform Post ID"];
    const rows = filtered.map((c) => [
      c.platform,
      c.title || "",
      (c.body_text || "").replace(/"/g, '""'),
      c.content_angle || "",
      c.hook_style || "",
      c.cta_type || "",
      (c.hashtags || []).join(" "),
      c.week_number ?? "",
      c.day_number ?? "",
      c.scheduled_at || "",
      c.status,
      c.post_url || "",
      c.platform_post_id || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "riven-posts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {platforms.map((p) => (
          <Button
            key={p}
            variant={platformFilter === p ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 capitalize"
            onClick={() => setPlatformFilter(platformFilter === p ? null : p)}
          >
            {p}
          </Button>
        ))}

        {statuses.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            className="text-xs h-7 capitalize"
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
          >
            {s}
          </Button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground">{selected.size} selected</span>
          {confirmBulkDelete ? (
            <>
              <span className="text-xs text-destructive font-medium">Delete {selected.size} posts?</span>
              <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleBulkDelete}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirmBulkDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleBulkDelete}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{filtered.length} posts</p>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportCSV}>
          <Download className="h-3 w-3 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={toggleSelectAll}>
                  <CheckSquare className="h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-xs">Day</TableHead>
              <TableHead className="text-xs">Platform</TableHead>
              <TableHead className="text-xs">Angle</TableHead>
              <TableHead className="text-xs w-12">Image</TableHead>
              <TableHead className="text-xs">Content</TableHead>
              <TableHead className="text-xs">Scheduled</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selected.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell className="text-xs">{post.day_number || "—"}</TableCell>
                <TableCell>
                  <span className="text-xs capitalize">{post.platform}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs">{post.content_angle || "—"}</span>
                </TableCell>
                <TableCell>
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-xs font-medium truncate">{post.title || "Untitled"}</p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {post.scheduled_at
                    ? new Date(post.scheduled_at).toLocaleDateString("default", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[post.status])}>
                    {post.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!post.image_url && onGenerateImage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Generate image"
                        onClick={() => onGenerateImage(post)}
                      >
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    )}
                    {post.status === "scheduled" && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onPublish(post)}>
                        <Zap className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => onDelete(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 100 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Showing first 100 of {filtered.length} posts
          </p>
        )}
      </Card>
    </div>
  );
}
