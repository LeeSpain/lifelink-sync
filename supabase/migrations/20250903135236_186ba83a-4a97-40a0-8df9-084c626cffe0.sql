-- Create a trigger function to handle organization user profile setup
CREATE OR REPLACE FUNCTION public.handle_organization_user_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is an organization user invitation
  IF NEW.raw_user_meta_data->>'invited_as' = 'regional_user' THEN
    -- Create the profile record
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for organization users
DROP TRIGGER IF EXISTS on_organization_user_created ON auth.users;
CREATE TRIGGER on_organization_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_organization_user_auth();

-- Update the organization_users table to include proper join with profiles
CREATE OR REPLACE VIEW organization_users_with_profiles AS
SELECT 
  ou.*,
  o.name as organization_name,
  o.region as organization_region,
  p.first_name,
  p.last_name,
  p.email as profile_email
FROM organization_users ou
LEFT JOIN organizations o ON ou.organization_id = o.id
LEFT JOIN profiles p ON ou.user_id = p.id;