-- Create RLS policies for all regional tables

-- ORGANIZATIONS policies
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

-- ORGANIZATION_USERS policies
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

-- REGIONAL_EMERGENCY_CONTACTS policies
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

-- REGIONAL_DEVICES policies
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

-- REGIONAL_SOS_EVENTS policies
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

-- SOS_ACTIONS policies
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

-- FAMILY_NOTIFICATIONS policies
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

-- REGIONAL_AUDIT_LOG policies
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