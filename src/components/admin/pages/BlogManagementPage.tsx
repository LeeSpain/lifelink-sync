import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  Tag,
  Search,
  Filter,
  AlertCircle,
  Star,
  Globe,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BlogPost {
  id: string;
  title: string | null;
  body_text: string | null;
  slug: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  featured_image_alt?: string | null;
  reading_time?: number | null;
  seo_score?: number | null;
  created_at: string;
  updated_at: string;
  status: string;
  platform: string;
  content_type: string;
  campaign_id?: string | null;
  image_url?: string | null;
}

const BlogManagementPage = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBlogPosts();
    
    // Set up real-time subscription for blog posts
    const subscription = supabase
      .channel('blog_management')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'marketing_content',
        filter: 'platform=eq.Blog'
      }, () => {
        loadBlogPosts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadBlogPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('platform', 'Blog')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const blogPosts = (posts || []).map(post => ({
        id: post.id,
        title: post.title,
        body_text: post.body_text,
        slug: post.slug || (post.title ? post.title.toLowerCase().replace(/\s+/g, '-') : ''),
        seo_title: post.seo_title,
        meta_description: post.meta_description,
        keywords: post.keywords,
        featured_image_alt: post.featured_image_alt,
        reading_time: post.reading_time,
        seo_score: post.seo_score,
        created_at: post.created_at,
        updated_at: post.updated_at,
        status: post.status,
        platform: post.platform,
        content_type: post.content_type,
        campaign_id: post.campaign_id,
        image_url: post.image_url
      }));

      setBlogPosts(blogPosts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post approved and published!",
        variant: "default"
      });
      
      loadBlogPosts();
    } catch (error) {
      console.error('Error approving post:', error);
      toast({
        title: "Error",
        description: "Failed to approve blog post",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post rejected",
        variant: "default"
      });
      
      loadBlogPosts();
    } catch (error) {
      console.error('Error rejecting post:', error);
      toast({
        title: "Error",
        description: "Failed to reject blog post",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post deleted",
        variant: "default"
      });
      
      loadBlogPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive"
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({
          title: editingPost.title,
          body_text: editingPost.body_text,
          seo_title: editingPost.seo_title,
          meta_description: editingPost.meta_description,
          keywords: editingPost.keywords,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blog post updated!",
        variant: "default"
      });
      
      setIsEditMode(false);
      setEditingPost(null);
      loadBlogPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update blog post",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'pending_review':
        return <Badge className="bg-orange-500 text-white">Pending Review</Badge>;
      case 'published':
        return <Badge className="bg-green-500 text-white">Published</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getExcerpt = (content: string, maxLength: number = 100) => {
    const plainText = content?.replace(/<[^>]*>/g, '') || '';
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.body_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = blogPosts.filter(p => p.status === 'pending_review' || p.status === 'draft').length;
  const publishedCount = blogPosts.filter(p => p.status === 'published').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Blog Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Review, approve, and manage AI-generated blog content
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-orange-500 text-white px-3 py-1">
            {pendingCount} Pending Review
          </Badge>
          <Badge className="bg-green-500 text-white px-3 py-1">
            {publishedCount} Published
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Blog Posts List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(post.status)}
                    {post.seo_score && post.seo_score >= 80 && (
                      <Badge className="bg-blue-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        SEO: {post.seo_score}%
                      </Badge>
                    )}
                    {post.reading_time && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.reading_time}m read
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">
                    {post.seo_title || post.title || 'Untitled Post'}
                  </CardTitle>
                  <p className="text-muted-foreground mt-2">
                    {post.meta_description || getExcerpt(post.body_text || '')}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.created_at)}
                    </div>
                    {post.keywords && post.keywords.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {post.keywords.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Dialog open={isPreviewOpen && selectedPost?.id === post.id} onOpenChange={setIsPreviewOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPost(post)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Blog Post Preview</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="border-b pb-4">
                          <h1 className="text-3xl font-bold mb-2">
                            {selectedPost?.seo_title || selectedPost?.title}
                          </h1>
                          <p className="text-muted-foreground">
                            {selectedPost?.meta_description}
                          </p>
                        </div>
                        <div 
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: selectedPost?.body_text || '' }}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingPost(post);
                      setIsEditMode(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {(post.status === 'draft' || post.status === 'pending_review') && (
                    <Button 
                      size="sm"
                      onClick={() => handleApprove(post.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}

                  {post.status !== 'published' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleReject(post.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No blog posts found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Blog posts will appear here when generated by Riven AI'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditMode} onOpenChange={setIsEditMode}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                  placeholder="Blog post title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">SEO Title</label>
                <Input
                  value={editingPost.seo_title || ''}
                  onChange={(e) => setEditingPost({...editingPost, seo_title: e.target.value})}
                  placeholder="SEO optimized title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Meta Description</label>
                <Textarea
                  value={editingPost.meta_description || ''}
                  onChange={(e) => setEditingPost({...editingPost, meta_description: e.target.value})}
                  placeholder="Meta description for SEO"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={editingPost.body_text || ''}
                  onChange={(e) => setEditingPost({...editingPost, body_text: e.target.value})}
                  placeholder="Blog post content"
                  rows={15}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Keywords (comma-separated)</label>
                <Input
                  value={editingPost.keywords?.join(', ') || ''}
                  onChange={(e) => setEditingPost({
                    ...editingPost, 
                    keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  })}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagementPage;