-- Add audience column to training_data table for content filtering
ALTER TABLE public.training_data 
ADD COLUMN audience TEXT DEFAULT 'customer' CHECK (audience IN ('customer', 'internal', 'admin'));

-- Add tags column for better categorization  
ALTER TABLE public.training_data 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add index for performance
CREATE INDEX idx_training_data_audience ON public.training_data(audience);
CREATE INDEX idx_training_data_status_audience ON public.training_data(status, audience);

-- Update existing training data to be customer-facing by default
UPDATE public.training_data SET audience = 'customer' WHERE audience IS NULL;

-- Add comprehensive customer-focused training data
INSERT INTO public.training_data (question, answer, category, status, audience, tags) VALUES 

-- Pricing and Plans
('What are your pricing plans?', 'We offer two affordable plans: **Member Plan** at €9.99/month with full emergency features and device support, and **Family Access** at €2.99/month for family members to stay connected. Both include 24/7 emergency monitoring, GPS tracking, and our advanced AI assistant Emma.', 'pricing', 'active', 'customer', '{"pricing", "plans", "membership"}'),

('How much does the service cost?', 'Our service starts at just €2.99/month for Family Access, which lets family members stay connected and receive alerts. For full emergency protection, our Member Plan is €9.99/month and includes all emergency features, device support, and 24/7 monitoring.', 'pricing', 'active', 'customer', '{"pricing", "cost"}'),

('What is included in the Member Plan?', 'The Member Plan (€9.99/month) includes: 24/7 emergency monitoring, GPS location tracking, SOS emergency alerts, family notifications, device connectivity (Bluetooth pendant, smartwatch), unlimited emergency contacts, and priority support. Perfect for complete peace of mind.', 'plans', 'active', 'customer', '{"member-plan", "features"}'),

('What is Family Access?', 'Family Access (€2.99/month) allows family members to receive emergency alerts, view location updates (when shared), and stay connected with their loved ones. It''s designed for family members who want to stay informed but don''t need the full emergency monitoring features.', 'plans', 'active', 'customer', '{"family-access", "family"}'),

-- Emergency Features
('How does the SOS emergency system work?', 'Our SOS system instantly alerts your emergency contacts via SMS, email, and automated phone calls when triggered. It shares your exact GPS location and continues trying to reach contacts until someone responds. Available through our app, Bluetooth pendant, or compatible smartwatch.', 'emergency', 'active', 'customer', '{"sos", "emergency", "alerts"}'),

('What happens when I press the SOS button?', 'When you press SOS: 1) Your exact location is captured via GPS, 2) Emergency contacts receive immediate SMS and email alerts, 3) Automated phone calls begin to your contacts, 4) Our system keeps trying until someone acknowledges, 5) Family members get real-time updates. Response typically starts within 30 seconds.', 'emergency', 'active', 'customer', '{"sos", "emergency-response"}'),

('Can my family track my location?', 'Location sharing is completely privacy-first and under your control. You choose when and with whom to share your location. During emergencies, location is automatically shared with your designated emergency contacts to ensure quick help. Regular location sharing requires your explicit permission.', 'privacy', 'active', 'customer', '{"location", "privacy", "tracking"}'),

-- Family Features
('How do I set up family sharing?', 'Setting up family sharing is easy: 1) Create your Member account, 2) Invite family members via email, 3) They sign up for Family Access (€2.99/month), 4) Configure what information you want to share, 5) Set up emergency contacts and preferences. Each family member controls their own privacy settings.', 'family', 'active', 'customer', '{"family-sharing", "setup"}'),

('Can family members see my location all the time?', 'No, location sharing is privacy-first. Family members only see your location when: 1) You explicitly share it, 2) During an emergency (SOS), or 3) If you''ve enabled scheduled check-ins. You have complete control over your privacy and can change sharing settings anytime.', 'privacy', 'active', 'customer', '{"family", "privacy", "location"}'),

-- Hardware and Devices
('What devices do you support?', 'We support a wide range of devices including: Bluetooth emergency pendant (recommended), Apple Watch, Samsung smartwatches, fitness trackers with SOS features, and smartphones. Our Bluetooth pendant offers the longest battery life (up to 6 months) and is waterproof.', 'devices', 'active', 'customer', '{"hardware", "devices", "pendant"}'),

('Tell me about the Bluetooth pendant', 'Our Bluetooth pendant is a discreet, waterproof emergency device with up to 6 months battery life. It connects to your smartphone and provides instant SOS activation. Features include: one-button emergency alert, LED status indicator, lightweight design, and works anywhere your phone has signal.', 'devices', 'active', 'customer', '{"pendant", "bluetooth", "hardware"}'),

('How long does the pendant battery last?', 'The Bluetooth pendant battery lasts up to 6 months with normal use. You''ll receive low battery notifications through the app well before it needs charging. It charges via USB-C and takes about 2 hours for a full charge.', 'devices', 'active', 'customer', '{"pendant", "battery"}'),

-- Regional Services
('Do you offer services in Spain?', 'Yes! We provide specialized regional services in Spain including local call center support in Spanish, integration with Spanish emergency services, and culturally-aware emergency response. Our Spanish team understands local emergency protocols and can provide support in your preferred language.', 'regional', 'active', 'customer', '{"spain", "regional", "call-center"}'),

('What languages do you support?', 'We support multiple languages including English, Spanish, and others. Our Emma AI assistant can communicate in your preferred language, and our regional call centers provide native language support for emergency situations.', 'support', 'active', 'customer', '{"languages", "support"}'),

-- Technical Support
('How do I get help if I have problems?', 'We offer multiple support channels: 1) Chat with Emma (our AI assistant) 24/7 for instant help, 2) Submit support tickets through the app, 3) Email support for non-urgent issues, 4) Priority phone support for Member Plan users, 5) Emergency support is always available 24/7.', 'support', 'active', 'customer', '{"support", "help"}'),

('Is the service available 24/7?', 'Yes! Our emergency monitoring, SOS response, and Emma AI assistant are available 24/7, 365 days a year. Emergency response never sleeps. Regular customer support is available during business hours, with priority support for Member Plan subscribers.', 'support', 'active', 'customer', '{"24/7", "availability"}'),

-- Privacy and Security
('How do you protect my privacy?', 'Privacy is our top priority. We use end-to-end encryption for all communications, store minimal personal data, and you control all sharing settings. Location data is only shared when you explicitly allow it or during emergencies. We never sell your data and comply with GDPR and other privacy regulations.', 'privacy', 'active', 'customer', '{"privacy", "security", "gdpr"}'),

('Is my data secure?', 'Absolutely. We use bank-level encryption, secure cloud infrastructure, and regular security audits. All emergency communications are encrypted, and personal data is protected by multiple security layers. Our systems are regularly tested and updated to maintain the highest security standards.', 'security', 'active', 'customer', '{"security", "encryption"}'),

-- Getting Started
('How do I sign up?', 'Getting started is simple: 1) Download our app or visit our website, 2) Choose your plan (Member €9.99 or Family Access €2.99), 3) Complete setup in under 5 minutes, 4) Add emergency contacts, 5) Test your SOS system. Emma will guide you through each step!', 'getting-started', 'active', 'customer', '{"signup", "onboarding"}'),

('Can I try the service before paying?', 'Yes! We offer a free trial period where you can test all features including the SOS system (we''ll mark it as a test). This lets you experience the peace of mind our service provides before committing to a subscription.', 'trial', 'active', 'customer', '{"trial", "free"}'),

-- AI Assistant Emma
('What can Emma help me with?', 'I''m Emma, your AI assistant! I can help you with: setting up your emergency system, explaining features, troubleshooting devices, managing family sharing, answering questions about plans and pricing, and providing 24/7 support. I''m here whenever you need help!', 'emma', 'active', 'customer', '{"emma", "ai-assistant"}'),

('How smart is the AI assistant?', 'Emma is powered by advanced AI and knows everything about our emergency services, devices, and features. I can help with complex setup questions, provide personalized recommendations, troubleshoot issues, and even help coordinate with family members. I''m constantly learning to serve you better!', 'emma', 'active', 'customer', '{"emma", "ai-capabilities"}');

-- Mark any internal/admin content as internal
UPDATE public.training_data 
SET audience = 'internal' 
WHERE category IN ('admin', 'system', 'backend', 'infrastructure') 
   OR question ILIKE '%admin%' 
   OR question ILIKE '%backend%' 
   OR question ILIKE '%database%' 
   OR question ILIKE '%server%' 
   OR answer ILIKE '%admin%' 
   OR answer ILIKE '%backend%';