import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoReplyRequest {
  conversation_id: string;
  message_content: string;
  sender_info?: any;
}

// Categorize conversation using AI
async function categorizeConversation(messageContent: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that categorizes customer support messages. 
          
          Categories available:
          - Emergency: Urgent matters requiring immediate attention
          - Support: General help and support questions
          - Billing: Payment, subscription, billing inquiries
          - Technical: App issues, bugs, technical problems
          - Sales: Product inquiries, pricing, purchases
          
          Respond with a JSON object containing:
          {
            "category": "category_name",
            "confidence": 0.95,
            "keywords": ["word1", "word2"],
            "urgency": "high|medium|low",
            "sentiment": "positive|neutral|negative"
          }`
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return {
      category: 'Support',
      confidence: 0.5,
      keywords: [],
      urgency: 'medium',
      sentiment: 'neutral'
    };
  }
}

// Generate AI reply
async function generateAutoReply(
  messageContent: string, 
  category: string, 
  senderInfo: any,
  template?: any
) {
  let systemPrompt = `You are Clara, a helpful customer support AI for Emergency Protection Services. 

  Company Context:
  - We provide emergency protection and response services
  - We have mobile apps and web services
  - We offer subscription plans for families and individuals
  - We prioritize safety and quick response times

  Response Guidelines:
  - Be helpful, empathetic, and professional
  - Keep responses concise but informative
  - For emergencies, direct to emergency contact immediately
  - For billing issues, acknowledge and route to billing team
  - For technical issues, provide basic troubleshooting if possible
  - Always end with next steps or contact information

  Category: ${category}
  `;

  if (template) {
    systemPrompt += `\nUse this template as a base but personalize it:
    Subject: ${template.subject_template}
    Body: ${template.body_template}`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageContent }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// Check routing rules and determine actions
async function checkRoutingRules(categorization: any, messageContent: string) {
  const { data: rules, error } = await supabase
    .from('routing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority');

  if (error) {
    console.error('Error fetching routing rules:', error);
    return [];
  }

  const matchingRules = [];

  for (const rule of rules || []) {
    const conditions = rule.conditions || {};
    let matches = true;

    // Check keyword matching
    if (conditions.keywords && Array.isArray(conditions.keywords)) {
      const hasKeyword = conditions.keywords.some((keyword: string) =>
        messageContent.toLowerCase().includes(keyword.toLowerCase())
      );
      if (!hasKeyword) matches = false;
    }

    // Check confidence threshold
    if (conditions.confidence_min && categorization.confidence < conditions.confidence_min) {
      matches = false;
    }

    // Check category matching
    if (conditions.category && categorization.category !== conditions.category) {
      matches = false;
    }

    if (matches) {
      matchingRules.push(rule);
    }
  }

  return matchingRules;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, message_content, sender_info }: AutoReplyRequest = await req.json();

    console.log('Processing auto-reply for conversation:', conversation_id);

    // Step 1: Categorize the conversation
    const categorization = await categorizeConversation(message_content);
    console.log('Categorization result:', categorization);

    // Step 2: Find matching category in database
    const { data: category, error: categoryError } = await supabase
      .from('conversation_categories')
      .select('*')
      .eq('name', categorization.category)
      .eq('is_active', true)
      .single();

    if (categoryError) {
      console.log('Category not found in database, using default');
    }

    // Step 3: Check routing rules
    const matchingRules = await checkRoutingRules(categorization, message_content);
    console.log('Matching rules:', matchingRules.length);

    // Step 4: Process auto-reply rules
    const autoReplyRules = matchingRules.filter(rule => rule.action_type === 'auto_reply');

    if (autoReplyRules.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No auto-reply rules matched',
        categorization
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 5: Generate auto-reply for the first matching rule
    const autoReplyRule = autoReplyRules[0];
    const actionConfig = autoReplyRule.action_config || {};

    // Get template if specified
    let template = null;
    if (actionConfig.template_name) {
      const { data: templateData } = await supabase
        .from('email_templates')
        .select('*')
        .eq('name', actionConfig.template_name)
        .eq('template_type', 'auto_reply')
        .eq('is_active', true)
        .single();
      
      template = templateData;
    }

    // Generate AI reply
    const generatedReply = await generateAutoReply(
      message_content,
      categorization.category,
      sender_info,
      template
    );

    // Step 6: Save to auto-reply queue for approval
    const { data: queueItem, error: queueError } = await supabase
      .from('auto_reply_queue')
      .insert({
        conversation_id,
        generated_reply: generatedReply,
        confidence_score: categorization.confidence,
        category_id: category?.id,
        template_used: template?.id,
        status: actionConfig.require_approval ? 'pending' : 'approved',
        scheduled_send_at: actionConfig.require_approval ? null : new Date().toISOString()
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`Failed to queue auto-reply: ${queueError.message}`);
    }

    // Step 7: If no approval required, mark as ready to send
    if (!actionConfig.require_approval) {
      console.log('Auto-reply approved automatically, ready to send');
      
      // You could trigger actual sending here via another function
      // await supabase.functions.invoke('send-auto-reply', { data: { queue_id: queueItem.id } });
    }

    return new Response(JSON.stringify({ 
      success: true,
      queue_id: queueItem.id,
      requires_approval: actionConfig.require_approval,
      generated_reply: generatedReply,
      categorization,
      confidence: categorization.confidence
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-auto-reply function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);