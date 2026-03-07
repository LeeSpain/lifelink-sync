-- Create database migration to populate riven_settings table with default configuration

-- First, insert a default riven_settings record for the admin user (we'll use a function to get the admin user)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the first admin user
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If admin user exists, create default riven settings
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.riven_settings (
            user_id,
            ai_model,
            temperature,
            max_tokens,
            brand_voice,
            content_guidelines,
            auto_approve_content,
            preferred_posting_times,
            default_budget,
            created_at,
            updated_at
        ) VALUES (
            admin_user_id,
            'gpt-4.1-2025-04-14',
            0.7,
            2000,
            'professional and caring',
            'Create content that emphasizes family safety, emergency preparedness, and peace of mind. Focus on practical tips and real-world scenarios. Always maintain a caring, supportive tone while being informative and actionable.',
            false,
            '["09:00", "12:00", "17:00"]'::json,
            1000,
            now(),
            now()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            ai_model = EXCLUDED.ai_model,
            temperature = EXCLUDED.temperature,
            max_tokens = EXCLUDED.max_tokens,
            brand_voice = EXCLUDED.brand_voice,
            content_guidelines = EXCLUDED.content_guidelines,
            auto_approve_content = EXCLUDED.auto_approve_content,
            preferred_posting_times = EXCLUDED.preferred_posting_times,
            default_budget = EXCLUDED.default_budget,
            updated_at = now();
            
        RAISE NOTICE 'Riven settings created/updated for admin user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'No admin user found - riven_settings not populated';
    END IF;
END $$;