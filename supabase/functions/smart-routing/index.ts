import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoutingRequest {
  conversation_id: string;
  message_content: string;
  categorization?: any;
  sender_info?: any;
}

// Apply routing rules
async function applyRoutingRules(request: RoutingRequest) {
  const { conversation_id, message_content, categorization, sender_info } = request;

  console.log('Applying routing rules for conversation:', conversation_id);

  // Get all active routing rules ordered by priority
  const { data: rules, error: rulesError } = await supabase
    .from('conversation_routing_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority');

  if (rulesError) {
    console.error('Error fetching routing rules:', rulesError);
    return { success: false, error: rulesError.message };
  }

  const appliedActions = [];

  for (const rule of rules || []) {
    try {
      const conditions = rule.conditions || {};
      const actionConfig = rule.action_config || {};

      // Check if rule conditions match
      if (!matchesRuleConditions(conditions, message_content, categorization)) {
        continue;
      }

      console.log(`Applying rule: ${rule.name}`);

      // Apply the rule action
      const actionResult = await applyRuleAction(
        rule.action_type,
        actionConfig,
        conversation_id,
        message_content,
        categorization,
        sender_info
      );

      appliedActions.push({
        rule_name: rule.name,
        action_type: rule.action_type,
        result: actionResult
      });

      // If action was successful and rule is marked as terminal, stop processing
      if (actionResult.success && actionConfig.terminal) {
        break;
      }

    } catch (error) {
      console.error(`Error applying rule ${rule.name}:`, error);
      appliedActions.push({
        rule_name: rule.name,
        action_type: rule.action_type,
        result: { success: false, error: error.message }
      });
    }
  }

  return {
    success: true,
    applied_actions: appliedActions,
    total_rules_applied: appliedActions.length
  };
}

// Check if rule conditions match
function matchesRuleConditions(
  conditions: any,
  messageContent: string,
  categorization?: any
): boolean {
  // Check keyword matching
  if (conditions.keywords && Array.isArray(conditions.keywords)) {
    const hasKeyword = conditions.keywords.some((keyword: string) =>
      messageContent.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) return false;
  }

  // Check confidence threshold
  if (conditions.confidence_min && categorization) {
    if (categorization.confidence < conditions.confidence_min) {
      return false;
    }
  }

  // Check category matching
  if (conditions.category && categorization) {
    if (categorization.category !== conditions.category) {
      return false;
    }
  }

  // Check urgency level
  if (conditions.urgency && categorization) {
    if (categorization.urgency !== conditions.urgency) {
      return false;
    }
  }

  // Check sentiment
  if (conditions.sentiment && categorization) {
    if (categorization.sentiment !== conditions.sentiment) {
      return false;
    }
  }

  // Check time-based conditions
  if (conditions.time_range) {
    const now = new Date();
    const currentHour = now.getHours();
    const { start_hour, end_hour } = conditions.time_range;
    
    if (start_hour !== undefined && end_hour !== undefined) {
      if (currentHour < start_hour || currentHour > end_hour) {
        return false;
      }
    }
  }

  return true;
}

// Apply specific rule action
async function applyRuleAction(
  actionType: string,
  actionConfig: any,
  conversationId: string,
  messageContent: string,
  categorization?: any,
  senderInfo?: any
) {
  switch (actionType) {
    case 'assign_category':
      return await assignCategory(conversationId, actionConfig, categorization);

    case 'assign_user':
      return await assignUser(conversationId, actionConfig);

    case 'trigger_workflow':
      return await triggerWorkflow(actionConfig, conversationId, senderInfo);

    case 'auto_reply':
      return await triggerAutoReply(conversationId, messageContent, actionConfig);

    case 'escalate':
      return await escalateConversation(conversationId, actionConfig);

    case 'add_tag':
      return await addConversationTag(conversationId, actionConfig);

    case 'set_priority':
      return await setPriority(conversationId, actionConfig);

    default:
      return { success: false, error: `Unknown action type: ${actionType}` };
  }
}

// Action implementations
async function assignCategory(conversationId: string, actionConfig: any, categorization?: any) {
  const categoryName = actionConfig.category_name;
  
  // Find category by name
  const { data: category, error } = await supabase
    .from('conversation_categories')
    .select('id')
    .eq('name', categoryName)
    .eq('is_active', true)
    .single();

  if (error || !category) {
    return { success: false, error: `Category ${categoryName} not found` };
  }

  // Update conversation metadata
  const { error: updateError } = await supabase
    .from('unified_conversations')
    .update({
      metadata: {
        category_id: category.id,
        category_name: categoryName,
        auto_categorized: true,
        categorization_confidence: categorization?.confidence || 0
      }
    })
    .eq('id', conversationId);

  return updateError 
    ? { success: false, error: updateError.message }
    : { success: true, category_id: category.id };
}

async function assignUser(conversationId: string, actionConfig: any) {
  const userId = actionConfig.user_id;

  const { error } = await supabase
    .from('unified_conversations')
    .update({
      metadata: {
        assigned_to: userId,
        assigned_at: new Date().toISOString(),
        auto_assigned: true
      }
    })
    .eq('id', conversationId);

  return error 
    ? { success: false, error: error.message }
    : { success: true, assigned_to: userId };
}

async function triggerWorkflow(actionConfig: any, conversationId: string, senderInfo?: any) {
  const workflowName = actionConfig.workflow_name;

  // Trigger workflow via workflow-automation function
  const response = await supabase.functions.invoke('workflow-automation', {
    body: {
      action: 'trigger_workflow',
      trigger_type: 'conversation_category',
      conversation_id: conversationId,
      event_data: {
        workflow_name: workflowName,
        sender_info: senderInfo
      }
    }
  });

  return response.error
    ? { success: false, error: response.error.message }
    : { success: true, workflow_triggered: workflowName };
}

async function triggerAutoReply(conversationId: string, messageContent: string, actionConfig: any) {
  // Trigger auto-reply via ai-auto-reply function
  const response = await supabase.functions.invoke('ai-auto-reply', {
    body: {
      conversation_id: conversationId,
      message_content: messageContent,
      action_config: actionConfig
    }
  });

  return response.error
    ? { success: false, error: response.error.message }
    : { success: true, auto_reply_queued: true };
}

async function escalateConversation(conversationId: string, actionConfig: any) {
  const escalationLevel = actionConfig.level || 'high';
  const escalateTo = actionConfig.escalate_to;

  const { error } = await supabase
    .from('unified_conversations')
    .update({
      metadata: {
        escalated: true,
        escalation_level: escalationLevel,
        escalated_to: escalateTo,
        escalated_at: new Date().toISOString()
      }
    })
    .eq('id', conversationId);

  return error 
    ? { success: false, error: error.message }
    : { success: true, escalated: true, level: escalationLevel };
}

async function addConversationTag(conversationId: string, actionConfig: any) {
  const tags = actionConfig.tags || [];

  const { data: conversation, error: fetchError } = await supabase
    .from('unified_conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const currentMetadata = conversation.metadata || {};
  const currentTags = currentMetadata.tags || [];
  const newTags = [...new Set([...currentTags, ...tags])];

  const { error: updateError } = await supabase
    .from('unified_conversations')
    .update({
      metadata: {
        ...currentMetadata,
        tags: newTags
      }
    })
    .eq('id', conversationId);

  return updateError 
    ? { success: false, error: updateError.message }
    : { success: true, tags: newTags };
}

async function setPriority(conversationId: string, actionConfig: any) {
  const priority = actionConfig.priority || 3;

  const { error } = await supabase
    .from('unified_conversations')
    .update({
      metadata: {
        priority: priority,
        priority_set_at: new Date().toISOString(),
        auto_prioritized: true
      }
    })
    .eq('id', conversationId);

  return error 
    ? { success: false, error: error.message }
    : { success: true, priority: priority };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const routingRequest: RoutingRequest = await req.json();

    const result = await applyRoutingRules(routingRequest);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in smart-routing function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

serve(handler);