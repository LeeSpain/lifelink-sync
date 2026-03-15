-- Set leewakeman@hotmail.co.uk as admin
-- Updates the profile role for this user

UPDATE public.profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users
  WHERE email = 'leewakeman@hotmail.co.uk'
  LIMIT 1
);

-- Also ensure they exist in subscribers as active
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier)
SELECT id, 'leewakeman@hotmail.co.uk', true, 'admin'
FROM auth.users
WHERE email = 'leewakeman@hotmail.co.uk'
ON CONFLICT (email) DO UPDATE
SET subscribed = true, subscription_tier = 'admin', updated_at = now();
