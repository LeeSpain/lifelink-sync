-- Riven rebrand: replace ICE SOS system prompt and content templates with LifeLink Sync

-- 1. Update riven_system_prompt
UPDATE public.site_content SET value = '{
  "role": "You are Riven, the AI marketing specialist for LifeLink Sync — an AI-powered emergency protection platform for individuals and families.",
  "company": "LifeLink Sync",
  "website": "lifelink-sync.com",
  "tagline": "Always There. Always Ready.",
  "brand_colour": "#ef4444",
  "markets": ["Spain", "UK", "Netherlands"],
  "emergency_numbers": {"spain": "112", "uk": "999", "eu": "112"},
  "pricing": {
    "individual_plan": "€9.99/month",
    "daily_wellbeing": "€2.99/month",
    "medication_reminder": "€2.99/month",
    "family_link": "€2.99/month per extra member",
    "clara_complete": "FREE when both wellness add-ons active",
    "free_trial": "7 days, no credit card required"
  },
  "core_features": [
    "CLARA AI: 24/7 AI safety companion",
    "App SOS Button: one-tap emergency trigger",
    "Bluetooth SOS Pendant: wearable, pairs with phone",
    "Voice Activation: CLARA, help me",
    "GPS Tracking: live location during emergencies",
    "Family Circle: instant alerts to connected family",
    "Conference Bridge: instant family call connection",
    "Medical Profile: emergency data for first responders",
    "Daily Wellbeing: CLARA daily check-in calls",
    "Medication Reminder: AI reminders, family notified if missed"
  ],
  "target_audiences": [
    {"segment": "adult_children", "age": "35-55", "message": "Your parents deserve independence AND safety"},
    {"segment": "active_seniors", "age": "65+", "message": "Stay independent, keep family peace of mind"},
    {"segment": "health_families", "message": "24/7 protection for the moments that matter most"},
    {"segment": "living_alone", "message": "You are never truly alone with LifeLink Sync"}
  ],
  "content_rules": [
    "NEVER use fear-based messaging or scare tactics",
    "NEVER show distressing emergency situations",
    "ALWAYS focus on empowerment, independence, peace of mind",
    "ALWAYS emphasise the free 7-day trial as the CTA",
    "Use warm, human, trustworthy tone",
    "Include relevant emojis but not excessively"
  ],
  "hashtags": ["#LifeLinkSync", "#FamilySafety", "#EmergencyProtection", "#CLARA", "#PeaceOfMind"],
  "disclaimers": [
    "LifeLink Sync does NOT replace emergency services (112/999)",
    "The SOS pendant requires a paired smartphone",
    "CLARA is AI, not a human operator"
  ]
}'
WHERE key = 'riven_system_prompt';

-- Insert if not exists
INSERT INTO public.site_content (key, value) VALUES (
  'riven_system_prompt',
  '{"role": "You are Riven, the AI marketing specialist for LifeLink Sync.", "company": "LifeLink Sync", "website": "lifelink-sync.com"}'
) ON CONFLICT (key) DO NOTHING;

-- 2. Update riven_content_templates — remove ICE SOS references
UPDATE public.site_content SET value = '{
  "campaign_templates": [
    {
      "id": "family_safety_series",
      "name": "Family Safety Education Series",
      "category": "Education",
      "description": "Weekly educational content about family emergency preparedness",
      "platforms": ["facebook", "instagram", "linkedin"],
      "sample_content": {
        "facebook_post": "Did you know that 32% of seniors live alone? LifeLink Sync gives families 24/7 peace of mind with CLARA AI, one-tap SOS, and instant family alerts.",
        "instagram_story": "Swipe for essential safety tips every family should know",
        "linkedin_article": "The Future of Family Emergency Protection: How AI is Keeping Families Connected"
      }
    },
    {
      "id": "seasonal_safety",
      "name": "Seasonal Safety Campaign",
      "category": "Seasonal",
      "description": "Timely safety content based on seasons and holidays",
      "platforms": ["facebook", "instagram", "twitter"],
      "sample_content": {
        "facebook_post": "Summer travel season is here! Keep your family connected and safe with LifeLink Sync. One tap is all it takes.",
        "instagram_story": "Summer safety checklist. Save this post for your next family trip!",
        "twitter_post": "Planning summer activities? Stay connected to help when you need it with LifeLink Sync. #SummerSafety #LifeLinkSync"
      }
    },
    {
      "id": "product_highlight",
      "name": "Product Feature Highlight",
      "category": "Product",
      "description": "Showcasing specific LifeLink Sync features and benefits",
      "platforms": ["facebook", "instagram", "linkedin"],
      "sample_content": {
        "facebook_post": "CLARA is always there. 24/7 AI-powered emergency coordination, wellbeing check-ins, and medication reminders. Your family deserves this peace of mind.",
        "instagram_post": "One tap. That is all it takes. LifeLink Sync SOS alerts your family instantly with your live GPS location.",
        "linkedin_post": "Employee safety is not just good business — it is essential. See how LifeLink Sync protects remote workers and travelling employees."
      }
    }
  ],
  "content_pillars": [
    {"pillar": "Family Connection", "description": "Content about staying connected with loved ones through LifeLink Sync"},
    {"pillar": "Emergency Preparedness", "description": "Educational content about being ready for emergencies"},
    {"pillar": "Technology Innovation", "description": "How CLARA AI and technology makes families safer"},
    {"pillar": "Independence & Dignity", "description": "Empowering seniors and individuals to live independently"},
    {"pillar": "Peace of Mind", "description": "The emotional benefit of knowing your family is protected"}
  ]
}'
WHERE key = 'riven_content_templates';

-- 3. Fix riven_settings model name — update any gpt-5 references (skip if column missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'riven_settings' AND column_name = 'ai_model'
  ) THEN
    UPDATE public.riven_settings SET ai_model = 'gpt-4o' WHERE ai_model LIKE 'gpt-5%';
  END IF;
END $$;

-- 4. Fix ai_model_settings — update any gpt-5 references (skip if column does not exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_model_settings' AND column_name = 'model_id'
  ) THEN
    UPDATE public.ai_model_settings SET model_id = 'gpt-4o' WHERE model_id LIKE 'gpt-5%';
  END IF;
END $$;

-- 5. Update ICE SOS training data to LifeLink Sync
UPDATE public.training_data SET
  answer = REPLACE(REPLACE(REPLACE(answer, 'ICE SOS Premium', 'LifeLink Sync'), 'ICE SOS Business', 'LifeLink Sync Business'), 'ICE SOS', 'LifeLink Sync')
WHERE answer LIKE '%ICE SOS%';
