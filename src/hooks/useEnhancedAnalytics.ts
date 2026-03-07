import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceData {
  device: string;
  sessions: number;
  percentage: number;
}

export interface SessionMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  activeUsers: number;
  totalSessions: number;
}

// Hook for enhanced traffic sources with real data
export function useEnhancedTrafficSources() {
  return useQuery({
    queryKey: ['enhanced-traffic-sources'],
    queryFn: async (): Promise<TrafficSource[]> => {
      try {
        const { data, error } = await supabase
          .from('homepage_analytics')
          .select('event_data')
          .eq('event_type', 'page_view')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .range(0, 99999);

        if (error) throw error;

        const sources: Record<string, number> = {
          'Direct': 0,
          'Organic Search': 0,
          'Social Media': 0,
          'Referral': 0
        };

        data?.forEach(item => {
          const eventData = item.event_data as Record<string, any> || {};
          const referrer = eventData.referrer || '';
          
          if (!referrer || referrer === window.location.origin) {
            sources['Direct']++;
          } else if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) {
            sources['Organic Search']++;
          } else if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('linkedin') || referrer.includes('instagram')) {
            sources['Social Media']++;
          } else {
            sources['Referral']++;
          }
        });

        const total = Object.values(sources).reduce((sum, count) => sum + count, 0);
        
        return Object.entries(sources).map(([source, visitors]) => ({
          source,
          visitors,
          percentage: total > 0 ? parseFloat(((visitors / total) * 100).toFixed(1)) : 0
        }));
      } catch (error) {
        console.error('Error fetching traffic sources:', error);
        return [
          { source: 'Direct', visitors: 0, percentage: 0 },
          { source: 'Organic Search', visitors: 0, percentage: 0 },
          { source: 'Social Media', visitors: 0, percentage: 0 },
          { source: 'Referral', visitors: 0, percentage: 0 }
        ];
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });
}

// Hook for enhanced device data with real data
export function useEnhancedDeviceData() {
  return useQuery({
    queryKey: ['enhanced-device-data'],
    queryFn: async (): Promise<DeviceData[]> => {
      try {
        const { data, error } = await supabase
          .from('homepage_analytics')
          .select('event_data')
          .eq('event_type', 'page_view')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .range(0, 99999);

        if (error) throw error;

        const devices: Record<string, number> = {
          'Mobile': 0,
          'Desktop': 0,
          'Tablet': 0
        };

        data?.forEach(item => {
          const eventData = item.event_data as Record<string, any> || {};
          const userAgent = eventData.user_agent || '';
          
          if (/Mobile|Android|iPhone|iPod/.test(userAgent)) {
            devices['Mobile']++;
          } else if (/iPad/.test(userAgent)) {
            devices['Tablet']++;
          } else {
            devices['Desktop']++;
          }
        });

        const total = Object.values(devices).reduce((sum, count) => sum + count, 0);
        
        return Object.entries(devices).map(([device, sessions]) => ({
          device,
          sessions,
          percentage: total > 0 ? parseFloat(((sessions / total) * 100).toFixed(1)) : 0
        }));
      } catch (error) {
        console.error('Error fetching device data:', error);
        return [
          { device: 'Mobile', sessions: 0, percentage: 0 },
          { device: 'Desktop', sessions: 0, percentage: 0 },
          { device: 'Tablet', sessions: 0, percentage: 0 }
        ];
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });
}

// Hook for session metrics
export function useSessionMetrics() {
  return useQuery({
    queryKey: ['session-metrics'],
    queryFn: async (): Promise<SessionMetrics> => {
      try {
        // Get session data
        const { data: sessionData, error } = await supabase
          .from('homepage_analytics')
          .select('session_id, created_at, event_type')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .range(0, 99999)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Calculate session metrics
        const sessions: Record<string, { start: Date; end: Date; pageViews: number }> = {};
        
        sessionData?.forEach(item => {
          const sessionId = item.session_id;
          const timestamp = new Date(item.created_at);
          
          if (!sessions[sessionId]) {
            sessions[sessionId] = {
              start: timestamp,
              end: timestamp,
              pageViews: 0
            };
          }
          
          if (timestamp < sessions[sessionId].start) {
            sessions[sessionId].start = timestamp;
          }
          if (timestamp > sessions[sessionId].end) {
            sessions[sessionId].end = timestamp;
          }
          
          if (item.event_type === 'page_view') {
            sessions[sessionId].pageViews++;
          }
        });

        const sessionValues = Object.values(sessions);
        const totalSessions = sessionValues.length;
        
        // Calculate average session duration
        const totalDuration = sessionValues.reduce((sum, session) => {
          return sum + (session.end.getTime() - session.start.getTime());
        }, 0);
        const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions / 1000 : 0;
        
        // Calculate bounce rate (sessions with only 1 page view)
        const bouncedSessions = sessionValues.filter(session => session.pageViews <= 1).length;
        const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
        
        // Active users in last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const activeUsers = sessionValues.filter(session => session.end >= oneHourAgo).length;

        return {
          avgSessionDuration: parseFloat(avgSessionDuration.toFixed(1)),
          bounceRate: parseFloat(bounceRate.toFixed(1)),
          activeUsers,
          totalSessions
        };
      } catch (error) {
        console.error('Error fetching session metrics:', error);
        return {
          avgSessionDuration: 0,
          bounceRate: 0,
          activeUsers: 0,
          totalSessions: 0
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
  });
}