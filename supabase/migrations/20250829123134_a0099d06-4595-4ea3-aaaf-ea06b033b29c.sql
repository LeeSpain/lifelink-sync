-- Allow client inserts for phone_verifications while keeping codes non-readable client-side
CREATE POLICY IF NOT EXISTS "Users can create own phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure no client SELECT is possible (service role only already exists)