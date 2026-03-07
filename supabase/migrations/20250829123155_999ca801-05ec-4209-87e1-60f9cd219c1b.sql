-- Allow client inserts for phone_verifications while keeping codes non-readable client-side
DROP POLICY IF EXISTS "Users can create own phone verifications" ON public.phone_verifications;
CREATE POLICY "Users can create own phone verifications"
ON public.phone_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);