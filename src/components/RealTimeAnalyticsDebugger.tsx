import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Activity, BarChart3, Users, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  id: string;
  event_type: string;
  page_context: string;
  session_id: string;
  event_data: any;
  created_at: string;
}

interface VideoEvent {
  id: string;
  video_id: string;
  event_type: string;
  user_location: any;
  created_at: string;
}

const RealTimeAnalyticsDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [recentVideoEvents, setRecentVideoEvents] = useState<VideoEvent[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [videoEventCount, setVideoEventCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    // Fetch initial data
    fetchRecentEvents();
    fetchRecentVideoEvents();

    // Set up real-time subscriptions
    const analyticsChannel = supabase
      .channel('analytics-debug')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'homepage_analytics'
        },
        (payload) => {
          console.log('📊 New Analytics Event:', payload.new);
          setRecentEvents(prev => [payload.new as AnalyticsEvent, ...prev.slice(0, 9)]);
          setEventCount(prev => prev + 1);
        }
      )
      .subscribe();

    const videoChannel = supabase
      .channel('video-debug')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_analytics'
        },
        (payload) => {
          console.log('🎥 New Video Event:', payload.new);
          setRecentVideoEvents(prev => [payload.new as VideoEvent, ...prev.slice(0, 9)]);
          setVideoEventCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsChannel);
      supabase.removeChannel(videoChannel);
    };
  }, [isVisible]);

  const fetchRecentEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchRecentVideoEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('video_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentVideoEvents(data || []);
    } catch (error) {
      console.error('Error fetching video analytics:', error);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('video')) return <Video className="h-3 w-3" />;
    if (eventType.includes('button') || eventType.includes('click')) return <Activity className="h-3 w-3" />;
    if (eventType.includes('page')) return <BarChart3 className="h-3 w-3" />;
    return <Users className="h-3 w-3" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('video')) return 'bg-blue-500';
    if (eventType.includes('button') || eventType.includes('click')) return 'bg-green-500';
    if (eventType.includes('page')) return 'bg-purple-500';
    if (eventType.includes('sos')) return 'bg-red-500';
    if (eventType.includes('chat')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          size="sm"
          variant="outline"
          className="bg-background shadow-lg border-2"
        >
          <Eye className="h-4 w-4 mr-2" />
          Analytics Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Debug
              <Badge variant="secondary" className="text-xs">
                {eventCount + videoEventCount} events
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Recent Analytics Events */}
            <div>
              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Recent Events ({recentEvents.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <Badge 
                      className={`${getEventColor(event.event_type)} text-white text-xs px-1 py-0`}
                    >
                      {getEventIcon(event.event_type)}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.event_type}</div>
                      <div className="text-muted-foreground truncate">{event.page_context}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Video Events */}
            <div>
              <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
                <Video className="h-3 w-3" />
                Video Events ({recentVideoEvents.length})
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentVideoEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                    <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                      <Video className="h-3 w-3" />
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{event.event_type}</div>
                      <div className="text-muted-foreground truncate">{event.video_id}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              onClick={() => {
                fetchRecentEvents();
                fetchRecentVideoEvents();
              }}
              size="sm"
              variant="outline"
              className="w-full"
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAnalyticsDebugger;