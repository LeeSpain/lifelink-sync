import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Eye,
  ExternalLink,
  Search,
  RefreshCw,
  BookOpen,
  Clock,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  view_count: number | null;
  reading_time: number | null;
  keywords: string[] | null;
  published_at: string | null;
  created_at: string;
}

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, status, view_count, reading_time, keywords, published_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setPosts(data as BlogPost[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filtered = posts.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;
  const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xl font-bold">{posts.length}</p>
          <p className="text-xs text-muted-foreground">Total Posts</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-green-500">{published}</p>
          <p className="text-xs text-muted-foreground">Published</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-amber-500">{drafts}</p>
          <p className="text-xs text-muted-foreground">Drafts</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold text-blue-500">{totalViews.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Views</p>
        </Card>
      </div>

      {/* Search + refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Posts table */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {posts.length === 0
                ? "No blog posts yet. Generate blog content via campaigns or Quick Generate."
                : "No posts match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Views</TableHead>
                <TableHead className="text-xs">Read Time</TableHead>
                <TableHead className="text-xs">Published</TableHead>
                <TableHead className="text-xs w-16">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-[250px]">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {post.keywords.slice(0, 3).map((k, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {k}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        post.status === "published"
                          ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"
                          : "bg-gray-500/10 text-gray-600 border-gray-500/20 text-[10px]"
                      }
                    >
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      {(post.view_count || 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {post.reading_time ? (
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {post.reading_time}m
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {post.published_at ? formatDate(post.published_at) : "—"}
                  </TableCell>
                  <TableCell>
                    {post.status === "published" && post.slug && (
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
