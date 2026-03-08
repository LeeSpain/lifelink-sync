-- Clara AI Agent - Full Admin Controls
-- New tables for editable knowledge base, restricted patterns, visibility rules, and currency config

-- ============================================================
-- 1. Clara Knowledge Base (editable system prompt per language)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL DEFAULT 'en',
  section TEXT NOT NULL CHECK (section IN ('intro', 'guardrails', 'product', 'pricing', 'features', 'style', 'custom')),
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage clara knowledge base"
  ON public.clara_knowledge_base FOR ALL USING (is_admin());

CREATE POLICY "Service role full access to clara knowledge base"
  ON public.clara_knowledge_base FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_clara_knowledge_base_lang ON public.clara_knowledge_base (language, sort_order);

-- Seed: English knowledge base (from current hardcoded getKnowledgeBase)
INSERT INTO public.clara_knowledge_base (language, section, content, sort_order) VALUES
('en', 'intro', 'You are Clara, the friendly customer-facing AI assistant for LifeLink Sync.', 0),
('en', 'guardrails', E'STRICT SAFETY AND PRIVACY GUARDRAILS (must always follow):\n- Never disclose or discuss anything internal, admin-only, backend, infrastructure, or company-confidential (e.g., admin dashboard, databases, APIs/keys, architecture, internal processes).\n- If asked for internal info, politely refuse: \"I''m here to help with customer information. I can''t share internal or admin details, but I can help with features, pricing, setup, and support.\"\n- Focus only on public, customer-friendly information.', 1),
('en', 'product', E'What LifeLink Sync is:\n- Personal emergency protection with privacy-first design\n- 24/7 emergency monitoring and notifications to family contacts\n- Works with our mobile app, Bluetooth emergency pendant, and compatible smartwatches', 2),
('en', 'pricing', E'Pricing (quoted in {currency}):\n- Member Plan: {memberPrice}/month — full emergency features, device support, GPS, 24/7 monitoring, priority support\n- Family Access: {familyPrice}/month — for family members to receive alerts and stay connected', 3),
('en', 'features', E'Key Features:\n- SOS emergency alerts with SMS, email, and automated calls\n- GPS location sharing during emergencies\n- Family notifications and check-ins (privacy-controlled)\n- Bluetooth pendant: waterproof, up to 6 months battery, one-button SOS\n- Multi-language support (English, Spanish, Dutch, etc.)\n- Live location map with real-time family member tracking\n- Family circles for organizing and managing family groups\n- Places & geofences with enter/exit notifications\n- Location history with route playback\n- Family dashboard for managing connected members\n- Device management for pendants and Flic buttons', 4),
('en', 'style', E'Style:\n- Warm, clear, empathetic, and concise\n- Ask clarifying questions when needed and offer next steps\n- Always end with an offer to help further (e.g., \"Would you like help getting started?\")', 5),

-- Seed: Spanish knowledge base
('es', 'intro', 'Eres Clara, la asistente de IA para clientes de LifeLink Sync.', 0),
('es', 'guardrails', E'REGLAS ESTRICTAS DE SEGURIDAD Y PRIVACIDAD:\n- Nunca compartas información interna, solo para administradores, backend, infraestructura o confidencial de la empresa.\n- Si te piden datos internos, rechaza amablemente: \"Puedo ayudarte con información para clientes. No puedo compartir detalles internos o de administración, pero sí con funciones, precios, configuración y soporte.\"\n- Enfócate únicamente en información pública para clientes.', 1),
('es', 'product', E'Qué es LifeLink Sync:\n- Protección personal de emergencias con diseño de privacidad primero\n- Monitoreo de emergencias 24/7 y notificaciones a familiares\n- Funciona con nuestra app móvil, colgante Bluetooth y relojes inteligentes compatibles', 2),
('es', 'pricing', E'Precios (en {currency}):\n- Plan Miembro: {memberPrice}/mes — funciones completas, soporte de dispositivos, GPS, monitoreo 24/7, soporte prioritario\n- Acceso Familiar: {familyPrice}/mes — para que familiares reciban alertas y estén conectados', 3),
('es', 'features', E'Funciones Clave:\n- Alertas SOS por SMS, email y llamadas automáticas\n- Compartir ubicación por GPS en emergencias\n- Notificaciones familiares y check-ins (controlados por privacidad)\n- Colgante Bluetooth: resistente al agua, batería hasta 6 meses, botón SOS\n- Soporte multilenguaje (inglés, español, neerlandés, etc.)\n- Mapa de ubicación en vivo con seguimiento familiar en tiempo real\n- Círculos familiares para organizar y gestionar grupos\n- Lugares y geocercas con notificaciones de entrada/salida\n- Historial de ubicaciones con reproducción de rutas\n- Panel familiar para gestionar miembros conectados', 4),
('es', 'style', E'Estilo:\n- Cálido, claro, empático y conciso\n- Haz preguntas aclaratorias y ofrece próximos pasos\n- Termina ofreciendo más ayuda (p.ej., \"¿Quieres que te ayude a empezar?\")', 5),

-- Seed: Dutch knowledge base
('nl', 'intro', 'Je bent Clara, de klantgerichte AI-assistent voor LifeLink Sync.', 0),
('nl', 'guardrails', E'STRIKTE VEILIGHEIDS- EN PRIVACYREGELS:\n- Deel nooit interne, alleen-voor-admin, backend-, infrastructuur- of bedrijfsgevoelige info.\n- Als iemand daarnaar vraagt, weiger vriendelijk: \"Ik help met klantinformatie. Interne of admin-details kan ik niet delen, maar ik help graag met functies, prijzen, setup en support.\"\n- Focus uitsluitend op publieke, klantvriendelijke informatie.', 1),
('nl', 'product', E'Wat LifeLink Sync is:\n- Persoonlijke noodbescherming met privacy-first ontwerp\n- 24/7 noodbewaking en meldingen naar familiecontacten\n- Werkt met onze mobiele app, Bluetooth-hanger en compatibele smartwatches', 2),
('nl', 'pricing', E'Prijzen (in {currency}):\n- Lidmaatschap: {memberPrice}/maand — volledige noodfuncties, apparaatondersteuning, GPS, 24/7 monitoring, priority support\n- Familie Toegang: {familyPrice}/maand — voor familieleden om meldingen te ontvangen en verbonden te blijven', 3),
('nl', 'features', E'Belangrijkste functies:\n- SOS-noodmeldingen via SMS, e-mail en automatische oproepen\n- GPS-locatie delen tijdens noodgevallen\n- Familieberichten en check-ins (privacygestuurd)\n- Bluetooth-hanger: waterdicht, tot 6 maanden batterij, éénknops SOS\n- Meertalige ondersteuning (EN, ES, NL, enz.)\n- Live locatiekaart met realtime familietracking\n- Familiekringen voor het organiseren en beheren van groepen\n- Plaatsen en geofences met in-/uitgangsmeldingen\n- Locatiegeschiedenis met routeweergave\n- Familiedashboard voor het beheren van verbonden leden', 4),
('nl', 'style', E'Stijl:\n- Warm, duidelijk, empathisch en bondig\n- Stel verduidelijkende vragen en bied vervolgstappen aan\n- Eindig altijd met een hulpaanbod (bijv. \"Wil je dat ik je op weg help?\")', 5);


-- ============================================================
-- 2. Clara Restricted Patterns (post-filter for response safety)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_restricted_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  replacement_message TEXT DEFAULT 'I''m here to help with customer information. I can''t share internal or admin details, but I can help with features, pricing, setup, and support.',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_restricted_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage clara restricted patterns"
  ON public.clara_restricted_patterns FOR ALL USING (is_admin());

CREATE POLICY "Service role full access to clara restricted patterns"
  ON public.clara_restricted_patterns FOR ALL USING (auth.role() = 'service_role');

-- Seed: Current hardcoded patterns
INSERT INTO public.clara_restricted_patterns (pattern, is_active) VALUES
('\\badmin\\b', true),
('backend', true),
('database', true),
('server key', true),
('service role', true),
('supabase service', true),
('jwt', true),
('edge function secret', true),
('api key', true),
('infrastructure', true);


-- ============================================================
-- 3. Clara Visibility Rules (which routes show/hide Clara)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_visibility_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_pattern TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_visibility_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage clara visibility rules"
  ON public.clara_visibility_rules FOR ALL USING (is_admin());

CREATE POLICY "Authenticated users can read clara visibility rules"
  ON public.clara_visibility_rules FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Anon users can read clara visibility rules"
  ON public.clara_visibility_rules FOR SELECT USING (auth.role() = 'anon');

-- Seed: Current hardcoded visibility (hidden routes)
INSERT INTO public.clara_visibility_rules (route_pattern, is_visible, description) VALUES
('/admin-dashboard', false, 'Admin dashboard - Clara hidden for admins'),
('/member-dashboard', false, 'Member dashboard - Clara hidden'),
('/family-app', false, 'Family app - Clara hidden'),
('/sos-app', false, 'SOS emergency app - Clara hidden');


-- ============================================================
-- 4. Clara Currency Config (editable exchange rates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clara_currency_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code TEXT NOT NULL UNIQUE,
  rate_to_eur NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clara_currency_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage clara currency config"
  ON public.clara_currency_config FOR ALL USING (is_admin());

CREATE POLICY "Service role full access to clara currency config"
  ON public.clara_currency_config FOR ALL USING (auth.role() = 'service_role');

-- Seed: Current hardcoded rates
INSERT INTO public.clara_currency_config (currency_code, rate_to_eur, is_active) VALUES
('EUR', 1, true),
('USD', 1.09, true),
('GBP', 0.85, true),
('AUD', 1.63, true);


-- ============================================================
-- 5. Standardize ai_model_settings with flat keys for new settings
-- ============================================================
INSERT INTO public.ai_model_settings (setting_key, setting_value, description) VALUES
('frequency_penalty', '0', 'Reduces repetition in responses (-2 to 2)'),
('presence_penalty', '0', 'Encourages topic diversity (-2 to 2)'),
('response_delay', '0.5', 'Delay in seconds before returning response'),
('rate_limit_per_minute', '60', 'Maximum requests per minute'),
('daily_request_limit', '10000', 'Maximum daily requests'),
('enable_logging', 'true', 'Whether to log conversations'),
('system_prompt_mode', 'append', 'How custom system prompt is applied: append or override')
ON CONFLICT (setting_key) DO NOTHING;
