import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  GripVertical,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Mail
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface ScheduledContent {
  id: string;
  title: string;
  platform: string;
  scheduledTime: Date;
  status: string;
}

interface TimeSlot {
  id: string;
  time: string;
  content: ScheduledContent[];
}

interface PublishingCalendarProps {
  content: any[];
  onScheduleUpdate: (contentId: string, newTime: Date) => void;
  onScheduleContent: (contentId: string, scheduledTime: Date) => void;
}

const getPlatformIcon = (platform: string) => {
  const p = platform?.toLowerCase();
  switch (p) {
    case 'facebook': return <Facebook className="w-4 h-4" />;
    case 'twitter': case 'x': return <Twitter className="w-4 h-4" />;
    case 'linkedin': return <Linkedin className="w-4 h-4" />;
    case 'instagram': return <Instagram className="w-4 h-4" />;
    case 'blog': return <Globe className="w-4 h-4" />;
    case 'email': return <Mail className="w-4 h-4" />;
    default: return <Globe className="w-4 h-4" />;
  }
};

const PublishingCalendar: React.FC<PublishingCalendarProps> = ({
  content,
  onScheduleUpdate,
  onScheduleContent
}) => {
  const { toast } = useToast();
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '09:00', time: '09:00', content: [] },
    { id: '12:00', time: '12:00', content: [] },
    { id: '15:00', time: '15:00', content: [] },
    { id: '18:00', time: '18:00', content: [] },
    { id: '21:00', time: '21:00', content: [] }
  ]);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');

  // Generate week days
  useEffect(() => {
    const start = startOfWeek(selectedWeek, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(selectedWeek, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    setWeekDays(days);
  }, [selectedWeek]);

  // Organize content by time slots and days
  useEffect(() => {
    const organizedSlots = timeSlots.map(slot => ({
      ...slot,
      content: content.filter(item => {
        if (!item.scheduled_time) return false;
        const scheduleTime = new Date(item.scheduled_time);
        const itemTime = format(scheduleTime, 'HH:mm');
        return itemTime === slot.time;
      })
    }));
    
    setTimeSlots(organizedSlots);
  }, [content]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Parse the destination droppableId: "slot-{timeSlot}-{dayIndex}"
    const destParts = destination.droppableId.split('-');
    const timeSlot = destParts[1];
    const dayIndex = parseInt(destParts[2]);
    
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= weekDays.length) return;

    const selectedDay = weekDays[dayIndex];
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    const newScheduleTime = new Date(selectedDay);
    newScheduleTime.setHours(hours, minutes, 0, 0);

    // Find the content item
    const contentItem = content.find(item => item.id === draggableId);
    if (!contentItem) return;

    // Update the schedule
    onScheduleUpdate(contentItem.id, newScheduleTime);
    
    toast({
      title: "Content rescheduled",
      description: `${contentItem.title} moved to ${format(newScheduleTime, 'PPP p')}`,
    });
  };

  const handleScheduleContent = () => {
    if (!selectedContent || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select content, date, and time.",
        variant: "destructive"
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledTime = new Date(selectedDate);
    scheduledTime.setHours(hours, minutes, 0, 0);

    onScheduleContent(selectedContent.id, scheduledTime);
    
    setIsScheduleDialogOpen(false);
    setSelectedContent(null);
    setSelectedDate(undefined);
    setSelectedTime('');
    
    toast({
      title: "Content scheduled",
      description: `${selectedContent.title} scheduled for ${format(scheduledTime, 'PPP p')}`,
    });
  };

  const getContentForSlotAndDay = (timeSlot: string, dayIndex: number) => {
    const day = weekDays[dayIndex];
    if (!day) return [];

    return content.filter(item => {
      if (!item.scheduled_time) return false;
      const scheduleTime = new Date(item.scheduled_time);
      const isSameDay = format(scheduleTime, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      const isSameTime = format(scheduleTime, 'HH:mm') === timeSlot;
      return isSameDay && isSameTime;
    });
  };

  const unscheduledContent = content.filter(item => 
    !item.scheduled_time && ['approved', 'draft'].includes(item.status)
  );

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Publishing Calendar</h2>
          <p className="text-muted-foreground">
            Week of {format(startOfWeek(selectedWeek, { weekStartsOn: 1 }), 'PPP')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
          >
            Previous Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(new Date())}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
          >
            Next Week
          </Button>
        </div>
      </div>

      {/* Unscheduled Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Unscheduled Content</span>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Content
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule Content</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Select Content</Label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedContent?.id || ''}
                      onChange={(e) => {
                        const content = unscheduledContent.find(c => c.id === e.target.value);
                        setSelectedContent(content);
                      }}
                    >
                      <option value="">Choose content...</option>
                      {unscheduledContent.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.platform})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div>
                    <Label>Select Time</Label>
                    <Input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    />
                  </div>
                  
                  <Button onClick={handleScheduleContent} className="w-full">
                    Schedule Content
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="unscheduled" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex space-x-2 min-h-[100px] p-2 border-2 border-dashed border-muted-foreground/25 rounded-lg"
                >
                  {unscheduledContent.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 border rounded-lg bg-background min-w-[200px] ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            {getPlatformIcon(item.platform)}
                            <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                          </div>
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.body_text?.slice(0, 50)}...
                          </p>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {unscheduledContent.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      All content is scheduled
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-4 border-r bg-muted/50">
              <Clock className="w-4 h-4" />
            </div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-4 text-center border-r bg-muted/50">
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div className="text-sm text-muted-foreground">{format(day, 'MMM d')}</div>
              </div>
            ))}
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            {timeSlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-8 border-b min-h-[120px]">
                <div className="p-4 border-r bg-muted/50 flex items-center">
                  <span className="font-medium">{slot.time}</span>
                </div>
                
                {weekDays.map((day, dayIndex) => (
                  <Droppable key={`${slot.time}-${dayIndex}`} droppableId={`slot-${slot.time}-${dayIndex}`}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 border-r space-y-2 ${
                          snapshot.isDraggingOver ? 'bg-muted/50' : ''
                        }`}
                      >
                        {getContentForSlotAndDay(slot.time, dayIndex).map((item, index) => (
                          <Draggable key={item.id} draggableId={item.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-2 border rounded-lg bg-background ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <div className="flex items-center space-x-1 mb-1">
                                  {getPlatformIcon(item.platform)}
                                  <Badge variant="outline" className="text-xs">{item.platform}</Badge>
                                </div>
                                <h4 className="font-medium text-xs truncate">{item.title}</h4>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            ))}
          </DragDropContext>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublishingCalendar;