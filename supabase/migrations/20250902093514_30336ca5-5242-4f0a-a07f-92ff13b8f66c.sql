-- Phase 1 Security Fix: Restrict subscribers INSERT to the authenticated user only
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "insert_own_subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (
  auth.uid() = user_id OR auth.email() = email
);
