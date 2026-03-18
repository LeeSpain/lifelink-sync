import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import {
  RefreshCw,
  Send,
  Users,
  Eye,
  ThumbsUp,
  MessageSquare,
  Trash2,
  Calendar,
  TrendingUp,
  Inbox,
  Facebook
} from 'lucide-react';

const callFacebookManager = async (body: Record<string, any>) => {
  const { data, error } = await supabase.functions.invoke('facebook-manager', {
    body,
  });
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error ?? 'Unknown error');
  return data.data;
};

// ─── Page Stats Cards ────────────────────────────────────────────────────────

function PageStatsSection() {
  const { data: pageInfo, isLoading, refetch } = useQuery({
    queryKey: ['fb-page-info'],
    queryFn: () => callFacebookManager({ action: 'get_page_info' }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Page Overview</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Followers</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : pageInfo?.followers_count?.toLocaleString() ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent><Users className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fans (Likes)</CardDescription>
            <CardTitle className="text-2xl">
              {isLoading ? '...' : pageInfo?.fan_count?.toLocaleString() ?? '—'}
            </CardTitle>
          </CardHeader>
          <CardContent><ThumbsUp className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Category</CardDescription>
            <CardTitle className="text-sm">{pageInfo?.category ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent><Facebook className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Page Name</CardDescription>
            <CardTitle className="text-sm">{pageInfo?.name ?? '—'}</CardTitle>
          </CardHeader>
          <CardContent><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Create Post ─────────────────────────────────────────────────────────────

function CreatePostSection() {
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: (params: Record<string, any>) =>
      callFacebookManager({ action: 'post', ...params }),
    onSuccess: () => {
      toast.success('Post published!');
      setMessage('');
      setLink('');
      setScheduledTime('');
      queryClient.invalidateQueries({ queryKey: ['fb-posts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePost = () => {
    if (!message.trim()) return toast.error('Message is required');
    const params: Record<string, any> = { message };
    if (link.trim()) params.link = link;
    if (scheduledTime) {
      params.scheduled_time = Math.floor(new Date(scheduledTime).getTime() / 1000);
    }
    postMutation.mutate(params);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" /> Create Post
        </CardTitle>
        <CardDescription>Publish or schedule a post to the LifeLink Sync Facebook page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Write your post..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <Input
          placeholder="Link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-xs text-muted-foreground">Leave empty to publish now</span>
        </div>
        <Button onClick={handlePost} disabled={postMutation.isPending}>
          {postMutation.isPending ? 'Publishing...' : scheduledTime ? 'Schedule Post' : 'Publish Now'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Recent Posts ────────────────────────────────────────────────────────────

function RecentPostsSection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fb-posts'],
    queryFn: () => callFacebookManager({ action: 'get_posts', limit: 10 }),
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) =>
      callFacebookManager({ action: 'delete_post', post_id: postId }),
    onSuccess: () => {
      toast.success('Post deleted');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const posts = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>{posts.length} posts loaded</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading posts...</p>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">No posts found</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <div key={post.id} className="border rounded-lg p-4 space-y-2">
                <p className="text-sm">{post.message ?? <span className="text-muted-foreground italic">No text (media post)</span>}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(post.created_time).toLocaleString()}</span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {post.likes?.summary?.total_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {post.comments?.summary?.total_count ?? 0}
                  </span>
                  {post.shares && (
                    <span>Shares: {post.shares.count ?? 0}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Delete this post?')) deleteMutation.mutate(post.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Messenger Inbox ─────────────────────────────────────────────────────────

function MessengerSection() {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fb-inbox'],
    queryFn: () => callFacebookManager({ action: 'get_inbox' }),
    staleTime: 60_000,
  });

  const sendMutation = useMutation({
    mutationFn: (params: { recipient_id: string; message: string }) =>
      callFacebookManager({ action: 'send_message', ...params }),
    onSuccess: () => {
      toast.success('Message sent');
      setReplyTo(null);
      setReplyText('');
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const conversations = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="h-5 w-5" /> Messenger Inbox
            </CardTitle>
            <CardDescription>Recent Messenger conversations (CLARA auto-replies enabled)</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading inbox...</p>
        ) : conversations.length === 0 ? (
          <p className="text-muted-foreground">No conversations yet</p>
        ) : (
          <div className="space-y-3">
            {conversations.map((convo: any) => {
              const participants = convo.participants?.data?.map((p: any) => p.name).join(', ') ?? 'Unknown';
              const lastMessages = convo.messages?.data ?? [];

              return (
                <div key={convo.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{participants}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(convo.updated_time).toLocaleString()}
                    </span>
                  </div>
                  {lastMessages.map((msg: any) => (
                    <div key={msg.id} className="text-xs bg-muted/50 rounded p-2">
                      <span className="font-medium">{msg.from?.name}:</span> {msg.message}
                    </div>
                  ))}
                  {replyTo === convo.id ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        disabled={sendMutation.isPending}
                        onClick={() => {
                          // Pick the first participant that isn't the page itself
                          const recipientId = convo.participants?.data?.[0]?.id;
                          if (recipientId && replyText.trim()) {
                            sendMutation.mutate({ recipient_id: recipientId, message: replyText });
                          }
                        }}
                      >
                        Send
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setReplyTo(convo.id)}>
                      Reply
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Insights ────────────────────────────────────────────────────────────────

function InsightsSection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['fb-insights'],
    queryFn: () => callFacebookManager({ action: 'get_insights' }),
    staleTime: 300_000,
  });

  const metrics = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Page Insights
            </CardTitle>
            <CardDescription>Impressions, engagement, fans, and views</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading insights...</p>
        ) : metrics.length === 0 ? (
          <p className="text-muted-foreground">No insights data available (page may need more activity)</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {metrics.map((metric: any) => (
              <div key={metric.id} className="border rounded p-3">
                <p className="font-medium text-sm">{metric.title}</p>
                <p className="text-xs text-muted-foreground mb-2">{metric.description}</p>
                {metric.values?.slice(-3).map((v: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{new Date(v.end_time).toLocaleDateString()}</span>
                    <Badge variant="secondary">{v.value?.toLocaleString?.() ?? JSON.stringify(v.value)}</Badge>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Comments Moderation ─────────────────────────────────────────────────────

function CommentsSection() {
  const [postId, setPostId] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    if (!postId.trim()) return;
    setLoading(true);
    try {
      const data = await callFacebookManager({ action: 'get_comments', post_id: postId });
      setComments(data?.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await callFacebookManager({ action: 'delete_comment', comment_id: commentId });
      toast.success('Comment deleted');
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Comment Moderation
        </CardTitle>
        <CardDescription>View and moderate comments on any post</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Paste a Post ID (e.g. 1022860360912464_123456)"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
          />
          <Button onClick={loadComments} disabled={loading}>
            {loading ? 'Loading...' : 'Load Comments'}
          </Button>
        </div>
        {comments.length > 0 && (
          <div className="space-y-2">
            {comments.map((c: any) => (
              <div key={c.id} className="border rounded p-2 flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{c.from?.name ?? 'Unknown'}</p>
                  <p className="text-sm">{c.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_time).toLocaleString()} · {c.like_count ?? 0} likes
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteComment(c.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const FacebookManagerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Facebook className="h-6 w-6" /> Facebook Manager
        </h1>
        <p className="text-muted-foreground">CLARA's full control of the LifeLink Sync Facebook page</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="messenger">Messenger</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PageStatsSection />
          <CreatePostSection />
        </TabsContent>

        <TabsContent value="posts">
          <RecentPostsSection />
        </TabsContent>

        <TabsContent value="messenger">
          <MessengerSection />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsSection />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacebookManagerPage;
