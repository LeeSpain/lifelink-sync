import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnifiedInboxRequest {
  action: 'get_conversations' | 'get_messages' | 'send_message' | 'assign_conversation' | 'handover_conversation' | 'update_status' | 'draft_reply';
  conversation_id?: string;
  user_id?: string;
  filters?: {
    channel?: string;
    status?: string;
    assigned_to?: string;
    priority?: number;
  };
  message_data?: {
    content: string;
    direction: 'inbound' | 'outbound';
    sender_name?: string;
    sender_email?: string;
    sender_phone?: string;
  };
  assignment_data?: {
    user_id: string;
    role?: string;
  };
  handover_data?: {
    from_user_id?: string;
    to_user_id: string;
    reason?: string;
    notes?: string;
    initiated_by: string;
  };
  status_update?: {
    status: string;
    priority?: number;
    tags?: string[];
  };
}

// LifeLink Sync knowledge context for Clara
const LIFELINK_SYNC_KNOWLEDGE = `
LifeLink Sync is a personal safety and emergency alert service. Key facts:
- Provides SOS button for emergencies - sends alerts to family/emergency contacts
- GPS location sharing with family members
- Medical ID card with vital health information
- 24/7 monitoring optional add-on
- Works on iOS and Android mobile apps
- Designed for elderly, lone workers, and safety-conscious individuals
- NOT a medical service - provides safety alerts and family connectivity
- Subscription plans: Basic (free), Premium, Family plans available
- Integration with emergency services coordination (not direct 911 replacement)
- Key benefits: Peace of mind, quick alert system, location tracking, medical info access
`;

// Get conversations with filters
async function getConversations(filters: any = {}) {
  console.log('Getting conversations with filters:', filters);
  
  let query = supabase
    .from('unified_conversations')
    .select(`
      *,
      unified_messages(
        id, direction, content, created_at, sender_name
      )
    `)
    .order('last_activity_at', { ascending: false });
  
  // Apply filters
  if (filters.channel) {
    query = query.eq('channel', filters.channel);
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  
  if (filters.priority) {
    query = query.eq('priority', filters.priority);
  }
  
  const { data, error } = await query.limit(50);
  
  if (error) {
    throw new Error(`Failed to get conversations: ${error.message}`);
  }
  
  // Add latest message info to each conversation
  const conversations = data?.map(conversation => ({
    ...conversation,
    latest_message: conversation.unified_messages?.[0] || null,
    message_count: conversation.unified_messages?.length || 0
  })) || [];
  
  return conversations;
}

// Get messages for a conversation
async function getMessages(conversationId: string) {
  console.log('Getting messages for conversation:', conversationId);
  
  const { data, error } = await supabase
    .from('unified_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }
  
  return data || [];
}

// Send a message
async function sendMessage(conversationId: string, messageData: any) {
  console.log('Sending message to conversation:', conversationId);
  
  // Insert message
  const { data: message, error: messageError } = await supabase
    .from('unified_messages')
    .insert({
      conversation_id: conversationId,
      ...messageData
    })
    .select()
    .single();
  
  if (messageError) {
    throw new Error(`Failed to send message: ${messageError.message}`);
  }
  
  // Update conversation last activity
  await supabase
    .from('unified_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  return message;
}

// Assign conversation to user
async function assignConversation(conversationId: string, assignmentData: any) {
  console.log('Assigning conversation:', conversationId, 'to:', assignmentData.user_id);
  
  // Update conversation assignment
  const { error: updateError } = await supabase
    .from('unified_conversations')
    .update({
      assigned_to: assignmentData.user_id,
      status: 'assigned',
      last_activity_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  if (updateError) {
    throw new Error(`Failed to assign conversation: ${updateError.message}`);
  }
  
  // Create assignment record
  const { error: assignmentError } = await supabase
    .from('conversation_assignments')
    .insert({
      conversation_id: conversationId,
      user_id: assignmentData.user_id,
      role: assignmentData.role || 'assignee',
      assigned_by: assignmentData.assigned_by || assignmentData.user_id
    });
  
  if (assignmentError) {
    console.error('Failed to create assignment record:', assignmentError);
  }
  
  return { success: true };
}

// Handover conversation
async function handoverConversation(conversationId: string, handoverData: any) {
  console.log('Handing over conversation:', conversationId);
  
  // Get current assignment
  const { data: currentConversation } = await supabase
    .from('unified_conversations')
    .select('assigned_to')
    .eq('id', conversationId)
    .single();
  
  // Create handover record
  const { error: handoverError } = await supabase
    .from('conversation_handovers')
    .insert({
      conversation_id: conversationId,
      from_user_id: currentConversation?.assigned_to,
      to_user_id: handoverData.to_user_id,
      handover_type: 'manual',
      reason: handoverData.reason,
      notes: handoverData.notes,
      initiated_by: handoverData.initiated_by
    });
  
  if (handoverError) {
    throw new Error(`Failed to create handover record: ${handoverError.message}`);
  }
  
  // Update conversation assignment
  const { error: updateError } = await supabase
    .from('unified_conversations')
    .update({
      assigned_to: handoverData.to_user_id,
      last_activity_at: new Date().toISOString()
    })
    .eq('id', conversationId);
  
  if (updateError) {
    throw new Error(`Failed to update conversation assignment: ${updateError.message}`);
  }
  
  // Deactivate old assignments and create new one
  await supabase
    .from('conversation_assignments')
    .update({ is_active: false, unassigned_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('is_active', true);
  
  await supabase
    .from('conversation_assignments')
    .insert({
      conversation_id: conversationId,
      user_id: handoverData.to_user_id,
      role: 'assignee',
      assigned_by: handoverData.initiated_by
    });
  
  return { success: true };
}

// Update conversation status
async function updateConversationStatus(conversationId: string, statusUpdate: any) {
  console.log('Updating conversation status:', conversationId);
  
  const updateData: any = {
    last_activity_at: new Date().toISOString()
  };
  
  if (statusUpdate.status) {
    updateData.status = statusUpdate.status;
  }
  
  if (statusUpdate.priority) {
    updateData.priority = statusUpdate.priority;
  }
  
  if (statusUpdate.tags) {
    updateData.tags = statusUpdate.tags;
  }
  
  const { error } = await supabase
    .from('unified_conversations')
    .update(updateData)
    .eq('id', conversationId);
  
  if (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
  
  return { success: true };
}

// Draft AI reply using Clara
async function draftReply(conversationId: string) {
  console.log('Drafting AI reply for conversation:', conversationId);
  
  // Fetch conversation with latest messages
  const { data: conversation, error: convError } = await supabase
    .from('unified_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  
  if (convError || !conversation) {
    throw new Error(`Failed to fetch conversation: ${convError?.message || 'Not found'}`);
  }
  
  // Fetch messages to understand context
  const { data: messages, error: msgError } = await supabase
    .from('unified_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (msgError) {
    console.error('Error fetching messages:', msgError);
  }
  
  // Build conversation context
  const messageHistory = (messages || [])
    .reverse()
    .map(m => `${m.direction === 'inbound' ? 'Customer' : 'Support'}: ${m.content}`)
    .join('\n');
  
  const customerName = conversation.contact_name || 'Customer';
  const customerEmail = conversation.contact_email || '';
  const subject = conversation.subject || 'General Inquiry';
  const latestMessage = messages?.[0]?.content || '';
  
  // Call OpenAI to generate draft
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const systemPrompt = `You are Clara, a professional customer service representative for LifeLink Sync. 
Your role is to draft helpful, professional, and friendly email responses.

${LIFELINK_SYNC_KNOWLEDGE}

Guidelines for responses:
- Be warm, professional, and helpful
- Address the customer's specific question or concern
- Do NOT promise medical services - LifeLink Sync is about safety and emergency alerts
- Keep responses under 2000 characters
- Include a clear next step or call-to-action question
- Do not be pushy about sales
- Sign off as "Best regards, The LifeLink Sync Team"

Also analyze the message and provide:
1. Sentiment: one of "positive", "neutral", "negative", or "urgent"
2. Category: one of "inquiry", "interest", "support", or "complaint"

Respond in JSON format:
{
  "reply": "your drafted reply here",
  "sentiment": "positive|neutral|negative|urgent",
  "category": "inquiry|interest|support|complaint"
}`;

  const userPrompt = `Customer: ${customerName}
Email: ${customerEmail}
Subject: ${subject}

Conversation history:
${messageHistory || 'No previous messages'}

Latest message from customer:
${latestMessage}

Please draft a professional reply and analyze the sentiment/category.`;

  try {
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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    let parsed: { reply: string; sentiment: string; category: string };
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if no JSON found
        parsed = {
          reply: aiResponse,
          sentiment: 'neutral',
          category: 'inquiry'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      parsed = {
        reply: aiResponse,
        sentiment: 'neutral',
        category: 'inquiry'
      };
    }
    
    // Validate sentiment and category
    const validSentiments = ['positive', 'neutral', 'negative', 'urgent'];
    const validCategories = ['inquiry', 'interest', 'support', 'complaint'];
    
    const sentiment = validSentiments.includes(parsed.sentiment) ? parsed.sentiment : 'neutral';
    const category = validCategories.includes(parsed.category) ? parsed.category : 'inquiry';
    
    // Update conversation with AI draft
    const { error: updateError } = await supabase
      .from('unified_conversations')
      .update({
        ai_suggested_reply: parsed.reply,
        ai_sentiment: sentiment,
        ai_category: category,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (updateError) {
      console.error('Failed to save AI draft:', updateError);
      throw new Error(`Failed to save AI draft: ${updateError.message}`);
    }
    
    console.log('AI draft saved successfully for conversation:', conversationId);
    
    return {
      success: true,
      conversation_id: conversationId,
      ai_suggested_reply: parsed.reply,
      ai_sentiment: sentiment,
      ai_category: category
    };
    
  } catch (error) {
    console.error('Error generating AI draft:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if ((profile?.role || 'user') !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const {
      action,
      conversation_id,
      filters,
      message_data,
      assignment_data,
      handover_data,
      status_update
    }: UnifiedInboxRequest = await req.json();

    switch (action) {
      case 'get_conversations': {
        const conversations = await getConversations(filters);
        
        return new Response(JSON.stringify({ 
          success: true,
          conversations
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_messages': {
        if (!conversation_id) {
          throw new Error('Conversation ID is required');
        }
        
        const messages = await getMessages(conversation_id);
        
        return new Response(JSON.stringify({ 
          success: true,
          messages
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_message': {
        if (!conversation_id || !message_data) {
          throw new Error('Conversation ID and message data are required');
        }
        
        const message = await sendMessage(conversation_id, message_data);
        
        return new Response(JSON.stringify({ 
          success: true,
          message
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'assign_conversation': {
        if (!conversation_id || !assignment_data) {
          throw new Error('Conversation ID and assignment data are required');
        }
        
        const result = await assignConversation(conversation_id, assignment_data);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'handover_conversation': {
        if (!conversation_id || !handover_data) {
          throw new Error('Conversation ID and handover data are required');
        }
        
        const result = await handoverConversation(conversation_id, handover_data);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update_status': {
        if (!conversation_id || !status_update) {
          throw new Error('Conversation ID and status update are required');
        }
        
        const result = await updateConversationStatus(conversation_id, status_update);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'draft_reply': {
        if (!conversation_id) {
          throw new Error('Conversation ID is required');
        }
        
        const result = await draftReply(conversation_id);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('Error in unified-inbox function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);