-- Create missing profile for existing user
INSERT INTO public.profiles (user_id, role, profile_completion_percentage, created_at, updated_at)
VALUES ('eab6ab5a-9e1c-48ae-8f71-9a4cba8fbd15', 'user', 0, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Create a trigger to automatically create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, profile_completion_percentage, created_at, updated_at)
  VALUES (new.id, 'user', 0, now(), now());
  RETURN new;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();