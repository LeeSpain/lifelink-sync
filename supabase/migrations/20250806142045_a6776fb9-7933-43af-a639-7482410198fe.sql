-- Phase 1: Critical Admin Access Control Implementation

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role text NOT NULL DEFAULT 'user';

-- Add check constraint for valid roles
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles CHECK (role IN ('user', 'admin'));

-- Create security definer function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(public.get_user_role() = 'admin', false);
$$;

-- Update admin RLS policies to use proper role-based access control

-- Fix auto_reply_queue policy
DROP POLICY IF EXISTS "Admin can manage auto reply queue" ON public.auto_reply_queue;
CREATE POLICY "Admin can manage auto reply queue" 
ON public.auto_reply_queue 
FOR ALL 
USING (public.is_admin());

-- Fix bulk_campaigns policy
DROP POLICY IF EXISTS "Admin can manage bulk campaigns" ON public.bulk_campaigns;
CREATE POLICY "Admin can manage bulk campaigns" 
ON public.bulk_campaigns 
FOR ALL 
USING (public.is_admin());

-- Fix communication_analytics policies
DROP POLICY IF EXISTS "Admin can view analytics" ON public.communication_analytics;
CREATE POLICY "Admin can view analytics" 
ON public.communication_analytics 
FOR SELECT 
USING (public.is_admin());

-- Fix conversation_assignments policy
DROP POLICY IF EXISTS "Admin can manage assignments" ON public.conversation_assignments;
CREATE POLICY "Admin can manage assignments" 
ON public.conversation_assignments 
FOR ALL 
USING (public.is_admin());

-- Fix conversation_categories policy
DROP POLICY IF EXISTS "Admin can manage conversation categories" ON public.conversation_categories;
CREATE POLICY "Admin can manage conversation categories" 
ON public.conversation_categories 
FOR ALL 
USING (public.is_admin());

-- Fix conversation_handovers policy
DROP POLICY IF EXISTS "Admin can manage handovers" ON public.conversation_handovers;
CREATE POLICY "Admin can manage handovers" 
ON public.conversation_handovers 
FOR ALL 
USING (public.is_admin());

-- Fix email_automation_settings policy
DROP POLICY IF EXISTS "Admin can manage email automation settings" ON public.email_automation_settings;
CREATE POLICY "Admin can manage email automation settings" 
ON public.email_automation_settings 
FOR ALL 
USING (public.is_admin());

-- Fix email_campaigns policy
DROP POLICY IF EXISTS "Admin can manage email campaigns" ON public.email_campaigns;
CREATE POLICY "Admin can manage email campaigns" 
ON public.email_campaigns 
FOR ALL 
USING (public.is_admin());

-- Fix email_logs policy
DROP POLICY IF EXISTS "Admin can view all email logs" ON public.email_logs;
CREATE POLICY "Admin can view all email logs" 
ON public.email_logs 
FOR SELECT 
USING (public.is_admin());

-- Fix email_templates policy
DROP POLICY IF EXISTS "Admin can manage email templates" ON public.email_templates;
CREATE POLICY "Admin can manage email templates" 
ON public.email_templates 
FOR ALL 
USING (public.is_admin());

-- Fix product_categories policy
DROP POLICY IF EXISTS "Admin can manage product categories" ON public.product_categories;
CREATE POLICY "Admin can manage product categories" 
ON public.product_categories 
FOR ALL 
USING (public.is_admin());

-- Fix products policy
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
CREATE POLICY "Admin can manage products" 
ON public.products 
FOR ALL 
USING (public.is_admin());

-- Fix regional_services policy
DROP POLICY IF EXISTS "Admin can manage regional services" ON public.regional_services;
CREATE POLICY "Admin can manage regional services" 
ON public.regional_services 
FOR ALL 
USING (public.is_admin());

-- Fix routing_rules policy
DROP POLICY IF EXISTS "Admin can manage routing rules" ON public.routing_rules;
CREATE POLICY "Admin can manage routing rules" 
ON public.routing_rules 
FOR ALL 
USING (public.is_admin());

-- Fix service_product_compatibility policy
DROP POLICY IF EXISTS "Admin can manage service compatibility" ON public.service_product_compatibility;
CREATE POLICY "Admin can manage service compatibility" 
ON public.service_product_compatibility 
FOR ALL 
USING (public.is_admin());

-- Fix subscription_plans policy
DROP POLICY IF EXISTS "Admin can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admin can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (public.is_admin());

-- Fix unified_conversations policy
DROP POLICY IF EXISTS "Admin can manage unified conversations" ON public.unified_conversations;
CREATE POLICY "Admin can manage unified conversations" 
ON public.unified_conversations 
FOR ALL 
USING (public.is_admin());

-- Fix unified_messages policy
DROP POLICY IF EXISTS "Admin can manage unified messages" ON public.unified_messages;
CREATE POLICY "Admin can manage unified messages" 
ON public.unified_messages 
FOR ALL 
USING (public.is_admin());

-- Fix workflow_executions policy
DROP POLICY IF EXISTS "Admin can view workflow executions" ON public.workflow_executions;
CREATE POLICY "Admin can view workflow executions" 
ON public.workflow_executions 
FOR SELECT 
USING (public.is_admin());

-- Fix workflow_triggers policy
DROP POLICY IF EXISTS "Admin can manage workflow triggers" ON public.workflow_triggers;
CREATE POLICY "Admin can manage workflow triggers" 
ON public.workflow_triggers 
FOR ALL 
USING (public.is_admin());

-- Create trigger to update user role in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    phone,
    emergency_contacts,
    medical_conditions,
    allergies,
    medications,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    '[]'::jsonb,
    ARRAY[]::text[],
    ARRAY[]::text[],
    ARRAY[]::text[],
    'user'::text  -- Default role for new users
  );
  RETURN NEW;
END;
$$;