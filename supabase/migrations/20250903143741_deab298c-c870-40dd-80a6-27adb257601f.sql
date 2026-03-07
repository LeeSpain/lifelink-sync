-- ICE SOS Lite Implementation - Phase 1: Database Foundation (Fixed)

-- 1. Regional organizations & staff
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  locale_default TEXT DEFAULT 'es-ES',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT CHECK (role IN ('regional_operator','regional_supervisor','platform_admin')) NOT NULL,
  language TEXT DEFAULT 'es',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Family circle & trusted contacts (unified connections table)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  contact_user_id UUID,
  invite_email TEXT,
  type TEXT CHECK (type IN ('family_circle','trusted_contact')) NOT NULL,
  relationship TEXT,
  escalation_priority INTEGER DEFAULT 3,
  notify_channels JSONB DEFAULT '["app"]'::jsonb,
  preferred_language TEXT DEFAULT 'en',
  status TEXT CHECK (status IN ('pending','active','revoked')) DEFAULT 'pending',
  invite_token TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Fine-grain permissions for family members
CREATE TABLE IF NOT EXISTS circle_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  family_user_id UUID NOT NULL,
  can_view_history BOOLEAN DEFAULT true,
  can_view_devices BOOLEAN DEFAULT true,
  can_view_location BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, family_user_id)
);

-- 4. Enhanced SOS events system
CREATE TABLE IF NOT EXISTS sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  source TEXT DEFAULT 'app',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  address TEXT,
  emergency_type TEXT,
  status TEXT CHECK (status IN ('active','closed','cancelled')) DEFAULT 'active',
  severity TEXT DEFAULT 'medium',
  additional_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SOS locations tracking
CREATE TABLE IF NOT EXISTS sos_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT,
  accuracy FLOAT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Temporary access for trusted contacts during active events
CREATE TABLE IF NOT EXISTS sos_event_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  access_scope TEXT DEFAULT 'live_only',
  granted_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- 9. Regional SOS events for call centers
CREATE TABLE IF NOT EXISTS regional_sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  organization_id UUID REFERENCES organizations(id),
  source TEXT,
  emergency_type TEXT,
  status TEXT CHECK (status IN ('open','acknowledged','closed')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low','medium','high','critical')) DEFAULT 'medium',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  assigned_operator UUID,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Update profiles table for regional integration
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ES',
  ADD COLUMN IF NOT EXISTS subscription_regional BOOLEAN DEFAULT false;

-- 13. Helper view for active connection counts
CREATE OR REPLACE VIEW v_owner_active_connection_counts AS
SELECT 
  owner_id, 
  COUNT(*)::INTEGER AS active_count
FROM connections
WHERE status = 'active'
GROUP BY owner_id;

-- 14. Spain rule enforcement function
CREATE OR REPLACE FUNCTION public.check_spain_rule(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_country TEXT;
  active_connections INTEGER;
  has_regional BOOLEAN;
BEGIN
  -- Get user's country and regional subscription
  SELECT 
    COALESCE(country_code, 'ES'),
    COALESCE(subscription_regional, false)
  INTO user_country, has_regional
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- If not in Spain, rule doesn't apply
  IF user_country != 'ES' THEN
    RETURN true;
  END IF;
  
  -- If has regional subscription, always allowed
  IF has_regional THEN
    RETURN true;
  END IF;
  
  -- Check active connections count
  SELECT COALESCE(active_count, 0)
  INTO active_connections
  FROM public.v_owner_active_connection_counts
  WHERE owner_id = p_user_id;
  
  -- Must have at least 1 active connection
  RETURN active_connections >= 1;
END;
$$;