// Conference Bridge Type Definitions

export interface EmergencyConference {
  id: string;
  incident_id: string;
  conference_sid: string | null;
  conference_name: string;
  status: 'active' | 'completed' | 'failed';
  user_joined_at: string | null;
  started_at: string;
  ended_at: string | null;
  recording_url: string | null;
  recording_duration: number | null;
  total_participants: number;
  metadata: {
    location?: string;
    location_data?: LocationData;
  };
  created_at: string;
  updated_at: string;
}

export interface ConferenceParticipant {
  id: string;
  conference_id: string;
  participant_type: 'user' | 'contact' | 'ai_agent' | 'emergency_service';
  contact_id: string | null;
  call_sid: string | null;
  phone_number: string | null;
  participant_name: string | null;
  joined_at: string | null;
  left_at: string | null;
  duration_seconds: number | null;
  status: 'calling' | 'ringing' | 'in_conference' | 'left' | 'failed';
  muted: boolean;
  hold: boolean;
  confirmation_message: string | null;
  eta_minutes: number | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  googleMapsLink: string;
}

export interface ConferenceStatus {
  conference: EmergencyConference;
  participants: ConferenceParticipant[];
  activeParticipants: number;
  userInConference: boolean;
  contactsInConference: number;
}
