import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Save,
  X,
  ExternalLink,
  BookOpen,
  Share2,
  Mail,
  Calendar,
  TrendingUp,
  FileEdit,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface CampaignDetailsModalProps {
  campaign: any;
  isOpen: boolean;
  onClose: () => void;
  onCampaignUpdate: () => void;
}

interface ContentItem {
  id: string;
  title: string;
  body_text: string;
  platform: string;
  content_type: string;
  status: string;
  scheduled_time?: string;
  image_url?: string;
  hashtags?: string[];
  seo_title?: string;
  meta_description?: string;
  slug?: string;
  keywords?: string[];
  created_at: string;
  updated_at: string;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  campaign,
  isOpen,
  onClose,
  onCampaignUpdate
}) => {
  const { toast } = useToast();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(false);
  const [editedCampaign, setEditedCampaign] = useState({
    title: '',
    description: '',
    target_audience: {}
  });
  const [editedContent, setEditedContent] = useState<Partial<ContentItem>>({});
  const [activeTab, setActiveTab] = useState('content');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (campaign && isOpen) {
      loadCampaignContent();
      setEditedCampaign({
        title: campaign.title || '',
        description: campaign.description || '',
        target_audience: campaign.target_audience || {}
      });
    }
  }, [campaign, isOpen]);

  const loadCampaignContent = async () => {
    if (!campaign?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentItems(data || []);
    } catch (error) {
      console.error('Error loading campaign content:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign content",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async () => {
    if (!campaign?.id) return;

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({
          title: editedCampaign.title,
          description: editedCampaign.description,
          target_audience: editedCampaign.target_audience
        })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: "Campaign Updated",
        description: "Campaign details have been saved successfully"
      });

      setEditingCampaign(false);
      onCampaignUpdate();
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update campaign",
        variant: "destructive"
      });
    }
  };

  const deleteCampaign = async () => {
    if (!campaign?.id) return;

    try {
      // First delete all content items
      await supabase
        .from('marketing_content')
        .delete()
        .eq('campaign_id', campaign.id);

      // Then delete the campaign
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: "Campaign Deleted",
        description: "Campaign and all its content have been removed"
      });

      onClose();
      onCampaignUpdate();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  const pauseResumeCampaign = async (status: string) => {
    if (!campaign?.id) return;

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .update({ status })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: status === 'paused' ? "Campaign Paused" : "Campaign Resumed",
        description: `Campaign has been ${status === 'paused' ? 'paused' : 'resumed'} successfully`
      });

      onCampaignUpdate();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: "Status Update Failed",
        description: `Failed to ${status === 'paused' ? 'pause' : 'resume'} campaign`,
        variant: "destructive"
      });
    }
  };

  const editContent = (content: ContentItem) => {
    setSelectedContent(content);
    setEditedContent({ ...content });
    setIsEditing(true);
  };

  const saveContentChanges = async () => {
    if (!selectedContent?.id) return;

    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({
          title: editedContent.title,
          body_text: editedContent.body_text,
          seo_title: editedContent.seo_title,
          meta_description: editedContent.meta_description,
          slug: editedContent.slug,
          keywords: editedContent.keywords,
          hashtags: editedContent.hashtags
        })
        .eq('id', selectedContent.id);

      if (error) throw error;

      toast({
        title: "Content Updated",
        description: "Content has been saved successfully"
      });

      setIsEditing(false);
      setSelectedContent(null);
      loadCampaignContent();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  const publishContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ status: 'published' })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Published",
        description: "Content is now live"
      });

      loadCampaignContent();
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish content",
        variant: "destructive"
      });
    }
  };

  const deleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Deleted",
        description: "Content has been removed"
      });

      loadCampaignContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete content",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ComponentType<any> }> = {
      draft: { variant: "outline", icon: Edit },
      pending_review: { variant: "secondary", icon: Eye },
      published: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle }
    };

    const { variant, icon: Icon } = variants[status] || variants.draft;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return BookOpen;
      case 'social_post': return Share2;
      case 'email_campaign': return Mail;
      default: return FileEdit;
    }
  };

  const blogPosts = contentItems.filter(item => item.content_type === 'blog_post');
  const socialPosts = contentItems.filter(item => item.content_type === 'social_post');
  const emailCampaigns = contentItems.filter(item => item.content_type === 'email_campaign');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{campaign?.title}</DialogTitle>
              <p className="text-muted-foreground mt-1">{campaign?.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={campaign?.status === 'running' ? 'default' : 'secondary'}>
                {campaign?.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCampaign(!editingCampaign)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseResumeCampaign(campaign?.status === 'running' ? 'paused' : 'running')}
              >
                {campaign?.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the campaign and all its content. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteCampaign}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>

        {editingCampaign && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editedCampaign.title}
                  onChange={(e) => setEditedCampaign(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editedCampaign.description}
                  onChange={(e) => setEditedCampaign(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateCampaign}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingCampaign(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">All Content ({contentItems.length})</TabsTrigger>
            <TabsTrigger value="blogs">Blog Posts ({blogPosts.length})</TabsTrigger>
            <TabsTrigger value="social">Social Media ({socialPosts.length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading content...</div>
            ) : contentItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No content generated for this campaign yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentItems.map((item) => {
                  const Icon = getContentIcon(item.content_type);
                  return (
                    <Card key={item.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <h4 className="font-medium text-sm line-clamp-1">{item.title}</h4>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">{item.platform}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {item.body_text}
                        </p>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => editContent(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {item.content_type === 'blog_post' && item.status === 'pending_review' && (
                            <Button variant="outline" size="sm" onClick={() => publishContent(item.id)}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {item.content_type === 'blog_post' && item.status === 'published' && (
                            <Button variant="outline" size="sm" asChild>
                              <a href="/blog" target="_blank">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this content. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteContent(item.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blogs" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {blogPosts.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.meta_description}</p>
                        {item.keywords && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(item.status)}
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => editContent(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          {item.status === 'pending_review' && (
                            <Button variant="outline" size="sm" onClick={() => publishContent(item.id)}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          )}
                          {item.status === 'published' && (
                            <Button variant="outline" size="sm" asChild>
                              <a href="/blog" target="_blank">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {item.body_text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPosts.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" />
                        <h4 className="font-medium text-sm">{item.platform}</h4>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm mb-3">{item.body_text}</p>
                    {item.hashtags && item.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.hashtags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" size="sm" onClick={() => editContent(item)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contentItems.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {contentItems.filter(item => item.status === 'published').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pending Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {contentItems.filter(item => item.status === 'pending_review').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Content Edit Modal */}
        <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Content</DialogTitle>
            </DialogHeader>
            {selectedContent && (
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editedContent.title || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={editedContent.body_text || ''}
                    onChange={(e) => setEditedContent(prev => ({ ...prev, body_text: e.target.value }))}
                    rows={10}
                  />
                </div>
                {selectedContent.content_type === 'blog_post' && (
                  <>
                    <div>
                      <Label>SEO Title</Label>
                      <Input
                        value={editedContent.seo_title || ''}
                        onChange={(e) => setEditedContent(prev => ({ ...prev, seo_title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Meta Description</Label>
                      <Textarea
                        value={editedContent.meta_description || ''}
                        onChange={(e) => setEditedContent(prev => ({ ...prev, meta_description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Keywords (comma-separated)</Label>
                      <Input
                        value={editedContent.keywords?.join(', ') || ''}
                        onChange={(e) => setEditedContent(prev => ({
                          ...prev,
                          keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                        }))}
                      />
                    </div>
                  </>
                )}
                {selectedContent.content_type === 'social_post' && (
                  <div>
                    <Label>Hashtags (comma-separated)</Label>
                    <Input
                      value={editedContent.hashtags?.join(', ') || ''}
                      onChange={(e) => setEditedContent(prev => ({
                        ...prev,
                        hashtags: e.target.value.split(',').map(h => h.trim().replace('#', '')).filter(Boolean)
                      }))}
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={saveContentChanges}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};