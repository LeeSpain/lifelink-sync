-- Simple insertion of default Riven settings for admin users
INSERT INTO public.riven_settings (
    user_id,
    ai_model,
    temperature,
    max_tokens,
    brand_voice,
    content_guidelines,
    auto_approve_content,
    preferred_posting_times,
    default_budget
) 
SELECT 
    p.user_id,
    'gpt-4.1-2025-04-14',
    0.7,
    2000,
    'professional and caring',
    'Create content that emphasizes family safety, emergency preparedness, and peace of mind. Focus on practical tips and real-world scenarios. Always maintain a caring, supportive tone while being informative and actionable.',
    false,
    '["09:00", "12:00", "17:00"]'::json,
    1000
FROM public.profiles p
WHERE p.role = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM public.riven_settings rs 
    WHERE rs.user_id = p.user_id
);