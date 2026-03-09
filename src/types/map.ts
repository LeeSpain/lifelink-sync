// Shared map types for LifeLink Sync MapLibre system

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export type MemberStatus = 'live' | 'idle' | 'offline' | 'paused';
export type MarkerUrgency = 'normal' | 'warning' | 'urgent' | 'offline' | 'operational';
export type MapMode = 'overview' | 'emergency' | 'members' | 'devices' | 'coverage' | 'analytics';

export interface MapEntity {
  id: string;
  type: 'member' | 'device' | 'incident' | 'geofence';
  lat: number;
  lng: number;
  label?: string;
  status?: MemberStatus;
  urgency?: MarkerUrgency;
  avatar_url?: string;
  battery?: number | null;
  accuracy?: number;
  speed?: number;
  heading?: number;
  last_seen?: string;
  is_paused?: boolean;
  first_name?: string;
  last_name?: string;
  metadata?: Record<string, unknown>;
}

export interface GeofenceEntity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius_m: number;
  family_group_id: string;
}

export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp?: string;
  accuracy?: number;
  speed?: number;
  battery?: number;
}

export interface IncidentEntity {
  id: string;
  lat: number;
  lng: number;
  status: 'active' | 'acknowledged' | 'resolved';
  user_id: string;
  started_at: string;
  label?: string;
}

export interface MapFilterState {
  mode: MapMode;
  showOffline: boolean;
  showPaused: boolean;
  searchQuery: string;
  selectedEntityId: string | null;
  statusFilters: MemberStatus[];
}

export interface MapSummary {
  totalMembers: number;
  activeMembers: number;
  offlineMembers: number;
  pausedMembers: number;
  activeIncidents: number;
  filteredCount: number;
}

export function getStatusFromPresence(last_seen?: string, is_paused?: boolean): MemberStatus {
  if (is_paused) return 'paused';
  if (!last_seen) return 'offline';
  const diff = Date.now() - new Date(last_seen).getTime();
  if (diff < 2 * 60 * 1000) return 'live';
  if (diff < 60 * 60 * 1000) return 'idle';
  return 'offline';
}

export function getUrgencyFromStatus(status: MemberStatus): MarkerUrgency {
  switch (status) {
    case 'live': return 'normal';
    case 'idle': return 'warning';
    case 'offline': return 'offline';
    case 'paused': return 'offline';
  }
}

export const STATUS_COLORS: Record<MarkerUrgency, string> = {
  normal: '#22c55e',    // green
  warning: '#f59e0b',   // amber
  urgent: '#ef4444',    // red
  offline: '#94a3b8',   // grey
  operational: '#3b82f6' // blue
};

export const STATUS_LABELS: Record<MemberStatus, string> = {
  live: 'Online',
  idle: 'Away',
  offline: 'Offline',
  paused: 'Paused',
};
