import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
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
  Mail
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
}

interface RealContentApprovalProps {
  contents: ContentItem[];
  onContentApproval: (contentId: string, approved: boolean) => void;
  onPublishContent: (contentId: string) => void;
  isLoading: boolean;
}

const getContentIcon = (contentType: string) => {
  switch (contentType) {
    case 'social_post':
      return Share2;
    case 'blog_post':
      return FileText;
    case 'email_campaign':
      return Mail;
    case 'video_script':
      return Video;
    default:
      return FileText;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'default';
    case 'published':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'scheduled':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return '#1877F2';
    case 'instagram':
      return '#E4405F';
    case 'twitter':
      return '#1DA1F2';
    case 'linkedin':
      return '#0A66C2';
    case 'youtube':
      return '#FF0000';
    case 'blog':
      return '#10B981';
    case 'email':
      return '#059669';
    default:
      return '#6B7280';
  }
};

export const RealContentApproval: React.FC<RealContentApprovalProps> = ({
  contents,
  onContentApproval,
  onPublishContent,
  isLoading
}) => {
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  const pendingContents = contents?.filter(c => c.status === 'draft' || c.status === 'pending') || [];
  const approvedContents = contents?.filter(c => c.status === 'approved') || [];
  const publishedContents = contents?.filter(c => c.status === 'published') || [];

  const handleApprove = (contentId: string) => {
    onContentApproval(contentId, true);
    toast({
      title: "Content Approved",
      description: "Content has been approved and is ready for publishing",
    });
  };

  const handleReject = (contentId: string) => {
    onContentApproval(contentId, false);
    toast({
      title: "Content Rejected",
      description: "Content has been rejected and moved to drafts",
      variant: "destructive"
    });
  };

  const handlePublish = (contentId: string) => {
    onPublishContent(contentId);
    toast({
      title: "Content Published",
      description: "Content is now live on the selected platform",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-2">Loading content...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contents || contents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Content Generated Yet</h3>
          <p className="text-muted-foreground mb-4">
            Use the Command Center to generate marketing content that will appear here for approval.
          </p>
          <div className="text-sm text-muted-foreground">
            Generated content will require approval before publishing to your social media platforms.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingContents.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedContents.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-2xl font-bold">{publishedContents.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{contents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Content Section */}
      {pendingContents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Approval ({pendingContents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingContents.map((content) => {
              const ContentIcon = getContentIcon(content.content_type);
              return (
                <div key={content.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${getPlatformColor(content.platform)}15` }}
                      >
                        <ContentIcon 
                          className="h-5 w-5"
                          style={{ color: getPlatformColor(content.platform) }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{content.title || 'Untitled Content'}</h4>
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge variant="secondary">{content.content_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.body_text?.substring(0, 150)}...
                        </p>
                        {content.hashtags && content.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {content.hashtags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                            {content.hashtags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{content.hashtags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedContent(content)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Content Preview</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">{selectedContent?.title}</h4>
                              <Textarea
                                value={selectedContent?.body_text || ''}
                                readOnly
                                className="min-h-[200px]"
                              />
                            </div>
                            {selectedContent?.image_url && (
                              <div>
                                <p className="text-sm font-medium mb-2">Image:</p>
                                <img 
                                  src={selectedContent.image_url} 
                                  alt="Content" 
                                  className="rounded-lg max-w-full h-auto"
                                />
                              </div>
                            )}
                            {selectedContent?.hashtags && (
                              <div>
                                <p className="text-sm font-medium mb-2">Hashtags:</p>
                                <div className="flex flex-wrap gap-2">
                                  {selectedContent.hashtags.map((tag, index) => (
                                    <span key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReject(content.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleApprove(content.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Approved Content Section */}
      {approvedContents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ready to Publish ({approvedContents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvedContents.map((content) => {
              const ContentIcon = getContentIcon(content.content_type);
              return (
                <div key={content.id} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ContentIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-semibold">{content.title || 'Untitled Content'}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge variant={getStatusColor(content.status)}>{content.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePublish(content.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Publish Now
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Published Content Section */}
      {publishedContents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Published Content ({publishedContents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {publishedContents.slice(0, 5).map((content) => {
              const ContentIcon = getContentIcon(content.content_type);
              return (
                <div key={content.id} className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ContentIcon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">{content.title || 'Untitled Content'}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge variant="default">Published</Badge>
                          {content.scheduled_time && (
                            <span className="text-xs text-muted-foreground">
                              Published {new Date(content.scheduled_time).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {content.engagement_metrics && (
                        <div>
                          <p>Reach: {content.engagement_metrics.reach || 0}</p>
                          <p>Engagement: {content.engagement_metrics.engagement || 0}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {publishedContents.length > 5 && (
              <p className="text-center text-muted-foreground">
                And {publishedContents.length - 5} more published content...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};