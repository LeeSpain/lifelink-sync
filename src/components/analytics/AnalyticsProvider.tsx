import React, { useEffect } from 'react';
import { usePageTracking } from '@/hooks/usePageTracking';
import { useScrollTracking, useClickTracking, useFormTracking } from '@/hooks/useInteractionTracking';
import { initAnalytics } from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  // Initialize analytics services
  useEffect(() => {
    initAnalytics();
    console.log('🔧 Analytics services initialized');
  }, []);

  // Initialize all tracking hooks
  usePageTracking();
  useScrollTracking();
  useClickTracking();
  useFormTracking();

  return <>{children}</>;
};