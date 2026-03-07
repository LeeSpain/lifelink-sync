import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye,
  Edit3,
  Calendar,
  BarChart3,
  Share2,
  FileText,
  Image,
  Video,
  Mail,
  Search,
  Filter,
  TrendingUp,
  Target,
  Zap,
  Star,
  ChevronDown,
  Download,
  Upload,
  Users,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Trash2,
  Save
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  body_text: string;
  status: string;
  platform: string;
  content_type: string;
  image_url?: string;
  hashtags?: string[];
  scheduled_time?: string;
  created_at: string;
  engagement_metrics?: any;
  seo_score?: number;
  reading_time?: number;
  campaign_id?: string;
}

interface EnhancedContentApprovalProps {
  contents: ContentItem[];
  onContentApproval: (contentId: string, approved: boolean) => void;
  onPublishContent: (contentId: string) => void;
  onDeleteContent: (contentId: string) => void;
  onEditContent: (contentId: string, updates: Partial<ContentItem>) => void;
  isLoading: boolean;
}

const EnhancedContentApproval: React.FC<EnhancedContentApprovalProps> = ({
  contents,
  onContentApproval,
  onPublishContent,
  onDeleteContent,
  onEditContent,
  isLoading
}) => {
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Enhanced filtering and search
  const filteredContents = useMemo(() => {
    if (!contents) return [];
    
    return contents.filter(content => {
      const matchesSearch = !searchQuery || 
        content.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        content.body_text?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || content.status === statusFilter;
      const matchesPlatform = platformFilter === 'all' || content.platform === platformFilter;
      
      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [contents, searchQuery, statusFilter, platformFilter]);

  // Content categorization
  const pendingContents = filteredContents?.filter(c => c.status === 'draft' || c.status === 'pending') || [];
  const approvedContents = filteredContents?.filter(c => c.status === 'approved') || [];
  const publishedContents = filteredContents?.filter(c => c.status === 'published') || [];
  const rejectedContents = filteredContents?.filter(c => c.status === 'rejected') || [];

  const getContentIcon = (contentType: string) => {
    const iconMap = {
      social_post: Share2,
      blog_post: FileText,
      email_campaign: Mail,
      video_script: Video,
      image_post: Image
    };
    return iconMap[contentType] || FileText;
  };

  const getPlatformColor = (platform: string) => {
    const colorMap = {
      facebook: '#1877F2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
      linkedin: '#0A66C2',
      youtube: '#FF0000',
      blog: 'hsl(var(--primary))',
      email: 'hsl(var(--wellness))'
    };
    return colorMap[platform.toLowerCase()] || 'hsl(var(--neutral))';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'published': return 'default';
      case 'rejected': return 'destructive';
      case 'scheduled': return 'secondary';
      default: return 'outline';
    }
  };

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleBulkAction = (action: string) => {
    selectedItems.forEach(id => {
      if (action === 'approve') {
        onContentApproval(id, true);
      } else if (action === 'reject') {
        onContentApproval(id, false);
      } else if (action === 'publish') {
        onPublishContent(id);
      } else if (action === 'delete') {
        onDeleteContent(id);
      }
    });
    setSelectedItems([]);
    toast({
      title: "Bulk Action Completed",
      description: `${action} applied to ${selectedItems.length} items`,
    });
  };

  const handleEditContent = (content: ContentItem, updates: Partial<ContentItem>) => {
    onEditContent(content.id, updates);
    setSelectedContent(null);
    toast({
      title: "Content Updated",
      description: "Content has been successfully updated",
    });
  };

  const ContentCard = ({ content, showActions = true }: { content: ContentItem; showActions?: boolean }) => {
    const ContentIcon = getContentIcon(content.content_type);
    const isSelected = selectedItems.includes(content.id);

    return (
      <Card className={`group relative border border-border/50 hover:border-primary/30 transition-all duration-300 ${isSelected ? 'ring-2 ring-primary/20 border-primary/50' : ''}`}>
        <CardContent className="p-4">
          {/* Selection checkbox */}
          <div className="absolute top-3 left-3 z-10">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedItems([...selectedItems, content.id]);
                } else {
                  setSelectedItems(selectedItems.filter(id => id !== content.id));
                }
              }}
              className="bg-background border-2"
            />
          </div>

          {/* Content header */}
          <div className="flex items-start justify-between mb-3 ml-8">
            <div className="flex items-start space-x-3 flex-1">
              <div 
                className="p-2 rounded-lg bg-gradient-to-br from-background to-muted"
                style={{ borderColor: getPlatformColor(content.platform) }}
              >
                <ContentIcon 
                  className="h-5 w-5"
                  style={{ color: getPlatformColor(content.platform) }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-sm line-clamp-1">{content.title || 'Untitled Content'}</h4>
                  {content.seo_score && (
                    <Badge variant="outline" className={`text-xs ${getSEOScoreColor(content.seo_score)}`}>
                      SEO {content.seo_score}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" style={{ borderColor: getPlatformColor(content.platform) }}>
                    {content.platform}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(content.status)}>{content.status}</Badge>
                  {content.reading_time && (
                    <span className="text-xs text-muted-foreground">{content.reading_time}min read</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 ml-8">
            {content.body_text?.substring(0, 120)}...
          </p>

          {/* Hashtags */}
          {content.hashtags && content.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 ml-8">
              {content.hashtags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  #{tag}
                </span>
              ))}
              {content.hashtags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{content.hashtags.length - 3}</span>
              )}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center justify-between ml-8">
              <div className="flex items-center space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedContent(content)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Content Preview & Edit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* Preview header */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <ContentIcon className="h-6 w-6" style={{ color: getPlatformColor(selectedContent?.platform || '') }} />
                          <div>
                            <h3 className="font-semibold">{selectedContent?.platform} - {selectedContent?.content_type}</h3>
                            <p className="text-sm text-muted-foreground">Created {new Date(selectedContent?.created_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(selectedContent?.status || '')}>{selectedContent?.status}</Badge>
                          {selectedContent?.seo_score && (
                            <Badge variant="outline" className={getSEOScoreColor(selectedContent.seo_score)}>
                              SEO: {selectedContent.seo_score}/100
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Editable content */}
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Title</label>
                          <Input
                            value={selectedContent?.title || ''}
                            className="font-medium"
                            placeholder="Content title..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 block">Content</label>
                          <Textarea
                            value={selectedContent?.body_text || ''}
                            className="min-h-[200px] resize-none"
                            placeholder="Content body..."
                          />
                        </div>

                        {selectedContent?.image_url && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Image</label>
                            <img 
                              src={selectedContent.image_url} 
                              alt="Content" 
                              className="rounded-lg max-w-full h-auto border border-border"
                            />
                          </div>
                        )}

                        {selectedContent?.hashtags && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Hashtags</label>
                            <div className="flex flex-wrap gap-2">
                              {selectedContent.hashtags.map((tag, index) => (
                                <Badge key={index} variant="secondary">#{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Preview actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditContent(selectedContent!, { title: selectedContent?.title, body_text: selectedContent?.body_text })}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onDeleteContent(selectedContent!.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedContent?.status === 'pending' && (
                            <>
                              <Button variant="outline" onClick={() => onContentApproval(selectedContent.id, false)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button onClick={() => onContentApproval(selectedContent.id, true)}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </>
                          )}
                          {selectedContent?.status === 'approved' && (
                            <Button onClick={() => onPublishContent(selectedContent.id)} className="bg-green-600 hover:bg-green-700">
                              <Share2 className="h-4 w-4 mr-2" />
                              Publish Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center space-x-1">
                {content.status === 'pending' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onContentApproval(content.id, false)}>
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => onContentApproval(content.id, true)}>
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {content.status === 'approved' && (
                  <Button size="sm" onClick={() => onPublishContent(content.id)} className="bg-green-600 hover:bg-green-700">
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onDeleteContent(content.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8 animate-pulse text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Content</p>
            <p className="text-sm text-muted-foreground">Fetching approval queue...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contents || contents.length === 0) {
    return (
      <Card className="border-dashed border-2 border-primary/20">
        <CardContent className="text-center py-16">
          <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            No Content Generated Yet
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Use the Command Center to generate marketing content that will appear here for approval and publishing.
          </p>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>✨ AI-generated content will be reviewed here</p>
            <p>🎯 Approve, edit, and schedule publishing</p>
            <p>📊 Track performance and engagement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Content Approval Dashboard
          </h2>
          <p className="text-muted-foreground">
            Review, approve, and manage AI-generated marketing content
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hover-scale">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" className="hover-scale">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Advanced Filters & Search */}
      <Card className="bg-gradient-to-r from-background/80 to-muted/30 border-primary/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Search Content</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search titles, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/80 border-primary/20"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platform Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Platform</label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="bg-background/80 border-primary/20">
                  <Share2 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Bulk Actions</label>
              <div className="flex gap-2">
                {selectedItems.length > 0 && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('approve')}>
                      Approve ({selectedItems.length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction('reject')}>
                      Reject
                    </Button>
                  </>
                )}
                {selectedItems.length === 0 && (
                  <div className="text-sm text-muted-foreground py-2">
                    Select items for bulk actions
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Pending</p>
                <p className="text-2xl font-bold text-orange-900">{pendingContents.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Approved</p>
                <p className="text-2xl font-bold text-green-900">{approvedContents.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Published</p>
                <p className="text-2xl font-bold text-blue-900">{publishedContents.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{rejectedContents.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total</p>
                <p className="text-2xl font-bold text-purple-900">{filteredContents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board / List View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approval Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Review ({pendingContents.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {pendingContents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
            {pendingContents.length === 0 && (
              <Card className="border-dashed border-2 border-orange-200">
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-orange-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No pending content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Approved Content Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Ready to Publish ({approvedContents.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {approvedContents.map((content) => (
              <ContentCard key={content.id} content={content} />
            ))}
            {approvedContents.length === 0 && (
              <Card className="border-dashed border-2 border-green-200">
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No approved content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Published Content Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Published ({publishedContents.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {publishedContents.slice(0, 10).map((content) => (
              <ContentCard key={content.id} content={content} showActions={false} />
            ))}
            {publishedContents.length === 0 && (
              <Card className="border-dashed border-2 border-blue-200">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No published content</p>
                </CardContent>
              </Card>
            )}
            {publishedContents.length > 10 && (
              <Card className="border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    + {publishedContents.length - 10} more published items
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedContentApproval;