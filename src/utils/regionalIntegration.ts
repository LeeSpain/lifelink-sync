// Regional Call Centre Integration Utilities

export const REGIONAL_ROLES = {
  OPERATOR: 'regional_operator',
  SUPERVISOR: 'regional_supervisor', 
  PLATFORM_ADMIN: 'platform_admin'
} as const;

export const EMERGENCY_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const SOS_STATUS = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  CLOSED: 'closed'
} as const;

export const NOTIFICATION_TYPES = {
  QUICK_ACTION: 'quick_action',
  CUSTOM_NOTE: 'custom_note'
} as const;