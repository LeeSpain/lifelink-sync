-- Fix remaining security warnings

-- 1. Move extensions out of public schema to extensions schema
-- Check and move cube extension if it exists in public
DO $$
BEGIN
  -- Move cube extension to extensions schema if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'cube' AND n.nspname = 'public'
  ) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    -- Move the extension
    ALTER EXTENSION cube SET SCHEMA extensions;
  END IF;
  
  -- Move earthdistance extension to extensions schema if it exists in public
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'earthdistance' AND n.nspname = 'public'
  ) THEN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    -- Move the extension
    ALTER EXTENSION earthdistance SET SCHEMA extensions;
  END IF;
END $$;

-- 2. Configure more secure OTP settings
-- Note: These are auth configuration settings that may need to be set via Supabase dashboard
-- We'll document the recommended settings here as comments for the user to apply manually:

/* 
IMPORTANT: The following auth settings should be configured in your Supabase dashboard:
1. Navigate to Authentication > Settings > Auth
2. Set OTP expiry to 600 seconds (10 minutes) or less
3. Enable leaked password protection
4. Consider enabling additional security features like:
   - Password strength requirements
   - Rate limiting
   - Email confirmation requirements
*/