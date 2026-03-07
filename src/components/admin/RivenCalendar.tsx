import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  Calendar as CalendarIcon,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    contentId: string;
    platform: string;
    status: string;
    content: string;
    imageUrl?: string;
    hashtags: string[];
    campaignId: string;
  };
}

interface MarketingContent {
  id: string;
  campaign_id: string;
  platform: string;
  content_type: string;
  title: string;
  body_text: string;
  image_url: string;
  hashtags: string[];
  status: string;
  scheduled_time: string;
}

export const RivenCalendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadCalendarEvents();
  }, []);

  const loadCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_content')
        .select('*')
        .not('scheduled_time', 'is', null)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const calendarEvents: CalendarEvent[] = (data || []).map((content: MarketingContent) => {
        const startDate = new Date(content.scheduled_time);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

        return {
          id: content.id,
          title: `${content.platform}: ${content.title}`,
          start: startDate,
          end: endDate,
          resource: {
            contentId: content.id,
            platform: content.platform,
            status: content.status,
            content: content.body_text,
            imageUrl: content.image_url,
            hashtags: content.hashtags || [],
            campaignId: content.campaign_id,
          },
        };
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'blog': return <BookOpen className="h-4 w-4" />;
      default: return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return '#1877F2';
      case 'instagram': return '#E4405F';
      case 'twitter': return '#1DA1F2';
      case 'linkedin': return '#0A66C2';
      case 'youtube': return '#FF0000';
      case 'blog': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'scheduled': return 'bg-blue-500';
      case 'published': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  };

  const handleEventDrop = async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ scheduled_time: start.toISOString() })
        .eq('id', event.resource.contentId);

      if (error) throw error;

      await loadCalendarEvents();
      toast({
        title: "Event Rescheduled",
        description: "Content has been rescheduled successfully.",
      });
    } catch (error) {
      console.error('Error rescheduling event:', error);
      toast({
        title: "Error",
        description: "Failed to reschedule content.",
        variant: "destructive",
      });
    }
  };

  const approveContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ status: 'scheduled' })
        .eq('id', contentId);

      if (error) throw error;

      await loadCalendarEvents();
      setEditDialogOpen(false);
      
      toast({
        title: "Content Approved",
        description: "Content has been approved and scheduled for publishing.",
      });
    } catch (error) {
      console.error('Error approving content:', error);
    }
  };

  const publishNow = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', contentId);

      if (error) throw error;

      await loadCalendarEvents();
      setEditDialogOpen(false);
      
      toast({
        title: "Content Published",
        description: "Content has been published immediately.",
      });
    } catch (error) {
      console.error('Error publishing content:', error);
    }
  };

  const deleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      await loadCalendarEvents();
      setEditDialogOpen(false);
      
      toast({
        title: "Content Deleted",
        description: "Content has been deleted from the calendar.",
      });
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const updateContent = async (contentId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('marketing_content')
        .update(updates)
        .eq('id', contentId);

      if (error) throw error;

      await loadCalendarEvents();
      
      toast({
        title: "Content Updated",
        description: "Content has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating content:', error);
    }
  };

  const filteredEvents = events.filter(event => {
    const platformMatch = platformFilter === 'all' || event.resource.platform === platformFilter;
    const statusMatch = statusFilter === 'all' || event.resource.status === statusFilter;
    return platformMatch && statusMatch;
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = getPlatformColor(event.resource.platform);
    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: 'white',
        border: '1px solid',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center gap-1 text-xs">
      {getPlatformIcon(event.resource.platform)}
      <span className="truncate">{event.title}</span>
      <Badge variant="secondary" className={`${getStatusColor(event.resource.status)} text-white text-xs px-1`}>
        {event.resource.status}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Content Calendar
            </CardTitle>
            <div className="flex items-center gap-4">
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectEvent={handleEventSelect}
              onEventDrop={handleEventDrop}
              eventPropGetter={eventStyleGetter}
              components={{
                event: CustomEvent,
              }}
              draggableAccessor={() => true}
              resizable={false}
              popup
              showMultiDayTimes
              step={60}
              timeslots={1}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              toolbar={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && getPlatformIcon(selectedEvent.resource.platform)}
              Content Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getPlatformIcon(selectedEvent.resource.platform)}
                  {selectedEvent.resource.platform}
                </Badge>
                <Badge className={getStatusColor(selectedEvent.resource.status)}>
                  {selectedEvent.resource.status}
                </Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={selectedEvent.resource.content}
                  onChange={(e) => {
                    setSelectedEvent({
                      ...selectedEvent,
                      resource: {
                        ...selectedEvent.resource,
                        content: e.target.value,
                      },
                    });
                  }}
                  className="mt-1"
                  rows={4}
                />
              </div>

              {selectedEvent.resource.hashtags.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Hashtags</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEvent.resource.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Scheduled Time</label>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.start.toLocaleDateString()} at {selectedEvent.start.toLocaleTimeString()}
                </p>
              </div>

              {selectedEvent.resource.imageUrl && (
                <div>
                  <label className="text-sm font-medium">Image</label>
                  <img 
                    src={selectedEvent.resource.imageUrl} 
                    alt="Content image" 
                    className="mt-1 rounded-lg max-h-32 object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4">
                {selectedEvent.resource.status === 'draft' && (
                  <Button onClick={() => approveContent(selectedEvent.resource.contentId)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Schedule
                  </Button>
                )}
                
                {['draft', 'scheduled'].includes(selectedEvent.resource.status) && (
                  <Button 
                    variant="outline" 
                    onClick={() => publishNow(selectedEvent.resource.contentId)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Publish Now
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    updateContent(selectedEvent.resource.contentId, {
                      body_text: selectedEvent.resource.content
                    });
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update Content
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={() => deleteContent(selectedEvent.resource.contentId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};