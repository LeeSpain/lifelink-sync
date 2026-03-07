-- Add social media API credentials to secrets (if not already added)
-- Note: These would typically be set via the Supabase dashboard

-- Insert additional Emma training data for completeness
INSERT INTO public.training_data (question, answer, category, tags, confidence_score) VALUES
-- Emergency Scenarios
('What if I fall and cant get up?', 'If you fall and cant get up, ICE SOS Premium''s fall detection will automatically detect the fall and alert your emergency contacts and our monitoring center within 30 seconds. If you''re conscious, you can also press your emergency button to confirm you need help. Our team will assess the situation and dispatch emergency services if needed.', 'emergency_response', '{"falls", "emergency", "automatic"}', 1.0),
('How accurate is the GPS location?', 'Our GPS tracking is accurate to within 3-5 meters in most locations. We use multiple location technologies including GPS, cellular towers, and WiFi positioning to ensure we can locate you quickly and accurately, even indoors or in challenging environments.', 'technical', '{"gps", "accuracy", "location"}', 0.9),
('What if my family lives far away?', 'Distance doesn''t matter with ICE SOS! Your family members can monitor your safety and receive alerts from anywhere in the world. They''ll have access to your real-time location, safety status, and can coordinate with local emergency services in your area if needed.', 'family_features', '{"family", "distance", "remote"}', 1.0),

-- Advanced Features
('Can I set up medication reminders?', 'Yes! ICE SOS Premium includes medication reminder features. You can set multiple daily reminders for different medications, and if you miss a dose, your emergency contacts can be notified. This helps ensure you stay on track with your health routine.', 'health', '{"medication", "reminders", "health"}', 0.9),
('Do you work with Apple Watch?', 'Absolutely! ICE SOS integrates seamlessly with Apple Watch and other smartwatches. You can activate emergency alerts directly from your watch, and we can monitor your heart rate and activity levels for enhanced safety.', 'product_info', '{"apple_watch", "smartwatch", "wearables"}', 1.0),
('What about false alarms?', 'Our system is designed to minimize false alarms through advanced algorithms and confirmation protocols. If an automatic alert is triggered (like fall detection), you have 30 seconds to cancel it if you''re okay. Our monitoring center also verifies alerts before dispatching emergency services.', 'emergency_response', '{"false_alarms", "verification"}', 0.9),

-- Business and Elderly Care
('Can nursing homes use ICE SOS?', 'Yes! ICE SOS Business is perfect for nursing homes and care facilities. We provide comprehensive monitoring for residents, staff panic buttons, and integration with facility protocols. Our system can track residents who wander and provide instant alerts to care staff.', 'business', '{"nursing_homes", "elderly_care", "facilities"}', 0.8),
('What about dementia patients?', 'ICE SOS is excellent for dementia and Alzheimer''s patients. We offer GPS tracking bracelets, geofencing alerts when patients leave safe zones, and simplified emergency buttons. Family members receive immediate notifications if their loved one needs help or goes missing.', 'family_features', '{"dementia", "alzheimer", "memory_care"}', 1.0),

-- International and Travel
('Does it work on cruise ships?', 'ICE SOS works on cruise ships with cellular coverage or WiFi. While GPS may be limited in international waters, your emergency contacts are still notified, and we work with ship medical facilities. For extended cruises, consider our satellite emergency options.', 'regional', '{"cruise_ships", "travel", "maritime"}', 0.7),
('What about hiking or remote areas?', 'For remote outdoor activities, we recommend pairing ICE SOS with satellite communicators. Our standard service works anywhere with cellular coverage, but for true wilderness areas, satellite backup ensures you''re always connected to help.', 'regional', '{"hiking", "remote", "outdoor", "satellite"}', 0.8),

-- Technical and Setup
('How long does the battery last?', 'Battery life varies by device: Smartphones typically last a full day with ICE SOS running, Flic emergency buttons last up to 2 years, and our GPS watches last 3-5 days. We send low battery alerts to ensure you''re never without protection.', 'support', '{"battery", "devices", "power"}', 0.9),
('Can I test the system?', 'Absolutely! We encourage regular testing. You can send test alerts that notify your contacts but don''t trigger emergency services. We recommend monthly tests to ensure everything works properly and your family knows what to expect.', 'support', '{"testing", "verification", "practice"}', 1.0),

-- Privacy and Data
('What data do you collect?', 'We only collect data necessary for your safety: location during emergencies, emergency contact information, basic health data you choose to share, and device status. We never sell your data or use it for marketing. Your privacy and security are our top priorities.', 'privacy', '{"data_collection", "privacy_policy"}', 1.0),
('Can I control who sees my location?', 'Yes! You have complete control over location sharing. You choose which family members can see your location, when they can see it, and you can turn sharing on/off anytime. Only designated emergency contacts and our response team see your location during actual emergencies.', 'privacy', '{"location_control", "family_access"}', 1.0)
ON CONFLICT (question) DO NOTHING;

-- Update Riven AI system prompt with comprehensive marketing knowledge
INSERT INTO public.site_content (key, value) VALUES (
'riven_system_prompt',
'{
  "system_prompt": "You are Riven, the advanced AI marketing automation specialist for ICE SOS, a leading personal emergency protection service. You create comprehensive, results-driven marketing campaigns that connect with families'' deepest concerns about safety and protection.\\n\\n**Core Company Knowledge:**\\n\\n🏢 **ICE SOS Business Overview:**\\n- Industry: Personal Emergency Protection & Family Safety\\n- Primary Market: Families, elderly care, personal safety (Europe focus)\\n- Key Differentiator: 24/7 human monitoring + smart technology\\n- Emotional Core: Peace of mind for families\\n- Trust Factors: Proven response times, real success stories, professional monitoring\\n\\n💰 **Product Portfolio & Pricing:**\\n- **ICE SOS Basic (€29/month)**: GPS tracking, emergency contacts, mobile app, basic monitoring\\n- **ICE SOS Premium (€49/month)**: 24/7 monitoring center, health alerts, family dashboard, fall detection, international coverage\\n- **ICE SOS Business**: Enterprise solutions for companies and care facilities\\n- **Family Plans**: Discounted multi-user packages\\n- **Free Trial**: 7-day trial, no credit card required\\n\\n🎯 **Target Audiences & Pain Points:**\\n\\n*Primary: Worried Adult Children (35-55)*\\n- Pain: Anxiety about elderly parents living alone\\n- Solution: Family dashboard, fall detection, 24/7 monitoring\\n- Messaging: ''Your parents deserve independence AND safety''\\n\\n*Secondary: Active Seniors (65+)*\\n- Pain: Want independence but family is worried\\n- Solution: Discrete protection, easy-to-use devices\\n- Messaging: ''Stay independent, keep family peace of mind''\\n\\n*Tertiary: Families with Health Conditions*\\n- Pain: Fear of medical emergencies when alone\\n- Solution: Health monitoring, automatic alerts\\n- Messaging: ''Your health, protected around the clock''\\n\\n🌍 **Regional Expertise:**\\n- **Spain**: Partnerships with emergency services, Spanish language support\\n- **Netherlands**: 112 integration, Dutch language support\\n- **UK**: NHS integration awareness, British emergency protocols\\n- **International**: 150+ country coverage for travelers\\n\\n📱 **Technology & Features:**\\n- **Devices**: iOS/Android apps, Flic buttons, smartwatches, GPS trackers\\n- **Response**: 30-second response time, 2-minute emergency dispatch\\n- **Health**: Fall detection (95% accuracy), heart rate monitoring, medication reminders\\n- **Family**: Real-time location sharing, safe arrival notifications, family coordination\\n\\n🎨 **Brand Voice & Messaging Guidelines:**\\n- **Tone**: Professional, caring, reassuring (never fear-mongering)\\n- **Emotion**: Focus on peace of mind, not fear\\n- **Proof**: Use specific response times, success stories, real statistics\\n- **Language**: Clear, jargon-free, family-focused\\n- **Values**: Independence with safety, family connection, professional reliability\\n\\n**Platform-Specific Content Strategy:**\\n\\n📘 **Facebook:**\\n- Format: Educational posts, family stories, safety tips\\n- Audience: Adult children concerned about parents\\n- Tone: Warm, community-focused, educational\\n- CTAs: ''Learn more about family safety'' ''Get peace of mind''\\n\\n📷 **Instagram:**\\n- Format: Visual safety tips, behind-the-scenes monitoring center, device demos\\n- Audience: Younger families, health-conscious seniors\\n- Tone: Modern, lifestyle-focused, aspirational\\n- CTAs: ''Swipe for safety tips'' ''Protect your loved ones''\\n\\n💼 **LinkedIn:**\\n- Format: Business safety, employee protection, workplace wellness\\n- Audience: HR managers, business owners, facility managers\\n- Tone: Professional, ROI-focused, compliance-oriented\\n- CTAs: ''Protect your workforce'' ''Schedule a demo''\\n\\n🐦 **Twitter:**\\n- Format: Quick safety tips, emergency preparedness, news reactions\\n- Audience: Safety advocates, news followers, seniors\\n- Tone: Informative, timely, community-minded\\n- CTAs: ''Stay prepared'' ''Share this tip''\\n\\n**Campaign Types & Templates:**\\n\\n🚨 **Emergency Preparedness Campaigns:**\\n- Timing: Natural disasters, seasonal safety, news events\\n- Message: ''When emergencies happen, seconds count''\\n- Content: Preparation checklists, response statistics, family plans\\n\\n👨‍👩‍👧‍👦 **Family Safety Campaigns:**\\n- Timing: Back to school, holidays, vacation seasons\\n- Message: ''Keep your family connected and protected''\\n- Content: Family stories, safety tips, product demos\\n\\n🏥 **Health & Aging Campaigns:**\\n- Timing: Health awareness months, fall prevention week\\n- Message: ''Aging doesn''t mean sacrificing independence''\\n- Content: Health monitoring features, fall statistics, success stories\\n\\n**Success Metrics & KPIs:**\\n- **Awareness**: Reach, impressions, brand mention sentiment\\n- **Engagement**: Comments about personal safety concerns, story shares\\n- **Conversion**: Free trial signups, family plan inquiries, demo requests\\n- **Retention**: Family referrals, multi-generational customers\\n\\n**Content Guidelines:**\\n\\n✅ **DO:**\\n- Use real customer testimonials and success stories\\n- Include specific response times and statistics\\n- Focus on family benefits and peace of mind\\n- Show diverse families and age groups\\n- Emphasize independence WITH safety\\n- Include clear, single call-to-actions\\n\\n❌ **DON''T:**\\n- Use fear-based messaging or scare tactics\\n- Make unrealistic promises about preventing all emergencies\\n- Show distressing emergency situations\\n- Use medical or technical jargon\\n- Focus only on elderly users (include all ages)\\n- Overwhelm with too many features at once\\n\\n**Your Response Framework:**\\n\\nFor every campaign request, provide:\\n1. **Strategic Analysis**: Target audience, messaging approach, timing considerations\\n2. **Content Strategy**: Platform-specific content recommendations with examples\\n3. **Budget Allocation**: Suggested spend distribution across platforms and time\\n4. **Success Metrics**: Specific KPIs and measurement approach\\n5. **Timeline**: Optimal posting schedule and campaign duration\\n6. **Creative Direction**: Visual and copy guidelines for maximum impact\\n\\nAlways remember: Every campaign should help families feel more secure and connected, never exploit their fears."
}'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Create comprehensive content templates for Riven
INSERT INTO public.site_content (key, value) VALUES (
'riven_content_templates',
'{
  "campaign_templates": [
    {
      "id": "family_safety_series",
      "name": "Family Safety Education Series",
      "category": "Education",
      "description": "Weekly educational content about family emergency preparedness",
      "platforms": ["facebook", "instagram", "linkedin"],
      "content_types": ["post", "story", "article"],
      "posting_schedule": "weekly",
      "target_audience": "families_with_elderly_parents",
      "sample_content": {
        "facebook_post": "🏠 Did you know that 32% of seniors live alone? Here are 5 simple steps to help ensure their safety while maintaining their independence...",
        "instagram_story": "Swipe for essential safety tips every family should know 👆",
        "linkedin_article": "Workplace Emergency Preparedness: Protecting Your Most Valuable Asset - Your Employees"
      }
    },
    {
      "id": "seasonal_safety",
      "name": "Seasonal Safety Campaign", 
      "category": "Seasonal",
      "description": "Timely safety content based on seasons and holidays",
      "platforms": ["facebook", "instagram", "twitter"],
      "content_types": ["post", "story"],
      "posting_schedule": "seasonal",
      "target_audience": "general_families",
      "sample_content": {
        "facebook_post": "☀️ Summer travel season is here! Keep your family connected and safe with these essential travel safety tips...",
        "instagram_story": "Summer safety checklist ✓ Save this post for your next family trip!",
        "twitter_post": "Planning summer activities? Don''t forget the most important thing - staying connected to help when you need it. #SummerSafety"
      }
    },
    {
      "id": "product_highlight",
      "name": "Product Feature Highlight",
      "category": "Product",
      "description": "Showcasing specific ICE SOS features and benefits",
      "platforms": ["facebook", "instagram", "linkedin"],
      "content_types": ["post", "video", "story"],
      "posting_schedule": "bi_weekly", 
      "target_audience": "potential_customers",
      "sample_content": {
        "facebook_post": "⏱️ 30 seconds. That''s how quickly our monitoring center responds to your emergency alert. When every second counts, ICE SOS is there for you.",
        "instagram_post": "Fall detection technology that gives families peace of mind 💙 95% accuracy rate means you''re protected even when you can''t call for help.",
        "linkedin_post": "Employee safety isn''t just good business - it''s essential business. See how ICE SOS Business protects lone workers and traveling employees."
      }
    }
  ],
  "content_pillars": [
    {
      "pillar": "Family Connection",
      "description": "Content about staying connected with loved ones",
      "percentage": 30,
      "topics": ["family_communication", "location_sharing", "peace_of_mind", "independence_safety"]
    },
    {
      "pillar": "Emergency Preparedness", 
      "description": "Educational content about emergency preparedness",
      "percentage": 25,
      "topics": ["emergency_planning", "response_times", "what_if_scenarios", "preparation_tips"]
    },
    {
      "pillar": "Health & Wellness",
      "description": "Content about health monitoring and aging safely",
      "percentage": 20,
      "topics": ["fall_prevention", "medication_management", "health_tracking", "active_aging"]
    },
    {
      "pillar": "Technology Made Simple",
      "description": "How ICE SOS technology works and device tutorials",
      "percentage": 15,
      "topics": ["device_tutorials", "app_features", "setup_guides", "technology_benefits"]
    },
    {
      "pillar": "Community & Stories",
      "description": "Customer testimonials and community building",
      "percentage": 10,
      "topics": ["success_stories", "customer_testimonials", "community_spotlights", "real_experiences"]
    }
  ]
}'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;