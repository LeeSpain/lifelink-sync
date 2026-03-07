-- Create unified conversation threads table
CREATE TABLE public.unified_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT, -- Email thread ID or WhatsApp conversation ID
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'web_chat'
  subject TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'assigned', 'closed', 'escalated'
  priority INTEGER DEFAULT 3, -- 1=highest, 5=lowest
  assigned_to UUID, -- User assigned to handle this conversation
  category_id UUID,
  tags TEXT[] DEFAULT ARRAY[]::text[],
  metadata JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  response_due_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unified messages table
CREATE TABLE public.unified_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.unified_conversations(id) ON DELETE CASCADE,
  external_message_id TEXT, -- Email message ID or WhatsApp message ID
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- 'text', 'html', 'image', 'file'
  attachments JSONB DEFAULT '[]'::jsonb,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_confidence_score NUMERIC,
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation handovers table
CREATE TABLE public.conversation_handovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.unified_conversations(id) ON DELETE CASCADE,
  from_user_id UUID, -- Previous assignee (NULL if unassigned)
  to_user_id UUID NOT NULL, -- New assignee
  handover_type TEXT NOT NULL, -- 'manual', 'auto_escalation', 'auto_routing'
  reason TEXT,
  notes TEXT,
  initiated_by UUID, -- Admin who initiated the handover
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communication analytics table
CREATE TABLE public.communication_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'web_chat', 'all'
  metric_type TEXT NOT NULL, -- 'conversations_total', 'messages_sent', 'response_time_avg', 'resolution_time_avg'
  metric_value NUMERIC NOT NULL,
  category_breakdown JSONB DEFAULT '{}'::jsonb,
  user_breakdown JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bulk message campaigns table
CREATE TABLE public.bulk_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  channel TEXT NOT NULL, -- 'email', 'whatsapp', 'both'
  template_id UUID,
  target_criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- Criteria for selecting recipients
  content_template TEXT NOT NULL,
  subject_template TEXT, -- For email campaigns
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'cancelled'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign recipients tracking
CREATE TABLE public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.bulk_campaigns(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT,
  phone TEXT,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened', 'clicked'
  variables_used JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation assignments table for team management
CREATE TABLE public.conversation_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.unified_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'assignee', -- 'assignee', 'watcher', 'escalation_target'
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on all tables
ALTER TABLE public.unified_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unified_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage unified conversations" ON public.unified_conversations FOR ALL USING (true);
CREATE POLICY "Users can view assigned conversations" ON public.unified_conversations FOR SELECT 
  USING (assigned_to = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM conversation_assignments WHERE conversation_id = id AND is_active = true
  ));

CREATE POLICY "Admin can manage unified messages" ON public.unified_messages FOR ALL USING (true);
CREATE POLICY "Users can view messages in assigned conversations" ON public.unified_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM unified_conversations WHERE assigned_to = auth.uid()
    UNION
    SELECT conversation_id FROM conversation_assignments WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "Admin can manage handovers" ON public.conversation_handovers FOR ALL USING (true);
CREATE POLICY "Admin can view analytics" ON public.communication_analytics FOR SELECT USING (true);
CREATE POLICY "System can insert analytics" ON public.communication_analytics FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage bulk campaigns" ON public.bulk_campaigns FOR ALL USING (true);
CREATE POLICY "System can manage campaign recipients" ON public.campaign_recipients FOR ALL USING (true);
CREATE POLICY "Admin can manage assignments" ON public.conversation_assignments FOR ALL USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_unified_conversations_updated_at
  BEFORE UPDATE ON public.unified_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bulk_campaigns_updated_at
  BEFORE UPDATE ON public.bulk_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_unified_conversations_channel ON public.unified_conversations(channel);
CREATE INDEX idx_unified_conversations_status ON public.unified_conversations(status);
CREATE INDEX idx_unified_conversations_assigned_to ON public.unified_conversations(assigned_to);
CREATE INDEX idx_unified_conversations_last_activity ON public.unified_conversations(last_activity_at DESC);
CREATE INDEX idx_unified_messages_conversation_id ON public.unified_messages(conversation_id);
CREATE INDEX idx_unified_messages_created_at ON public.unified_messages(created_at DESC);
CREATE INDEX idx_communication_analytics_date_channel ON public.communication_analytics(date, channel);
CREATE INDEX idx_campaign_recipients_campaign_status ON public.campaign_recipients(campaign_id, status);

-- Insert sample data for testing
INSERT INTO public.unified_conversations (external_id, channel, subject, contact_name, contact_email, status, priority) VALUES
('email_thread_001', 'email', 'Emergency Service Inquiry', 'John Smith', 'john.smith@example.com', 'open', 1),
('whatsapp_conv_001', 'whatsapp', NULL, 'Maria Garcia', NULL, 'assigned', 2),
('email_thread_002', 'email', 'Billing Question', 'Sarah Johnson', 'sarah.j@example.com', 'open', 3);

INSERT INTO public.unified_messages (conversation_id, direction, sender_name, sender_email, content) VALUES
((SELECT id FROM unified_conversations WHERE external_id = 'email_thread_001'), 'inbound', 'John Smith', 'john.smith@example.com', 'I need help with setting up emergency contacts for my family.'),
((SELECT id FROM unified_conversations WHERE external_id = 'whatsapp_conv_001'), 'inbound', 'Maria Garcia', NULL, 'Hola, necesito ayuda con mi suscripción'),
((SELECT id FROM unified_conversations WHERE external_id = 'email_thread_002'), 'inbound', 'Sarah Johnson', 'sarah.j@example.com', 'I was charged twice for my subscription this month.');

-- Create communication analytics summary view
CREATE OR REPLACE VIEW public.communication_metrics_summary AS
SELECT 
  date,
  channel,
  SUM(CASE WHEN metric_type = 'conversations_total' THEN metric_value ELSE 0 END) as total_conversations,
  SUM(CASE WHEN metric_type = 'messages_sent' THEN metric_value ELSE 0 END) as total_messages,
  AVG(CASE WHEN metric_type = 'response_time_avg' THEN metric_value ELSE NULL END) as avg_response_time,
  AVG(CASE WHEN metric_type = 'resolution_time_avg' THEN metric_value ELSE NULL END) as avg_resolution_time
FROM public.communication_analytics
GROUP BY date, channel
ORDER BY date DESC, channel;