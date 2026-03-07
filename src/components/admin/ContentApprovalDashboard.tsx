import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useWorkflow } from '@/contexts/RivenWorkflowContext';
import { BlogPublisher } from './BlogPublisher';
import { 
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Share2,
  Clock,
  FileText,
  Image,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  BookOpen,
  Sparkles,
  TrendingUp,
  Edit,
  Copy,
  ArrowRight
} from 'lucide-react';

interface ContentItem {
  id: string;
  campaign_id: string;
  platform: string;
  content_type: string;
  title?: string;
  body_text?: string;
  image_url?: string;
  status: string;
  seo_title?: string;
  meta_description?: string;
  hashtags?: string[];
  keywords?: string[];
  created_at: string;
  updated_at: string;
}

export const ContentApprovalDashboard: React.FC = () => {
  const { contentItems, loadContentItems } = useWorkflow();
  const { toast } = useToast();
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [editedContent, setEditedContent] = useState<Partial<ContentItem>>({});
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const pendingContent = contentItems.filter(item => item.status === 'draft');
  const approvedContent = contentItems.filter(item => item.status === 'approved');
  const scheduledContent = contentItems.filter(item => item.status === 'scheduled');

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: Facebook,
      instagram: Instagram,
      twitter: Twitter,
      linkedin: Linkedin,
      youtube: Youtube,
      blog: BookOpen,
      email: Mail
    };
    const Icon = icons[platform as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getPlatformColor = (platform: string) => {
    const colors = {
      facebook: 'text-blue-600',
      instagram: 'text-pink-600',
      twitter: 'text-sky-600',
      linkedin: 'text-blue-700',
      youtube: 'text-red-600',
      blog: 'text-green-600',
      email: 'text-purple-600'
    };
    return colors[platform as keyof typeof colors] || 'text-gray-600';
  };

  const handleApprove = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Approved",
        description: "Content has been approved and is ready for publishing",
      });

      loadContentItems();
    } catch (error) {
      console.error('Error approving content:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve content",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      toast({
        title: "Content Rejected",
        description: "Content has been rejected and marked for revision",
      });

      loadContentItems();
    } catch (error) {
      console.error('Error rejecting content:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject content",
        variant: "destructive"
      });
    }
  };

  const handleSchedule = async () => {
    if (!selectedContent || !scheduledTime) return;

    try {
      // Update content status
      const { error: contentError } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'scheduled',
          scheduled_time: scheduledTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContent.id);

      if (contentError) throw contentError;

      // Add to posting queue
      const { error: queueError } = await supabase
        .from('posting_queue')
        .insert({
          content_id: selectedContent.id,
          platform: selectedContent.platform,
          scheduled_time: scheduledTime,
          status: 'scheduled'
        });

      if (queueError) throw queueError;

      toast({
        title: "Content Scheduled",
        description: `Content scheduled for ${new Date(scheduledTime).toLocaleString()}`,
      });

      setScheduleModalOpen(false);
      setScheduledTime('');
      loadContentItems();
    } catch (error) {
      console.error('Error scheduling content:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to schedule content",
        variant: "destructive"
      });
    }
  };

  const handlePublishNow = async (contentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('content-publisher', {
        body: {
          action: 'publish',
          contentId: contentId
        }
      });

      if (error) throw error;

      toast({
        title: "Publishing Started",
        description: "Content is being published across platforms",
      });

      loadContentItems();
    } catch (error) {
      console.error('Error publishing content:', error);
      toast({
        title: "Publishing Failed",
        description: "Failed to publish content",
        variant: "destructive"
      });
    }
  };

  const handleBulkApprove = async () => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .in('id', bulkSelectedIds);

      if (error) throw error;

      toast({
        title: "Bulk Approval Complete",
        description: `${bulkSelectedIds.length} items approved`,
      });

      setBulkSelectedIds([]);
      loadContentItems();
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast({
        title: "Bulk Approval Failed",
        description: "Failed to approve selected content",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (content: ContentItem) => {
    setSelectedContent(content);
    setEditedContent(content);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedContent) return;

    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({
          ...editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedContent.id);

      if (error) throw error;

      toast({
        title: "Content Updated",
        description: "Content has been successfully updated",
      });

      setEditModalOpen(false);
      loadContentItems();
    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  const duplicateContent = async (content: ContentItem) => {
    try {
      const duplicatedContent = {
        ...content,
        title: `${content.title} (Copy)`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      delete duplicatedContent.id;

      const { error } = await supabase
        .from('marketing_content')
        .insert(duplicatedContent);

      if (error) throw error;

      toast({
        title: "Content Duplicated",
        description: "Content has been duplicated successfully",
      });

      loadContentItems();
    } catch (error) {
      console.error('Error duplicating content:', error);
      toast({
        title: "Duplication Failed",
        description: "Failed to duplicate content",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Pending Review</p>
                <p className="text-2xl font-bold text-orange-900">{pendingContent.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Approved</p>
                <p className="text-2xl font-bold text-green-900">{approvedContent.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Scheduled</p>
                <p className="text-2xl font-bold text-blue-900">{scheduledContent.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Total Content</p>
                <p className="text-2xl font-bold text-purple-900">{contentItems.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {bulkSelectedIds.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{bulkSelectedIds.length} items selected</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkSelectedIds([])}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approval Section */}
      {pendingContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Pending Approval ({pendingContent.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingContent.map((content) => (
                <Card key={content.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={getPlatformColor(content.platform)}>
                            {getPlatformIcon(content.platform)}
                          </div>
                          <Badge variant="outline">{content.platform}</Badge>
                          <Badge variant="secondary">{content.content_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(content.created_at)}
                          </span>
                        </div>
                        
                        <h4 className="font-medium mb-2">{content.title || 'Untitled'}</h4>
                        
                        {content.body_text && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {content.body_text.substring(0, 150)}...
                          </p>
                        )}

                        {content.hashtags && content.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {content.hashtags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                            {content.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{content.hashtags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContent(content);
                              setPreviewModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(content)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => duplicateContent(content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(content.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(content.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContent(content);
                              setScheduleModalOpen(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>

                          <Button
                            size="sm"
                          className="bg-primary"
                          onClick={() => handlePublishNow(content.id)}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Publish Now
                        </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {pendingContent.length === 0 && (
        <Card className="bg-muted/20">
          <CardContent className="p-12 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Content Pending Approval</h3>
            <p className="text-muted-foreground mb-4">
              All content has been reviewed. Create new campaigns to generate more content.
            </p>
            <Button variant="outline">
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Command Center
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={getPlatformColor(selectedContent.platform)}>
                  {getPlatformIcon(selectedContent.platform)}
                </div>
                <Badge>{selectedContent.platform}</Badge>
                <Badge variant="outline">{selectedContent.content_type}</Badge>
              </div>
              
              {selectedContent.title && (
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <p className="mt-1 p-3 bg-muted rounded">{selectedContent.title}</p>
                </div>
              )}
              
              {selectedContent.body_text && (
                <div>
                  <Label className="text-sm font-medium">Content</Label>
                  <div className="mt-1 p-3 bg-muted rounded max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedContent.body_text}</p>
                  </div>
                </div>
              )}
              
              {selectedContent.image_url && (
                <div>
                  <Label className="text-sm font-medium">Image</Label>
                  <img 
                    src={selectedContent.image_url} 
                    alt="Content image" 
                    className="mt-1 rounded border max-h-48 object-cover"
                  />
                </div>
              )}
              
              {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Hashtags</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedContent.hashtags.map((tag, index) => (
                      <Badge key={index} variant="outline">#{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduled-time">Schedule Date & Time</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={!scheduledTime}>
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editedContent.title || ''}
                onChange={(e) => setEditedContent(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editedContent.body_text || ''}
                onChange={(e) => setEditedContent(prev => ({ ...prev, body_text: e.target.value }))}
                rows={8}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};