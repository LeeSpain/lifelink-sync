-- ICE SOS Lite - Phase 1B: RLS Policies

-- Enable RLS on all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_event_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Admins can manage all organizations" ON organizations
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Regional users can view their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_users ou
      WHERE ou.organization_id = organizations.id
        AND ou.user_id = auth.uid()
    )
  );

-- Organization users policies
CREATE POLICY "Admins can manage organization users" ON organization_users
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Organization users can view colleagues" ON organization_users
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Connections policies
CREATE POLICY "Owners can manage their connections" ON connections
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Contacts can view their connection" ON connections
  FOR SELECT USING (contact_user_id = auth.uid());

CREATE POLICY "Admins can view all connections" ON connections
  FOR SELECT USING (is_admin());

-- Circle permissions policies
CREATE POLICY "Owners can manage circle permissions" ON circle_permissions
  FOR ALL USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Family members can view their permissions" ON circle_permissions
  FOR SELECT USING (family_user_id = auth.uid());

-- SOS events policies
CREATE POLICY "Users can manage their own SOS events" ON sos_events
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Family members can view group SOS events" ON sos_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_memberships fm
      WHERE fm.group_id = sos_events.group_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

CREATE POLICY "Trusted contacts can view active events" ON sos_events
  FOR SELECT USING (
    status = 'active' AND EXISTS (
      SELECT 1 FROM sos_event_access sea
      WHERE sea.event_id = sos_events.id
        AND sea.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all SOS events" ON sos_events
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- SOS locations policies
CREATE POLICY "Users can view locations for their events" ON sos_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sos_events se
      WHERE se.id = sos_locations.event_id
        AND se.user_id = auth.uid()
    )
  );

CREATE POLICY "Family can view locations for group events" ON sos_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sos_events se
      JOIN family_memberships fm ON fm.group_id = se.group_id
      WHERE se.id = sos_locations.event_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

CREATE POLICY "System can insert locations" ON sos_locations
  FOR INSERT WITH CHECK (true);

-- SOS acknowledgements policies
CREATE POLICY "Family members can acknowledge SOS events" ON sos_acknowledgements
  FOR INSERT WITH CHECK (
    auth.uid() = family_user_id AND
    EXISTS (
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
    auth.uid() = family_user_id OR
    EXISTS (
      SELECT 1 FROM sos_events se
      JOIN family_memberships fm ON fm.group_id = se.group_id
      WHERE se.id = sos_acknowledgements.event_id
        AND (fm.user_id = auth.uid() OR se.user_id = auth.uid())
        AND fm.status = 'active'
    )
  );

CREATE POLICY "Users can manage acknowledgements for their events" ON sos_acknowledgements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sos_events se
      WHERE se.id = sos_acknowledgements.event_id
        AND se.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sos_events se
      WHERE se.id = sos_acknowledgements.event_id
        AND se.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all acknowledgements" ON sos_acknowledgements
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- SOS event access policies
CREATE POLICY "System can manage event access" ON sos_event_access
  FOR ALL WITH CHECK (true);

-- Family notifications policies
CREATE POLICY "Family can read their notifications" ON family_notifications
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Regional operators can insert family notifications" ON family_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM regional_sos_events rse
      JOIN organization_users ou ON ou.organization_id = rse.organization_id
      WHERE rse.id = family_notifications.event_id
        AND ou.user_id = auth.uid()
        AND ou.role IN ('regional_operator', 'regional_supervisor')
    )
  );

-- Regional SOS events policies
CREATE POLICY "Regional operators can manage events for their org" ON regional_sos_events
  FOR ALL USING (
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

CREATE POLICY "Users can view their own SOS events" ON regional_sos_events
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Admins can manage all SOS events" ON regional_sos_events
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

-- SOS actions policies
CREATE POLICY "Regional operators can manage actions for their events" ON sos_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM regional_sos_events rse
      JOIN organization_users ou ON ou.organization_id = rse.organization_id
      WHERE rse.id = sos_actions.event_id
        AND ou.user_id = auth.uid()
        AND ou.role IN ('regional_operator', 'regional_supervisor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regional_sos_events rse
      JOIN organization_users ou ON ou.organization_id = rse.organization_id
      WHERE rse.id = sos_actions.event_id
        AND ou.user_id = auth.uid()
        AND ou.role IN ('regional_operator', 'regional_supervisor')
    )
  );

-- Regional emergency contacts policies
CREATE POLICY "Users can manage their own regional emergency contacts" ON regional_emergency_contacts
  FOR ALL USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Regional operators can view contacts for their org clients" ON regional_emergency_contacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN organization_users ou ON ou.organization_id = p.organization_id
      WHERE p.user_id = regional_emergency_contacts.client_id
        AND ou.user_id = auth.uid()
        AND ou.role IN ('regional_operator', 'regional_supervisor')
        AND p.subscription_regional = true
    )
  );