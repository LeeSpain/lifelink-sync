import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { trackPageView } from '@/lib/analytics';

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const trackPage = async () => {
      const pagePath = location.pathname;
      const pageTitle = document.title;
      
      // Track in Google Analytics
      trackPageView(pagePath, pageTitle);
      
      // Track in our custom analytics with geographic data
      try {
        const sessionId = sessionStorage.getItem('analytics_session_id') || 
          crypto.randomUUID();
        sessionStorage.setItem('analytics_session_id', sessionId);
        
        // Get geographic location data
        let locationData = null;
        try {
          const geoResponse = await supabase.functions.invoke('geo-lookup');
          if (geoResponse.data && !geoResponse.error) {
            locationData = geoResponse.data;
          }
        } catch (geoError) {
          console.warn('Could not fetch location data:', geoError);
        }
        
        await supabase.from('homepage_analytics').insert({
          event_type: 'page_view',
          page_context: pagePath,
          session_id: sessionId,
          event_data: {
            page_title: pageTitle,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            screen_resolution: `${screen.width}x${screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            location: locationData
          }
        });
        
        console.log('📊 Page view tracked:', { page: pagePath, title: pageTitle });
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPage();
  }, [location]);
}

export function trackCustomEvent(eventType: string, eventData?: Record<string, any>) {
  return new Promise(async (resolve, reject) => {
    try {
      const sessionId = sessionStorage.getItem('analytics_session_id') || 
        crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
      
      await supabase.from('homepage_analytics').insert({
        event_type: eventType,
        page_context: location.pathname,
        session_id: sessionId,
        event_data: {
          ...eventData,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }
      });
      
      console.log('📊 Custom event tracked:', { eventType, eventData });
      resolve(true);
    } catch (error) {
      console.error('Error tracking custom event:', error);
      reject(error);
    }
  });
}