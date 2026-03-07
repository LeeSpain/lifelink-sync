-- Phase 1: Family Access System Database Schema

-- Create emergency_contacts table (replaces emergency contacts in profiles)
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('call_only', 'family')),
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create family_groups table (one group per owner)
CREATE TABLE public.family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_seat_quota INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create family_memberships table (active seat = access)
CREATE TABLE public.family_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('owner', 'self')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'canceled')),
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Update existing family_invites table structure
ALTER TABLE public.family_invites DROP COLUMN IF EXISTS group_id;
ALTER TABLE public.family_invites DROP COLUMN IF EXISTS contact_id;
ALTER TABLE public.family_invites DROP COLUMN IF EXISTS billing_type;

ALTER TABLE public.family_invites 
ADD COLUMN group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
ADD COLUMN contact_id UUID REFERENCES emergency_contacts(id) ON DELETE SET NULL,
ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'owner' CHECK (billing_type IN ('owner', 'self')),
ADD COLUMN name TEXT,
ADD COLUMN phone TEXT;

-- Create SOS events table (enhanced version)
CREATE TABLE public.sos_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'canceled')),
  trigger_location JSONB,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create SOS locations table (real-time location tracking during active SOS)
CREATE TABLE public.sos_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create SOS acknowledgements table (family member acknowledgments)
CREATE TABLE public.sos_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  family_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ DEFAULT now(),
  message TEXT,
  UNIQUE (event_id, family_user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_acknowledgements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_contacts
CREATE POLICY "Users can manage their own emergency contacts" ON emergency_contacts
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all emergency contacts" ON emergency_contacts
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for family_groups
CREATE POLICY "Users can manage their own family groups" ON family_groups
FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Family members can view their group" ON family_groups
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM family_memberships fm 
    WHERE fm.group_id = family_groups.id 
    AND fm.user_id = auth.uid() 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Admins can manage all family groups" ON family_groups
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for family_memberships
CREATE POLICY "Group owners can manage memberships" ON family_memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM family_groups fg 
    WHERE fg.id = family_memberships.group_id 
    AND fg.owner_user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_groups fg 
    WHERE fg.id = family_memberships.group_id 
    AND fg.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own memberships" ON family_memberships
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships" ON family_memberships
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for sos_events
CREATE POLICY "Users can manage their own SOS events" ON sos_events
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family members can view SOS events for their groups" ON sos_events
FOR SELECT USING (
  group_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM family_memberships fm 
    WHERE fm.group_id = sos_events.group_id 
    AND fm.user_id = auth.uid() 
    AND fm.status = 'active'
  )
);

CREATE POLICY "Admins can manage all SOS events" ON sos_events
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for sos_locations (PRIVACY: only during active SOS)
CREATE POLICY "Users can manage their own SOS locations" ON sos_locations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM sos_events se 
    WHERE se.id = sos_locations.event_id 
    AND se.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM sos_events se 
    WHERE se.id = sos_locations.event_id 
    AND se.user_id = auth.uid()
  )
);

CREATE POLICY "Family can read live locations only during active SOS" ON sos_locations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sos_events se
    JOIN family_memberships fm ON fm.group_id = se.group_id
    WHERE se.id = sos_locations.event_id
    AND fm.user_id = auth.uid()
    AND se.status = 'active'
    AND fm.status = 'active'
  )
);

CREATE POLICY "Admins can manage all SOS locations" ON sos_locations
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for sos_acknowledgements
CREATE POLICY "Users can manage acknowledgements for their events" ON sos_acknowledgements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM sos_events se 
    WHERE se.id = sos_acknowledgements.event_id 
    AND se.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM sos_events se 
    WHERE se.id = sos_acknowledgements.event_id 
    AND se.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can acknowledge SOS events" ON sos_acknowledgements
FOR INSERT WITH CHECK (
  auth.uid() = family_user_id AND EXISTS (
    SELECT 1 FROM sos_events se
    JOIN family_memberships fm ON fm.group_id = se.group_id
    WHERE se.id = sos_acknowledgements.event_id
    AND fm.user_id = auth.uid()
    AND se.status = 'active'
    AND fm.status = 'active'
  )
);

CREATE POLICY "Family members can view acknowledgements" ON sos_acknowledgements
FOR SELECT USING (
  auth.uid() = family_user_id OR EXISTS (
    SELECT 1 FROM sos_events se
    JOIN family_memberships fm ON fm.group_id = se.group_id
    WHERE se.id = sos_acknowledgements.event_id
    AND (fm.user_id = auth.uid() OR se.user_id = auth.uid())
    AND fm.status = 'active'
  )
);

CREATE POLICY "Admins can manage all acknowledgements" ON sos_acknowledgements
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_groups_updated_at
  BEFORE UPDATE ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_memberships_updated_at
  BEFORE UPDATE ON family_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint to limit emergency contacts per user (5 max)
CREATE OR REPLACE FUNCTION check_contact_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM emergency_contacts 
    WHERE user_id = NEW.user_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 emergency contacts allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER limit_emergency_contacts
  BEFORE INSERT ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_contact_limit();

-- Add constraint to ensure family type contacts have matching membership
CREATE OR REPLACE FUNCTION validate_family_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'family' THEN
    -- For now, we'll just ensure the contact exists
    -- The actual family membership validation will be handled in the application
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_family_contact_trigger
  BEFORE INSERT OR UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION validate_family_contact();