import { useState, useCallback } from 'react';

export interface PublishingMetrics {
  totalPublished: number;
  successRate: number;
  avgProcessingTime: number;
  failureRate: number;
  platformBreakdown: Record<string, { success: number; failed: number; avgTime: number }>;
  recentActivity: PublishingActivity[];
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface PublishingActivity {
  id: string;
  content_id: string;
  platform: string;
  status: 'pending' | 'processing' | 'published' | 'failed' | 'retrying';
  created_at: string;
  processed_at?: string;
  error_message?: string;
  processing_time_ms?: number;
  retry_count: number;
}

export interface QualityTrend {
  date: string;
  avgScore: number;
  totalContent: number;
  passedValidation: number;
  topIssues: Array<{ issue: string; count: number }>;
}

export function usePublishingMonitoring() {
  const [metrics] = useState<PublishingMetrics>({
    totalPublished: 156,
    successRate: 94.2,
    avgProcessingTime: 2300,
    failureRate: 5.8,
    platformBreakdown: {
      twitter: { success: 45, failed: 2, avgTime: 1800 },
      linkedin: { success: 38, failed: 1, avgTime: 2100 },
      facebook: { success: 42, failed: 3, avgTime: 2700 },
      instagram: { success: 22, failed: 3, avgTime: 3200 }
    },
    recentActivity: [
      {
        id: '1',
        content_id: 'content-1',
        platform: 'twitter',
        status: 'published',
        created_at: new Date().toISOString(),
        processing_time_ms: 1800,
        retry_count: 0
      },
      {
        id: '2', 
        content_id: 'content-2',
        platform: 'linkedin',
        status: 'failed',
        created_at: new Date(Date.now() - 300000).toISOString(),
        error_message: 'Authentication failed',
        retry_count: 2
      },
      {
        id: '3',
        content_id: 'content-3',
        platform: 'facebook',
        status: 'published',
        created_at: new Date(Date.now() - 600000).toISOString(),
        processing_time_ms: 2700,
        retry_count: 0
      },
      {
        id: '4',
        content_id: 'content-4',
        platform: 'instagram',
        status: 'processing',
        created_at: new Date(Date.now() - 120000).toISOString(),
        retry_count: 0
      }
    ],
    systemHealth: 'healthy'
  });

  const [qualityTrends] = useState<QualityTrend[]>([
    {
      date: '2024-01-15',
      avgScore: 87,
      totalContent: 12,
      passedValidation: 11,
      topIssues: [
        { issue: 'SEO title too long', count: 3 },
        { issue: 'Missing meta description', count: 2 }
      ]
    },
    {
      date: '2024-01-16',
      avgScore: 92,
      totalContent: 15,
      passedValidation: 14,
      topIssues: [
        { issue: 'Content too short', count: 2 },
        { issue: 'No call-to-action', count: 1 }
      ]
    },
    {
      date: '2024-01-17',
      avgScore: 89,
      totalContent: 18,
      passedValidation: 16,
      topIssues: [
        { issue: 'Poor readability score', count: 4 },
        { issue: 'Missing keywords', count: 2 }
      ]
    }
  ]);

  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);

  const retryFailedPublishing = useCallback(async (activityId: string) => {
    console.log('Retrying publishing for:', activityId);
    return { success: true };
  }, []);

  const clearFailedItems = useCallback(async () => {
    console.log('Clearing failed items');
    return { success: true };
  }, []);

  const getHealthRecommendations = useCallback(() => {
    if (!metrics) return [];

    const recommendations: string[] = [];

    if (metrics.successRate < 80) {
      recommendations.push('Success rate is below 80%. Check API credentials and network connectivity.');
    }

    if (metrics.avgProcessingTime > 20000) {
      recommendations.push('Average processing time is high. Consider optimizing content processing.');
    }

    if (metrics.failureRate > 20) {
      recommendations.push('High failure rate detected. Review error logs and retry mechanisms.');
    }

    Object.entries(metrics.platformBreakdown).forEach(([platform, data]) => {
      const platformSuccessRate = data.success / (data.success + data.failed) * 100;
      if (platformSuccessRate < 70) {
        recommendations.push(`${platform} has low success rate (${platformSuccessRate.toFixed(1)}%). Check platform-specific issues.`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('System is operating within normal parameters.');
    }

    return recommendations;
  }, [metrics]);

  return {
    metrics,
    qualityTrends,
    isLoading,
    error,
    retryFailedPublishing,
    clearFailedItems,
    getHealthRecommendations,
    refreshMetrics: () => Promise.resolve(),
    refreshTrends: () => Promise.resolve()
  };
}