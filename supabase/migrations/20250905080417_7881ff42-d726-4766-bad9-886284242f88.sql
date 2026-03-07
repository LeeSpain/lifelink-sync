-- Create a profile for the current user if they don't have one
-- This will help with testing the admin functionality

-- First, let's check if there are any auth users without profiles
DO $$
DECLARE
    test_user_id uuid;
BEGIN
    -- Try to find the first auth user that doesn't have a profile
    SELECT id INTO test_user_id 
    FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL)
    LIMIT 1;
    
    -- If we found a user without a profile, create an admin profile for them
    IF test_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            user_id,
            role,
            first_name,
            last_name,
            created_at,
            updated_at
        ) VALUES (
            test_user_id,
            'admin',
            'Admin',
            'User',
            now(),
            now()
        );
        
        RAISE NOTICE 'Created admin profile for user: %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found without profiles';
    END IF;
END $$;