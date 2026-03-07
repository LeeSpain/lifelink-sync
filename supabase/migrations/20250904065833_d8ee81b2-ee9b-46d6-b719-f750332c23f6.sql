
-- Phase 1: Security – Enable RLS and apply least-privilege policies

-- 1) connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Owners can manage their connections" ON public.connections;
DROP POLICY IF EXISTS "Connected users can view their connection details" ON public.connections;
DROP POLICY IF EXISTS "Admins can view all connections" ON public.connections;

-- Owners have full control over their rows
CREATE POLICY "Owners can manage their connections"
ON public.connections
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Connected/invited users can view the relationship (read-only)
CREATE POLICY "Connected users can view their connection details"
ON public.connections
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR contact_user_id = auth.uid()
  OR (invite_email IS NOT NULL AND invite_email = auth.email())
);

-- Admins may view all for support/audit
CREATE POLICY "Admins can view all connections"
ON public.connections
FOR SELECT
TO authenticated
USING (is_admin());


-- 2) circle_permissions
ALTER TABLE public.circle_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage circle permissions" ON public.circle_permissions;
DROP POLICY IF EXISTS "Family members can view their permissions" ON public.circle_permissions;

-- Owner manages permissions they grant
CREATE POLICY "Owners can manage circle permissions"
ON public.circle_permissions
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Family member (or owner) can view
CREATE POLICY "Family members can view their permissions"
ON public.circle_permissions
FOR SELECT
TO authenticated
USING (family_user_id = auth.uid() OR owner_id = auth.uid());


-- 3) sos_event_access (temporary access during SOS)
ALTER TABLE public.sos_event_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their event access" ON public.sos_event_access;
DROP POLICY IF EXISTS "System can manage event access" ON public.sos_event_access;
DROP POLICY IF EXISTS "Admins can manage event access" ON public.sos_event_access;

-- User can view their own granted access
CREATE POLICY "Users can view their event access"
ON public.sos_event_access
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Edge functions (service role) manage access (create/update/delete)
CREATE POLICY "System can manage event access"
ON public.sos_event_access
FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Admins can manage for support/audit
CREATE POLICY "Admins can manage event access"
ON public.sos_event_access
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 4) sos_locations (location timeline for SOS events)
ALTER TABLE public.sos_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their SOS locations" ON public.sos_locations;
DROP POLICY IF EXISTS "Family members can view SOS locations" ON public.sos_locations;
DROP POLICY IF EXISTS "Admins can manage all SOS locations" ON public.sos_locations;

-- Event owner manages locations
CREATE POLICY "Users can manage their SOS locations"
ON public.sos_locations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sos_events se
    WHERE se.id = sos_locations.event_id
      AND se.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sos_events se
    WHERE se.id = sos_locations.event_id
      AND se.user_id = auth.uid()
  )
);

-- Active family members can view the incident location timeline
CREATE POLICY "Family members can view SOS locations"
ON public.sos_locations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sos_events se
    JOIN public.family_memberships fm ON fm.group_id = se.group_id
    WHERE se.id = sos_locations.event_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'active'
  )
);

-- Admins manage for incident audits
CREATE POLICY "Admins can manage all SOS locations"
ON public.sos_locations
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());


-- 5) organizations (regional features)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Regional users can view their organization" ON public.organizations;

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
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = organizations.id
      AND ou.user_id = auth.uid()
  )
);


-- 6) organization_users (regional features)
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage organization users" ON public.organization_users;
DROP POLICY IF EXISTS "Users can view their own organization membership" ON public.organization_users;

CREATE POLICY "Admins can manage organization users"
ON public.organization_users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own organization membership"
ON public.organization_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
