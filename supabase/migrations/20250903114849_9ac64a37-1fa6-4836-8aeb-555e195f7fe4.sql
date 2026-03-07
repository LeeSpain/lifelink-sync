-- ICE SOS Lite: Regional Call Centre Integration - Complete Database Schema

-- REGIONAL ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  locale_default TEXT DEFAULT 'es-ES',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Regional users can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_users ou 
  WHERE ou.organization_id = organizations.id 
  AND ou.user_id = auth.uid()
));

-- ORGANIZATION USERS
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

-- Enable RLS for organization_users
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all organization users"
ON public.organization_users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own organization membership"
ON public.organization_users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- CLIENTS TABLE UPDATES
DO $$ 
BEGIN
  -- Add organization_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
    ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
  END IF;
  
  -- Add preferred_language column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'es';
  END IF;
  
  -- Add subscription_regional column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_regional') THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_regional BOOLEAN DEFAULT false;
  END IF;
END $$;

-- REGIONAL EMERGENCY CONTACTS (separate from main emergency_contacts)
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

-- Enable RLS for regional_emergency_contacts
ALTER TABLE public.regional_emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own regional emergency contacts"
ON public.regional_emergency_contacts
FOR ALL
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Regional operators can view contacts for their org clients"
ON public.regional_emergency_contacts
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  JOIN public.organization_users ou ON ou.organization_id = p.organization_id
  WHERE p.user_id = regional_emergency_contacts.client_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
  AND p.subscription_regional = true
));

-- DEVICES
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

-- Enable RLS for regional_devices
ALTER TABLE public.regional_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
ON public.regional_devices
FOR ALL
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Regional operators can view devices for their org clients"
ON public.regional_devices
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  JOIN public.organization_users ou ON ou.organization_id = p.organization_id
  WHERE p.user_id = regional_devices.client_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
  AND p.subscription_regional = true
));

-- REGIONAL SOS EVENTS (separate from main sos_events)
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

-- Enable RLS for regional_sos_events
ALTER TABLE public.regional_sos_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SOS events"
ON public.regional_sos_events
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Regional operators can manage events for their org"
ON public.regional_sos_events
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_users ou
  WHERE ou.organization_id = regional_sos_events.organization_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.organization_users ou
  WHERE ou.organization_id = regional_sos_events.organization_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
));

CREATE POLICY "Admins can manage all SOS events"
ON public.regional_sos_events
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- SOS ACTIONS
CREATE TABLE public.sos_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.regional_sos_events(id) ON DELETE CASCADE,
  actor_user_id UUID,
  action_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for sos_actions
ALTER TABLE public.sos_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regional operators can manage actions for their events"
ON public.sos_actions
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.regional_sos_events rse
  JOIN public.organization_users ou ON ou.organization_id = rse.organization_id
  WHERE rse.id = sos_actions.event_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.regional_sos_events rse
  JOIN public.organization_users ou ON ou.organization_id = rse.organization_id
  WHERE rse.id = sos_actions.event_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
));

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

-- Enable RLS for family_notifications
ALTER TABLE public.family_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regional operators can insert family notifications"
ON public.family_notifications
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.regional_sos_events rse
  JOIN public.organization_users ou ON ou.organization_id = rse.organization_id
  WHERE rse.id = family_notifications.event_id
  AND ou.user_id = auth.uid()
  AND ou.role IN ('regional_operator', 'regional_supervisor')
));

CREATE POLICY "Family can read their notifications"
ON public.family_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

-- AUDIT LOG
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

-- Enable RLS for regional_audit_log
ALTER TABLE public.regional_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
ON public.regional_audit_log
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Regional supervisors can view their org audit logs"
ON public.regional_audit_log
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.organization_users ou
  WHERE ou.organization_id = regional_audit_log.organization_id
  AND ou.user_id = auth.uid()
  AND ou.role = 'regional_supervisor'
));

-- Create indexes for performance
CREATE INDEX idx_organization_users_user_id ON public.organization_users(user_id);
CREATE INDEX idx_organization_users_org_id ON public.organization_users(organization_id);
CREATE INDEX idx_regional_sos_events_client_id ON public.regional_sos_events(client_id);
CREATE INDEX idx_regional_sos_events_org_id ON public.regional_sos_events(organization_id);
CREATE INDEX idx_regional_sos_events_status ON public.regional_sos_events(status);
CREATE INDEX idx_family_notifications_client_id ON public.family_notifications(client_id);
CREATE INDEX idx_family_notifications_event_id ON public.family_notifications(event_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organization_users_updated_at BEFORE UPDATE ON public.organization_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regional_emergency_contacts_updated_at BEFORE UPDATE ON public.regional_emergency_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regional_devices_updated_at BEFORE UPDATE ON public.regional_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_regional_sos_events_updated_at BEFORE UPDATE ON public.regional_sos_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();