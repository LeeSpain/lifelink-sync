import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Clock, 
  Phone, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle,
  User,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ActiveSOSPanelProps {
  client: any;
  events: any[];
  organizationId?: string;
}

export const ActiveSOSPanel: React.FC<ActiveSOSPanelProps> = ({
  client,
  events,
  organizationId
}) => {
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const activeEvents = events.filter(e => e.client_id === client.user_id && e.status === 'open');
  const currentEvent = activeEvents[0] || selectedEvent;

  useEffect(() => {
    if (activeEvents.length > 0) {
      setSelectedEvent(activeEvents[0]);
    }
  }, [activeEvents]);

  const handleQuickNotification = async (notificationKey: string) => {
    if (!currentEvent) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('regional-quick-notification', {
        body: {
          event_id: currentEvent.id,
          notification_key: notificationKey,
          variables: {
            client_first: client.first_name,
            location: currentEvent.address || 'Location updating...'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Notification sent",
        description: "Quick notification sent to family and emergency contacts.",
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!currentEvent || !noteText.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('regional-send-note', {
        body: {
          event_id: currentEvent.id,
          note: noteText.trim()
        }
      });

      if (error) throw error;

      setNoteText('');
      toast({
        title: "Note sent",
        description: "Note sent and pushed to family members.",
      });
    } catch (error) {
      console.error('Error sending note:', error);
      toast({
        title: "Error",
        description: "Failed to send note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseEvent = async () => {
    if (!currentEvent) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('regional-close-event', {
        body: {
          event_id: currentEvent.id,
          outcome: 'resolved',
          summary: 'Event resolved by regional operator'
        }
      });

      if (error) throw error;

      toast({
        title: "Event closed",
        description: "Emergency event has been closed successfully.",
      });
    } catch (error) {
      console.error('Error closing event:', error);
      toast({
        title: "Error",
        description: "Failed to close event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-blue-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  if (!currentEvent) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Emergency</h3>
          <p className="text-muted-foreground">
            {client.first_name} {client.last_name} has no active emergency events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Emergency Header */}
      <div className="border rounded-lg p-4 bg-red-50 border-red-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">ACTIVE EMERGENCY</h3>
          </div>
          <Badge className={getPriorityColor(currentEvent.priority)}>
            {currentEvent.priority?.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-red-700 font-medium">Client:</p>
            <p className="text-red-900">{client.first_name} {client.last_name}</p>
          </div>
          <div>
            <p className="text-red-700 font-medium">Time:</p>
            <p className="text-red-900">
              {new Date(currentEvent.triggered_at).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-red-700 font-medium">Type:</p>
            <p className="text-red-900">{currentEvent.emergency_type || 'General'}</p>
          </div>
          <div>
            <p className="text-red-700 font-medium">Source:</p>
            <p className="text-red-900">{currentEvent.source || 'App'}</p>
          </div>
        </div>

        {(currentEvent.lat && currentEvent.lng) && (
          <div className="mt-3 p-2 bg-white rounded border">
            <p className="text-red-700 font-medium mb-1">Location:</p>
            <p className="text-sm text-red-900">
              <MapPin className="h-3 w-3 inline mr-1" />
              {currentEvent.lat.toFixed(6)}, {currentEvent.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Map integration coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleQuickNotification('emergency_services_contacted')}
              disabled={isLoading}
            >
              <Phone className="h-4 w-4 mr-2" />
              Contact 112
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQuickNotification('operator_responding')}
              disabled={isLoading}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Operator Responding
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQuickNotification('false_alarm_confirmed')}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              False Alarm
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQuickNotification('advice_given')}
              disabled={isLoading}
            >
              <User className="h-4 w-4 mr-2" />
              Advice Given
            </Button>
          </div>

          {/* Custom Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Send Custom Note:</label>
            <Textarea
              placeholder="Type a custom message to send to family members..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
            />
            <Button 
              size="sm"
              onClick={handleSendNote}
              disabled={isLoading || !noteText.trim()}
            >
              Send Note
            </Button>
          </div>

          {/* Close Event */}
          <div className="pt-4 border-t">
            <Button 
              variant="destructive"
              onClick={handleCloseEvent}
              disabled={isLoading}
              className="w-full"
            >
              Close Emergency Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};