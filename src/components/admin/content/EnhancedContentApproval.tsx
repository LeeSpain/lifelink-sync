import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import RealTimePublishingDashboard from './RealTimePublishingDashboard';
import ContentPreviewModal from './ContentPreviewModal';
import PublishingCalendar from './PublishingCalendar';
import { 
  Calendar as CalendarIcon,
  Clock,
  Send,
  Share2,
  Mail,
  FileText,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Loader2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface ContentApprovalItem {
  id: string;
  title: string;
  body_text?: string;
  platform: string;
  status: string;
  created_at: string;
  image_url?: string;
  seo_title?: string;
  meta_description?: string;
  hashtags?: string[];
  content_sections?: any;
}

interface EnhancedContentApprovalProps {
  content: ContentApprovalItem[];
  onApprove: (contentId: string) => Promise<void>;
  onReject: (contentId: string, reason?: string) => Promise<void>;
  onPublish: (contentId: string, publishType: string, platforms?: string[], scheduledTime?: Date) => Promise<void>;
  onEdit: (contentId: string) => void;
  onDelete: (contentId: string) => Promise<void>;
}

const EnhancedContentApproval: React.FC<EnhancedContentApprovalProps> = ({
  content,
  onApprove,
  onReject,
  onPublish,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  const [selectedPublishType, setSelectedPublishType] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [bulkSelectedItems, setBulkSelectedItems] = useState<string[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentApprovalItem | null>(null);
  const [previewContent, setPreviewContent] = useState<ContentApprovalItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('approval');

  const handleBulkAction = async (action: string, items: string[]) => {
    switch (action) {
      case 'approve':
        for (const itemId of items) {
          await onApprove(itemId);
        }
        break;
      case 'delete':
        for (const itemId of items) {
          await onDelete(itemId);
        }
        break;
      case 'schedule':
        setIsScheduleDialogOpen(true);
        break;
      case 'publish_now':
        for (const itemId of items) {
          await publishContent(itemId, 'social', ['facebook', 'twitter']);
        }
        break;
    }
  };

  const handleScheduleUpdate = async (contentId: string, newTime: Date) => {
    await publishContent(contentId, 'social', [], newTime);
  };

  const handleScheduleContent = async (contentId: string, scheduledTime: Date) => {
    await publishContent(contentId, 'social', [], scheduledTime);
  };

  const publishContent = async (contentId: string, publishType: string = 'social', platforms: string[] = [], scheduledTime?: Date) => {
    try {
      await onPublish(contentId, publishType, platforms, scheduledTime);
      toast({
        title: "Content published successfully",
        description: scheduledTime 
          ? `Content scheduled for ${format(scheduledTime, 'PPP p')}`
          : "Content has been published immediately",
      });
    } catch (error: any) {
      toast({
        title: "Publishing failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleQuickApprove = async (contentId: string) => {
    try {
      await onApprove(contentId);
      toast({
        title: "Content approved",
        description: "Content has been approved and is ready for publishing.",
      });
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleQuickReject = async (contentId: string, reason: string = 'Quality issues') => {
    try {
      await onReject(contentId, reason);
      toast({
        title: "Content rejected",
        description: `Content rejected: ${reason}`,
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBulkPublish = async () => {
    if (bulkSelectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select content items to publish.",
        variant: "destructive"
      });
      return;
    }

    const platforms = selectedPlatforms.length > 0 ? selectedPlatforms : ['social'];
    let scheduledDateTime: Date | undefined;

    if (scheduledDate && scheduledTime) {
      scheduledDateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes);
    }

    try {
      for (const contentId of bulkSelectedItems) {
        await publishContent(contentId, selectedPublishType || 'social', platforms, scheduledDateTime);
      }
      
      setBulkSelectedItems([]);
      setSelectedPlatforms([]);
      setScheduledDate(undefined);
      setScheduledTime('');
      
      toast({
        title: "Bulk publishing completed",
        description: `Successfully published ${bulkSelectedItems.length} items.`,
      });
    } catch (error: any) {
      toast({
        title: "Bulk publishing failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="w-4 h-4" />;
      case 'twitter': case 'x': return <Twitter className="w-4 h-4" />;
      case 'linkedin': return <Linkedin className="w-4 h-4" />;
      case 'instagram': return <Instagram className="w-4 h-4" />;
      case 'blog': return <Globe className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Share2 className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Draft</Badge>;
      case 'published':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Published</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Scheduled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Content Approval & Publishing</span>
            <Badge variant="outline">
              {content.filter(c => c.status === 'pending_review' || c.status === 'draft').length} items pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-fit">
              <TabsTrigger value="approval">Content Approval</TabsTrigger>
              <TabsTrigger value="dashboard">Publishing Dashboard</TabsTrigger>
              <TabsTrigger value="calendar">Publishing Calendar</TabsTrigger>
              <TabsTrigger value="publishing">Bulk Publishing</TabsTrigger>
            </TabsList>

            <TabsContent value="approval" className="space-y-4">
              <div className="space-y-4">
                {content
                  .filter(item => ['pending_review', 'draft', 'approved'].includes(item.status))
                  .map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(item.platform)}
                          <h3 className="font-medium">{item.title || 'Untitled'}</h3>
                          {getStatusBadge(item.status)}
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.body_text?.slice(0, 150)}...
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Platform: {item.platform}</span>
                          <span>Created: {format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewContent(item);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickApprove(item.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickReject(item.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48">
                            <div className="space-y-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                  setSelectedContent(item);
                                  setIsScheduleDialogOpen(true);
                                }}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Schedule
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => publishContent(item.id, 'social', ['facebook', 'twitter'])}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Publish Now
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => onEdit(item.id)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-red-600"
                                onClick={() => onDelete(item.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-6">
              <RealTimePublishingDashboard
                content={content}
                onBulkAction={handleBulkAction}
              />
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6">
              <PublishingCalendar
                content={content}
                onScheduleUpdate={handleScheduleUpdate}
                onScheduleContent={handleScheduleContent}
              />
            </TabsContent>

            <TabsContent value="publishing" className="space-y-6">
              {/* Bulk Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Content Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={bulkSelectedItems.length === content.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBulkSelectedItems(content.map(item => item.id));
                          } else {
                            setBulkSelectedItems([]);
                          }
                        }}
                      />
                      <Label>Select All ({bulkSelectedItems.length} selected)</Label>
                    </div>
                    
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {content.map((item) => (
                        <div key={item.id} className="flex items-center space-x-2 p-2 border rounded-lg">
                          <Checkbox
                            checked={bulkSelectedItems.includes(item.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setBulkSelectedItems(prev => [...prev, item.id]);
                              } else {
                                setBulkSelectedItems(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(item.platform)}
                              <span className="text-sm truncate">{item.title}</span>
                              <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Publishing Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Publishing Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Publish Type Selection */}
                  <div className="space-y-2">
                    <Label>Publishing Type</Label>
                    <Select value={selectedPublishType} onValueChange={setSelectedPublishType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select publishing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="email">Email Campaign</SelectItem>
                        <SelectItem value="all">All Platforms</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Platform Selection */}
                  {selectedPublishType === 'social' && (
                    <div className="space-y-2">
                      <Label>Select Platforms</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {['facebook', 'twitter', 'linkedin', 'instagram'].map((platform) => (
                          <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                              checked={selectedPlatforms.includes(platform)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPlatforms(prev => [...prev, platform]);
                                } else {
                                  setSelectedPlatforms(prev => prev.filter(p => p !== platform));
                                }
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(platform)}
                              <Label className="capitalize">{platform}</Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduling Options */}
                  <div className="space-y-4">
                    <Label>Schedule Publishing (Optional)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {scheduledDate ? format(scheduledDate, 'PPP') : 'Select date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={setScheduledDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Time</Label>
                        <Input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Publish Button */}
                  <Button 
                    onClick={handleBulkPublish}
                    disabled={bulkSelectedItems.length === 0 || !selectedPublishType}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {scheduledDate && scheduledTime ? 'Schedule' : 'Publish'} {bulkSelectedItems.length} Items
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Content Preview Modal */}
      <ContentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        content={previewContent}
        onEdit={() => {
          if (previewContent) {
            onEdit(previewContent.id);
            setIsPreviewOpen(false);
          }
        }}
        onPublish={() => {
          if (previewContent) {
            publishContent(previewContent.id, 'social', ['facebook', 'twitter']);
            setIsPreviewOpen(false);
          }
        }}
        onSchedule={() => {
          if (previewContent) {
            setSelectedContent(previewContent);
            setIsScheduleDialogOpen(true);
            setIsPreviewOpen(false);
          }
        }}
      />

      {/* Scheduling Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContent && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center space-x-2 mb-2">
                  {getPlatformIcon(selectedContent.platform)}
                  <span className="font-medium">{selectedContent.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedContent.body_text?.slice(0, 100)}...
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedContent && scheduledDate && scheduledTime) {
                    const scheduledDateTime = new Date(scheduledDate);
                    const [hours, minutes] = scheduledTime.split(':').map(Number);
                    scheduledDateTime.setHours(hours, minutes);
                    
                    await publishContent(selectedContent.id, 'social', ['facebook', 'twitter'], scheduledDateTime);
                    setIsScheduleDialogOpen(false);
                    setSelectedContent(null);
                    setScheduledDate(undefined);
                    setScheduledTime('');
                  }
                }}
                disabled={!selectedContent || !scheduledDate || !scheduledTime}
              >
                <Clock className="w-4 h-4 mr-2" />
                Schedule Content
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedContentApproval;