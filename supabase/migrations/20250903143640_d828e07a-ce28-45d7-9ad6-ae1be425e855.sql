-- ICE SOS Lite Implementation - Phase 1: Database Foundation

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

-- 6. SOS acknowledgements by family members
CREATE TABLE IF NOT EXISTS sos_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE NOT NULL,
  family_user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  message TEXT
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

-- 8. Family/emergency notifications log
CREATE TABLE IF NOT EXISTS family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sos_events(id) ON DELETE CASCADE,
  client_id UUID,
  sent_by UUID,
  message TEXT,
  message_type TEXT DEFAULT 'quick_action',
  language TEXT DEFAULT 'es',
  delivered BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now()
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

-- 10. SOS actions timeline
CREATE TABLE IF NOT EXISTS sos_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID,
  actor_user_id UUID,
  action_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Regional emergency contacts for call centers
CREATE TABLE IF NOT EXISTS regional_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  name TEXT,
  phone TEXT,
  relation TEXT,
  priority INTEGER,
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

-- 15. Function to get user family group
CREATE OR REPLACE FUNCTION public.get_user_family_group_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT fg.id 
  FROM public.family_groups fg 
  WHERE fg.owner_user_id = auth.uid()
  LIMIT 1;
$$;

-- 16. Function to get user family membership group
CREATE OR REPLACE FUNCTION public.get_user_family_membership_group_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT fm.group_id 
  FROM public.family_memberships fm 
  WHERE fm.user_id = auth.uid() 
    AND fm.status = 'active'
  LIMIT 1;
$$;

-- 17. Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_users_updated_at BEFORE UPDATE ON organization_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_circle_permissions_updated_at BEFORE UPDATE ON circle_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sos_events_updated_at BEFORE UPDATE ON sos_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regional_sos_events_updated_at BEFORE UPDATE ON regional_sos_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regional_emergency_contacts_updated_at BEFORE UPDATE ON regional_emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();