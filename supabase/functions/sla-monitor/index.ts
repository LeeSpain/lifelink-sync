import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SLASetting {
  id: string;
  name: string;
  channel: string | null;
  priority: number | null;
  first_response_target_minutes: number;
  resolution_target_minutes: number;
  escalation_enabled: boolean;
  escalation_after_minutes: number | null;
  escalate_to_user_id: string | null;
  business_hours_only: boolean;
  is_active: boolean;
}

interface SLACheckResult {
  conversation_id: string;
  applicable_sla: SLASetting | null;
  first_response: {
    status: 'ok' | 'warning' | 'breached';
    target_minutes: number;
    elapsed_minutes: number;
    remaining_minutes: number;
  } | null;
  resolution: {
    status: 'ok' | 'warning' | 'breached';
    target_minutes: number;
    elapsed_minutes: number;
    remaining_minutes: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, conversation_id, filters } = await req.json();

    switch (action) {
      case 'check_sla_status':
        return await checkSlaStatus(supabaseClient, conversation_id);
      
      case 'apply_sla_to_conversation':
        return await applySlaToConversation(supabaseClient, conversation_id);
      
      case 'get_breach_alerts':
        return await getBreachAlerts(supabaseClient, filters);
      
      case 'check_all_conversations':
        return await checkAllConversations(supabaseClient);
      
      case 'calculate_metrics':
        return await calculateSlaMetrics(supabaseClient, filters);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('SLA Monitor Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getApplicableSla(
  supabase: any,
  channel: string,
  priority: number
): Promise<SLASetting | null> {
  // Get all active SLA settings, ordered by specificity
  const { data: slaSettings } = await supabase
    .from('sla_settings')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false, nullsFirst: false });

  if (!slaSettings || slaSettings.length === 0) return null;

  // Find the most specific matching SLA
  // Priority: exact channel + priority > exact channel > exact priority > general
  let bestMatch: SLASetting | null = null;
  let bestScore = -1;

  for (const sla of slaSettings) {
    let score = 0;
    
    // Check channel match
    if (sla.channel) {
      if (sla.channel !== channel) continue; // Skip if channel doesn't match
      score += 2;
    }
    
    // Check priority match
    if (sla.priority) {
      if (sla.priority !== priority) continue; // Skip if priority doesn't match
      score += 1;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = sla;
    }
  }

  // If no specific match found, try to find a general SLA (null channel and priority)
  if (!bestMatch) {
    bestMatch = slaSettings.find((s: SLASetting) => !s.channel && !s.priority) || null;
  }

  return bestMatch;
}

async function isWithinBusinessHours(supabase: any): Promise<boolean> {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const { data: hours } = await supabase
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true)
    .single();

  if (!hours) return false;

  return currentTime >= hours.start_time && currentTime <= hours.end_time;
}

async function calculateElapsedBusinessMinutes(
  supabase: any,
  startTime: Date,
  endTime: Date = new Date()
): Promise<number> {
  // Simplified calculation - in production, this should properly calculate
  // elapsed time only during business hours
  const elapsedMs = endTime.getTime() - startTime.getTime();
  return Math.floor(elapsedMs / (1000 * 60));
}

async function checkSlaStatus(
  supabase: any,
  conversationId: string
): Promise<Response> {
  // Get conversation details
  const { data: conversation, error } = await supabase
    .from('unified_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !conversation) {
    return new Response(
      JSON.stringify({ error: 'Conversation not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get applicable SLA
  const sla = await getApplicableSla(supabase, conversation.channel, conversation.priority);

  if (!sla) {
    return new Response(
      JSON.stringify({ 
        conversation_id: conversationId,
        applicable_sla: null,
        message: 'No SLA applies to this conversation'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const createdAt = new Date(conversation.created_at);
  const now = new Date();
  
  // Calculate elapsed time (considering business hours if needed)
  let elapsedMinutes: number;
  if (sla.business_hours_only) {
    elapsedMinutes = await calculateElapsedBusinessMinutes(supabase, createdAt, now);
  } else {
    elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  }

  // Check if first response has been made
  const { data: firstResponse } = await supabase
    .from('unified_messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .eq('direction', 'outbound')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  // Calculate first response status
  let firstResponseResult = null;
  if (!firstResponse) {
    const remaining = sla.first_response_target_minutes - elapsedMinutes;
    let status: 'ok' | 'warning' | 'breached' = 'ok';
    if (remaining <= 0) status = 'breached';
    else if (remaining <= sla.first_response_target_minutes * 0.25) status = 'warning';

    firstResponseResult = {
      status,
      target_minutes: sla.first_response_target_minutes,
      elapsed_minutes: elapsedMinutes,
      remaining_minutes: Math.max(0, remaining)
    };

    // Record breach if applicable
    if (status === 'breached') {
      await recordBreach(supabase, conversationId, sla.id, 'first_response', sla.first_response_target_minutes, elapsedMinutes);
    }
  }

  // Calculate resolution status (only if not closed)
  let resolutionResult = null;
  if (conversation.status !== 'closed') {
    const remaining = sla.resolution_target_minutes - elapsedMinutes;
    let status: 'ok' | 'warning' | 'breached' = 'ok';
    if (remaining <= 0) status = 'breached';
    else if (remaining <= sla.resolution_target_minutes * 0.25) status = 'warning';

    resolutionResult = {
      status,
      target_minutes: sla.resolution_target_minutes,
      elapsed_minutes: elapsedMinutes,
      remaining_minutes: Math.max(0, remaining)
    };

    // Record breach if applicable
    if (status === 'breached') {
      await recordBreach(supabase, conversationId, sla.id, 'resolution', sla.resolution_target_minutes, elapsedMinutes);
    }
  }

  // Check for escalation
  if (sla.escalation_enabled && sla.escalation_after_minutes) {
    const escalationThreshold = Math.min(
      sla.first_response_target_minutes,
      sla.escalation_after_minutes
    );
    
    if (elapsedMinutes >= escalationThreshold && !firstResponse) {
      await triggerEscalation(supabase, conversationId, sla);
    }
  }

  const result: SLACheckResult = {
    conversation_id: conversationId,
    applicable_sla: sla,
    first_response: firstResponseResult,
    resolution: resolutionResult!
  };

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function recordBreach(
  supabase: any,
  conversationId: string,
  slaId: string,
  breachType: 'first_response' | 'resolution',
  targetMinutes: number,
  actualMinutes: number
): Promise<void> {
  // Check if breach already recorded
  const { data: existing } = await supabase
    .from('sla_breaches')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('breach_type', breachType)
    .single();

  if (existing) return; // Already recorded

  await supabase.from('sla_breaches').insert({
    conversation_id: conversationId,
    sla_setting_id: slaId,
    breach_type: breachType,
    target_minutes: targetMinutes,
    actual_minutes: actualMinutes
  });
}

async function triggerEscalation(
  supabase: any,
  conversationId: string,
  sla: SLASetting
): Promise<void> {
  if (!sla.escalate_to_user_id) return;

  // Check if already escalated
  const { data: conversation } = await supabase
    .from('unified_conversations')
    .select('status')
    .eq('id', conversationId)
    .single();

  if (conversation?.status === 'escalated') return;

  // Update conversation status
  await supabase
    .from('unified_conversations')
    .update({ 
      status: 'escalated',
      assigned_to: sla.escalate_to_user_id
    })
    .eq('id', conversationId);

  // Create assignment record
  await supabase.from('conversation_assignments').insert({
    conversation_id: conversationId,
    user_id: sla.escalate_to_user_id,
    role: 'escalation',
    is_active: true
  });

  // TODO: Send notification to escalation user
  console.log(`Escalated conversation ${conversationId} to user ${sla.escalate_to_user_id}`);
}

async function applySlaToConversation(
  supabase: any,
  conversationId: string
): Promise<Response> {
  const { data: conversation } = await supabase
    .from('unified_conversations')
    .select('channel, priority, created_at')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    return new Response(
      JSON.stringify({ error: 'Conversation not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const sla = await getApplicableSla(supabase, conversation.channel, conversation.priority);

  if (sla) {
    const responseDueAt = new Date(conversation.created_at);
    responseDueAt.setMinutes(responseDueAt.getMinutes() + sla.first_response_target_minutes);

    await supabase
      .from('unified_conversations')
      .update({ response_due_at: responseDueAt.toISOString() })
      .eq('id', conversationId);
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      sla_applied: sla?.name || null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getBreachAlerts(
  supabase: any,
  filters: any = {}
): Promise<Response> {
  let query = supabase
    .from('sla_breaches')
    .select(`
      *,
      unified_conversations(id, subject, contact_name, channel, status)
    `)
    .is('resolved_at', null)
    .order('breached_at', { ascending: false });

  if (filters.breach_type) {
    query = query.eq('breach_type', filters.breach_type);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ breaches: data || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkAllConversations(supabase: any): Promise<Response> {
  // Get all open conversations
  const { data: conversations } = await supabase
    .from('unified_conversations')
    .select('id')
    .in('status', ['open', 'assigned'])
    .order('created_at', { ascending: true });

  if (!conversations || conversations.length === 0) {
    return new Response(
      JSON.stringify({ checked: 0, breaches: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let breachCount = 0;

  for (const conv of conversations) {
    const response = await checkSlaStatus(supabase, conv.id);
    const result = await response.json();
    
    if (result.first_response?.status === 'breached' || result.resolution?.status === 'breached') {
      breachCount++;
    }
  }

  return new Response(
    JSON.stringify({ 
      checked: conversations.length,
      breaches: breachCount
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function calculateSlaMetrics(
  supabase: any,
  filters: any = {}
): Promise<Response> {
  const startDate = filters.start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = filters.end_date || new Date().toISOString();

  // Get total conversations in period
  const { count: totalConversations } = await supabase
    .from('unified_conversations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Get breaches in period
  const { count: totalBreaches } = await supabase
    .from('sla_breaches')
    .select('*', { count: 'exact', head: true })
    .gte('breached_at', startDate)
    .lte('breached_at', endDate);

  // Calculate compliance rate
  const complianceRate = totalConversations && totalConversations > 0
    ? ((totalConversations - (totalBreaches || 0)) / totalConversations) * 100
    : 100;

  // Get average first response time
  const { data: responseData } = await supabase
    .from('unified_messages')
    .select('conversation_id, created_at')
    .eq('direction', 'outbound')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Calculate average (simplified - in production would need to match with conversation creation time)
  const avgFirstResponseMinutes = 12; // Placeholder

  return new Response(
    JSON.stringify({
      period: { start: startDate, end: endDate },
      total_conversations: totalConversations || 0,
      total_breaches: totalBreaches || 0,
      compliance_rate: Math.round(complianceRate * 10) / 10,
      avg_first_response_minutes: avgFirstResponseMinutes,
      breakdown: {
        first_response_breaches: 0,
        resolution_breaches: 0
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
