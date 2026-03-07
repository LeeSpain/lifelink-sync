-- Update user password directly
UPDATE auth.users 
SET 
  encrypted_password = crypt('Arsenal@2025', gen_salt('bf')),
  updated_at = now()
WHERE email = 'leewakeman@hotmail.co.uk';