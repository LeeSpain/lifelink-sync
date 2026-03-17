-- ============================================================
-- CLARA GOD MODE — Build 3: Hot Lead Trigger
-- When interest_level hits 7+, instantly notify Lee via WhatsApp
-- ============================================================

CREATE OR REPLACE FUNCTION public.notify_hot_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payload JSONB;
  v_memory  RECORD;
BEGIN
  -- Only fire when interest_level crosses 7 for the first time
  IF NEW.interest_level >= 7
    AND (OLD.interest_level IS NULL OR OLD.interest_level < 7)
  THEN
    -- Get memory context for this lead
    SELECT * INTO v_memory
    FROM public.clara_contact_memory
    WHERE session_id = NEW.session_id
    LIMIT 1;

    -- Build payload for escalation function
    v_payload := jsonb_build_object(
      'type',                 'hot_lead',
      'lead_id',              NEW.id,
      'session_id',           NEW.session_id,
      'contact_name',         COALESCE(v_memory.first_name, 'Unknown'),
      'contact_email',        COALESCE(NEW.email, v_memory.contact_email, 'not provided'),
      'contact_phone',        COALESCE(NEW.phone, v_memory.contact_phone, 'not provided'),
      'interest_score',       NEW.interest_level,
      'protecting',           COALESCE(v_memory.protecting, 'not stated'),
      'protecting_detail',    COALESCE(v_memory.protecting_detail, ''),
      'last_message',         COALESCE(NEW.metadata->>'first_message', 'not captured'),
      'clara_recommendation', 'This lead is hot — contact within the hour'
    );

    -- Fire the escalation via pg_net HTTP call
    PERFORM net.http_post(
      url     := (SELECT setting_value::text
                  FROM public.ai_model_settings
                  WHERE setting_key = 'supabase_functions_url'
                  LIMIT 1)
                  || '/clara-escalation',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (
          SELECT setting_value::text
          FROM public.ai_model_settings
          WHERE setting_key = 'supabase_anon_key'
          LIMIT 1
        )
      ),
      body    := v_payload
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists then recreate
DROP TRIGGER IF EXISTS hot_lead_whatsapp_trigger ON public.leads;

CREATE TRIGGER hot_lead_whatsapp_trigger
AFTER INSERT OR UPDATE OF interest_level
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_hot_lead();

-- Insert the config values needed by the trigger
INSERT INTO public.ai_model_settings (setting_key, setting_value, description)
VALUES
(
  'supabase_functions_url',
  'https://cprbgquiqbyoyrffznny.supabase.co/functions/v1',
  'Base URL for Supabase edge functions — used by DB triggers'
),
(
  'supabase_anon_key',
  'sb_publishable_wyjo5Wsjre-vUzLEH02y4A_Rnao0LGD',
  'Anon key for edge function calls from DB triggers'
)
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      updated_at    = now();
