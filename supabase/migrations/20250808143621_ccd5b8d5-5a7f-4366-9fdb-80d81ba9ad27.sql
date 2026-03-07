-- Harden RLS policies and restrict admin-only access where appropriate

-- Subscribers: restrict updates to own rows
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id OR auth.email() = email)
WITH CHECK (auth.uid() = user_id OR auth.email() = email);

-- Leads: replace permissive policy with admin-only
DROP POLICY IF EXISTS "System can manage leads" ON public.leads;
CREATE POLICY "Admins can manage leads"
ON public.leads
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Gmail tokens: drop permissive system policy
DROP POLICY IF EXISTS "System can manage gmail tokens" ON public.gmail_tokens;

-- Campaign recipients: drop permissive system policy
DROP POLICY IF EXISTS "System can manage campaign recipients" ON public.campaign_recipients;

-- Email queue: drop permissive system policy
DROP POLICY IF EXISTS "System can manage email queue" ON public.email_queue;

-- Communication preferences: drop permissive system policy (users already have self-managed policy)
DROP POLICY IF EXISTS "System can manage communication preferences" ON public.communication_preferences;

-- Orders: drop permissive system policy (users already have scoped policies; service role bypasses RLS)
DROP POLICY IF EXISTS "System can manage orders" ON public.orders;

-- Phone verifications: drop permissive system policy (users have scoped policy)
DROP POLICY IF EXISTS "System can manage phone verifications" ON public.phone_verifications;

-- WhatsApp tables: drop permissive system policies
DROP POLICY IF EXISTS "System can manage whatsapp accounts" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "System can manage whatsapp conversations" ON public.whatsapp_conversations;

-- Email logs: drop permissive system policies (keep admin SELECT)
DROP POLICY IF EXISTS "System can manage email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can update email logs" ON public.email_logs;

-- Communication analytics: drop permissive insert policy (admin SELECT remains; inserts should occur via service role which bypasses RLS)
DROP POLICY IF EXISTS "System can insert analytics" ON public.communication_analytics;