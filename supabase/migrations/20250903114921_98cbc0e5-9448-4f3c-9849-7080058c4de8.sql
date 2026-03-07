-- ICE SOS Lite: Regional Call Centre Integration - Fixed Database Schema

-- REGIONAL ORGANIZATIONS (create first)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  locale_default TEXT DEFAULT 'es-ES',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ORGANIZATION USERS (create after organizations)
CREATE TABLE public.organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('regional_operator','regional_supervisor','platform_admin')) NOT NULL,
  language TEXT DEFAULT 'es',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- UPDATE PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_regional BOOLEAN DEFAULT false;

-- REGIONAL EMERGENCY CONTACTS
CREATE TABLE public.regional_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  priority INTEGER,
  name TEXT,
  relation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- REGIONAL DEVICES
CREATE TABLE public.regional_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type TEXT,
  device_name TEXT,
  last_ping_at TIMESTAMPTZ,
  battery_level INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- REGIONAL SOS EVENTS
CREATE TABLE public.regional_sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  triggered_at TIMESTAMPTZ DEFAULT now(),
  source TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  emergency_type TEXT,
  status TEXT CHECK (status IN ('open','acknowledged','closed')) DEFAULT 'open',
  assigned_operator UUID,
  priority TEXT CHECK (priority IN ('low','medium','high','critical')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SOS ACTIONS
CREATE TABLE public.sos_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.regional_sos_events(id) ON DELETE CASCADE,
  actor_user_id UUID,
  action_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FAMILY NOTIFICATIONS
CREATE TABLE public.family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.regional_sos_events(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  message_type TEXT DEFAULT 'quick_action',
  sent_by UUID,
  delivered BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'es',
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- REGIONAL AUDIT LOG
CREATE TABLE public.regional_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  organization_id UUID REFERENCES public.organizations(id),
  action TEXT,
  target_table TEXT,
  target_id UUID,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX idx_organization_users_org_id ON public.organization_users(organization_id);
CREATE INDEX idx_regional_sos_events_client_id ON public.regional_sos_events(client_id);
CREATE INDEX idx_regional_sos_events_org_id ON public.regional_sos_events(organization_id);
CREATE INDEX idx_regional_sos_events_status ON public.regional_sos_events(status);
CREATE INDEX idx_family_notifications_client_id ON public.family_notifications(client_id);
CREATE INDEX idx_family_notifications_event_id ON public.family_notifications(event_id);