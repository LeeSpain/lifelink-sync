-- Create a test admin user with predefined credentials
-- First, check if the admin test user doesn't already exist
DO $$
DECLARE
    test_admin_exists boolean := false;
BEGIN
    -- Check if test admin profile exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE role = 'admin' 
        AND first_name = 'Test' 
        AND last_name = 'Admin'
    ) INTO test_admin_exists;

    -- Only proceed if no test admin exists
    IF NOT test_admin_exists THEN
        -- Insert test admin profile that will be linked to auth user when they sign up
        -- We'll use a special marker to identify this as the test admin account
        INSERT INTO public.profiles (
            id,
            user_id,
            first_name,
            last_name,
            phone,
            role,
            emergency_contacts,
            medical_conditions,
            allergies,
            medications,
            profile_completion_percentage,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            gen_random_uuid(), -- Temporary UUID, will be updated when user signs up
            'Test',
            'Admin', 
            '+1234567890',
            'admin',
            '[]'::jsonb,
            '[]'::text[],
            '[]'::text[],
            '[]'::text[],
            100,
            now(),
            now()
        );

        -- Add activity log for the test admin creation
        INSERT INTO public.user_activity (
            user_id,
            activity_type,
            description,
            metadata
        ) VALUES (
            (SELECT user_id FROM public.profiles WHERE first_name = 'Test' AND last_name = 'Admin' LIMIT 1),
            'test_admin_created',
            'Test admin account created for development',
            jsonb_build_object(
                'email', 'admin@icesoslite.com',
                'created_by_system', true,
                'timestamp', now()
            )
        );
    END IF;
END $$;