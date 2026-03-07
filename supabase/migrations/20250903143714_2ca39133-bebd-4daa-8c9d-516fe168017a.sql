-- Fix security issues: Enable RLS on all new tables

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_event_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_sos_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Admins can manage all organizations"
ON organizations FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Regional users can view their organization"
ON organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.organization_id = organizations.id
    AND ou.user_id = auth.uid()
  )
);

-- RLS Policies for organization_users
CREATE POLICY "Admins can manage organization users"
ON organization_users FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own organization membership"
ON organization_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for connections
CREATE POLICY "Owners can manage their connections"
ON connections FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Connected users can view their connection details"
ON connections FOR SELECT
TO authenticated
USING (contact_user_id = auth.uid() OR owner_id = auth.uid());

CREATE POLICY "Admins can view all connections"
ON connections FOR SELECT
TO authenticated
USING (is_admin());

-- RLS Policies for circle_permissions
CREATE POLICY "Owners can manage circle permissions"
ON circle_permissions FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Family members can view their permissions"
ON circle_permissions FOR SELECT
TO authenticated
USING (family_user_id = auth.uid() OR owner_id = auth.uid());

-- RLS Policies for sos_locations
CREATE POLICY "Users can manage their SOS locations"
ON sos_locations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sos_events se
    WHERE se.id = sos_locations.event_id
    AND se.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sos_events se
    WHERE se.id = sos_locations.event_id
    AND se.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can view SOS locations"
ON sos_locations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sos_events se
    JOIN family_memberships fm ON fm.group_id = se.group_id
    WHERE se.id = sos_locations.event_id
    AND fm.user_id = auth.uid()
    AND fm.status = 'active'
  )
);

CREATE POLICY "Admins can manage all SOS locations"
ON sos_locations FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for sos_event_access
CREATE POLICY "Users can view their event access"
ON sos_event_access FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can manage event access"
ON sos_event_access FOR ALL
TO authenticated
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can manage event access"
ON sos_event_access FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- RLS Policies for regional_sos_events
CREATE POLICY "Users can view their own SOS events"
ON regional_sos_events FOR SELECT
TO authenticated
USING (client_id = auth.uid());

CREATE POLICY "Regional operators can manage events for their org"
ON regional_sos_events FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.organization_id = regional_sos_events.organization_id
    AND ou.user_id = auth.uid()
    AND ou.role IN ('regional_operator', 'regional_supervisor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.organization_id = regional_sos_events.organization_id
    AND ou.user_id = auth.uid()
    AND ou.role IN ('regional_operator', 'regional_supervisor')
  )
);

CREATE POLICY "Admins can manage all SOS events"
ON regional_sos_events FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());