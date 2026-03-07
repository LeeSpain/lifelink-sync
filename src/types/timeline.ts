// Unified Contact Timeline System Types
// Sprint 3: Perfect Memory Implementation

export type EventType =
  | 'chat_message'
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'voice_call'
  | 'conference_join'
  | 'sos_incident'
  | 'lead_captured'
  | 'lead_score_change'
  | 'registration_completed'
  | 'subscription_change'
  | 'payment_event'
  | 'profile_update'
  | 'ai_interaction'
  | 'custom_event';

export type EventCategory = 'communication' | 'emergency' | 'sales' | 'support' | 'system';

export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent';

export type LeadStatus = 'cold' | 'warm' | 'hot' | 'customer' | 'churned';

export type SentimentTrend = 'improving' | 'declining' | 'stable';

export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface TimelineEvent {
  id: string;

  // Contact identification
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;

  // Event metadata
  eventType: EventType;
  eventCategory: EventCategory;
  eventTitle: string;
  eventDescription?: string;
  eventData: Record<string, any>;

  // Source tracking
  sourceType: string;
  sourceId?: string;

  // Related entities
  relatedIncidentId?: string;
  relatedConferenceId?: string;
  relatedConversationId?: string;

  // AI analysis
  sentiment?: Sentiment;
  aiSummary?: string;
  aiTags?: string[];
  importanceScore: number; // 1-5

  // Timestamps
  occurredAt: string;
  createdAt: string;
}

export interface ContactEngagementSummary {
  id: string;
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Engagement metrics
  totalInteractions: number;
  lastInteractionAt: string;
  firstInteractionAt: string;

  // Channel breakdown
  emailCount: number;
  chatCount: number;
  voiceCount: number;
  emergencyCount: number;

  // Email engagement
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  emailOpenRate?: number;
  emailClickRate?: number;

  // Lead scoring
  leadScore: number;
  leadStatus?: LeadStatus;

  // Sentiment tracking
  positiveInteractions: number;
  negativeInteractions: number;
  sentimentTrend?: SentimentTrend;

  // Risk indicators
  riskLevel?: RiskLevel;
  lastEmergencyAt?: string;
  emergencyResponseAvgMinutes?: number;

  // Timestamps
  updatedAt: string;
  createdAt: string;
}

export interface AIContactContext {
  id: string;
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Pre-computed context for AI
  fullContext: string;
  keyFacts: string[];
  recentEventsSummary?: string;
  relationshipStatus?: string;

  // Preferences & patterns
  preferredChannel?: string;
  typicalResponseTimeMinutes?: number;
  activeTimesOfDay?: string[];

  // Context metadata
  contextGeneratedAt: string;
  contextVersion: number;
  lastTimelineEventId?: string;

  updatedAt: string;
  createdAt: string;
}

export interface TimelineAggregatorRequest {
  action:
    | 'add_event'
    | 'capture_sos'
    | 'capture_conference_join'
    | 'capture_chat'
    | 'get_ai_context';

  // For add_event
  event?: Partial<TimelineEvent>;

  // For capture_sos
  incident?: any;

  // For capture_conference_join
  participant?: any;
  conference?: any;

  // For capture_chat
  message?: any;
  conversation?: any;

  // For get_ai_context
  userId?: string;
  contactEmail?: string;
}

export interface TimelineAggregatorResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface TimelineFilterOptions {
  userId?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventCategory?: EventCategory;
  eventType?: EventType;
  importanceScore?: number;
  sentimentFilter?: Sentiment;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface TimelineStats {
  totalEvents: number;
  eventsByCategory: Record<EventCategory, number>;
  eventsByType: Record<EventType, number>;
  averageImportance: number;
  sentimentBreakdown: Record<Sentiment, number>;
}

// Helper type for creating new timeline events
export type CreateTimelineEvent = Omit<TimelineEvent, 'id' | 'createdAt' | 'aiSummary'> & {
  aiSummary?: string;
};

// Database JSON response types
export interface GetAIContextResult {
  context_summary: string;
  recent_events: Array<{
    event_type: string;
    event_title: string;
    event_description: string;
    occurred_at: string;
    importance: number;
  }>;
  engagement_metrics: {
    total_interactions: number;
    lead_score: number;
    email_open_rate: number;
    sentiment_trend: string;
  };
  risk_indicators: {
    risk_level: string;
    last_emergency_at?: string;
    emergency_response_avg?: number;
  };
}

// Event importance constants
export const IMPORTANCE = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  INFO: 5,
} as const;

// Event type display names
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  chat_message: 'Chat Message',
  email_sent: 'Email Sent',
  email_opened: 'Email Opened',
  email_clicked: 'Email Clicked',
  voice_call: 'Voice Call',
  conference_join: 'Conference Join',
  sos_incident: 'SOS Incident',
  lead_captured: 'Lead Captured',
  lead_score_change: 'Lead Score Change',
  registration_completed: 'Registration',
  subscription_change: 'Subscription Change',
  payment_event: 'Payment Event',
  profile_update: 'Profile Update',
  ai_interaction: 'AI Interaction',
  custom_event: 'Custom Event',
};

// Category display names
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  communication: 'Communication',
  emergency: 'Emergency',
  sales: 'Sales',
  support: 'Support',
  system: 'System',
};

// Sentiment emojis
export const SENTIMENT_EMOJIS: Record<Sentiment, string> = {
  positive: '😊',
  neutral: '😐',
  negative: '😞',
  urgent: '⚠️',
};

// Event icons
export const EVENT_ICONS: Record<EventType, string> = {
  chat_message: '💬',
  email_sent: '📧',
  email_opened: '👀',
  email_clicked: '🔗',
  voice_call: '📞',
  conference_join: '👥',
  sos_incident: '🚨',
  lead_captured: '🎯',
  lead_score_change: '📈',
  registration_completed: '✅',
  subscription_change: '💳',
  payment_event: '💰',
  profile_update: '👤',
  ai_interaction: '🤖',
  custom_event: '📌',
};
