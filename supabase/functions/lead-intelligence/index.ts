import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Lead {
  email: string | null;
  phone: string | null;
  name: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  lead_score_0_100: number;
  interest_level_0_10: number;
  recommended_plan: string | null;
  notes: string;
  tags: string[];
}

interface AnalyzeResult {
  leads: Lead[];
  summary: string;
  model: string;
}

const OPENAI_SYSTEM_PROMPT = `You are a lead extraction assistant for LifeLink Sync, an emergency SOS + monitoring solution for:
- Families with elderly relatives
- Seniors living alone
- Organisations: care providers, assisted living facilities, senior services

Target lead profiles (score higher):
- Care homes and assisted living facilities
- Senior services and support organisations
- Expat retirement communities
- Safety products resellers
- Local councils and NGOs focused on elderly care
- Emergency response service providers

Your task:
1. Extract ONLY publicly visible contact information from the provided text
2. If no email/phone is found, still return leads with company/name/role when available
3. Score leads 0-100 based on fit for LifeLink Sync (higher = better fit)
4. Assign interest level 0-10 based on apparent need for emergency/monitoring solutions
5. Suggest recommended plan: "individual", "family", "organization", or null

CRITICAL: Return ONLY valid JSON, no markdown, no explanation. Schema:
{
  "leads": [
    {
      "email": "string or null",
      "phone": "string or null", 
      "name": "string or null",
      "company": "string or null",
      "role": "string or null",
      "location": "string or null",
      "lead_score_0_100": number,
      "interest_level_0_10": number,
      "recommended_plan": "individual" | "family" | "organization" | null,
      "notes": "string - brief context about why this is a lead",
      "tags": ["array", "of", "relevant", "tags"]
    }
  ],
  "summary": "Brief summary of what was analyzed and key findings"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check OpenAI key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Init Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Parse request
    const body = await req.json();
    const { action } = body;

    console.log(`[lead-intelligence] User ${userId} action: ${action}`);

    // Rate limiting: max 20 analyses per day
    if (action === 'analyze_url' || action === 'analyze_text') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error: countError } = await supabase
        .from('lead_intelligence_runs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      if (countError) {
        console.error('Rate limit check error:', countError);
      } else if ((count || 0) >= 20) {
        return new Response(JSON.stringify({ 
          error: 'Daily limit reached. Maximum 20 analyses per day.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Handle actions
    if (action === 'analyze_url') {
      return await handleAnalyzeUrl(body.url, openAIApiKey, corsHeaders);
    } else if (action === 'analyze_text') {
      return await handleAnalyzeText(body.text, body.source, openAIApiKey, corsHeaders);
    } else if (action === 'save_leads') {
      return await handleSaveLeads(body, supabase, userId, corsHeaders);
    } else if (action === 'generate_intro') {
      return await handleGenerateIntro(body.lead, openAIApiKey, corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('[lead-intelligence] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleAnalyzeUrl(url: string, openAIApiKey: string, corsHeaders: Record<string, string>) {
  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate URL scheme
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Only HTTP/HTTPS URLs are supported' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL format' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[lead-intelligence] Fetching URL: ${url}`);

  // Fetch URL with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LifeLink-Sync-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/') && !contentType.includes('html') && !contentType.includes('json')) {
      return new Response(JSON.stringify({ 
        error: 'URL returned non-text content (e.g., image, PDF). Only text/HTML pages are supported.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let text = await response.text();
    
    // Strip HTML tags
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();

    // Truncate
    if (text.length > 50000) {
      text = text.substring(0, 50000);
    }

    if (text.length < 50) {
      return new Response(JSON.stringify({ error: 'Page content too short to analyze' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return await analyzeWithAI(text, `URL: ${url}`, openAIApiKey, corsHeaders);

  } catch (fetchError) {
    clearTimeout(timeoutId);
    const errMsg = fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
    if (errMsg.includes('abort')) {
      return new Response(JSON.stringify({ error: 'URL fetch timed out (15s limit)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: `Failed to fetch URL: ${errMsg}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleAnalyzeText(text: string, source: string | undefined, openAIApiKey: string, corsHeaders: Record<string, string>) {
  if (!text || text.trim().length < 20) {
    return new Response(JSON.stringify({ error: 'Text must be at least 20 characters' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let truncatedText = text.trim();
  if (truncatedText.length > 50000) {
    truncatedText = truncatedText.substring(0, 50000);
  }

  const sourceLabel = source || 'Manual text input';
  return await analyzeWithAI(truncatedText, sourceLabel, openAIApiKey, corsHeaders);
}

async function analyzeWithAI(text: string, sourceLabel: string, openAIApiKey: string, corsHeaders: Record<string, string>): Promise<Response> {
  console.log(`[lead-intelligence] Analyzing ${text.length} chars from: ${sourceLabel}`);

  const userPrompt = `Analyze the following content and extract any potential leads for LifeLink Sync emergency monitoring service.

Source: ${sourceLabel}

Content:
${text}`;

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
          { role: 'system', content: OPENAI_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[lead-intelligence] OpenAI error:', errText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const model = data.model || 'gpt-4o-mini';

    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from AI' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON - handle potential markdown wrapping
    let parsed: AnalyzeResult;
    try {
      let jsonStr = content.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[lead-intelligence] JSON parse error:', content);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response. Please try again.',
        raw: content 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate structure
    if (!Array.isArray(parsed.leads)) {
      parsed.leads = [];
    }

    console.log(`[lead-intelligence] Extracted ${parsed.leads.length} leads`);

    return new Response(JSON.stringify({
      leads: parsed.leads,
      summary: parsed.summary || 'Analysis complete',
      model: model,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (aiError) {
    console.error('[lead-intelligence] AI error:', aiError);
    return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Classify segment based on notes/source content
function classifySegment(lead: Lead, sourceValue: string): string {
  const text = `${lead.notes || ''} ${lead.company || ''} ${sourceValue || ''}`.toLowerCase();
  
  if (/care\s?home|residence|assisted\s?living|nursing\s?home|residents|care\s?provider/.test(text)) {
    return 'care_home';
  }
  if (/my\s?(mother|father|mum|dad)|elderly\s?parent|family|living\s?alone|grandmother|grandfather/.test(text)) {
    return 'family';
  }
  if (/partner|reseller|distributor|agency|ngo|council|b2b|wholesale/.test(text)) {
    return 'partner';
  }
  return 'general';
}

// Classify intent based on lead score
function classifyIntent(leadScore: number): 'hot' | 'warm' | 'cold' {
  if (leadScore >= 80) return 'hot';
  if (leadScore >= 50) return 'warm';
  return 'cold';
}

// Get priority based on intent
function getPriority(intent: 'hot' | 'warm' | 'cold'): 'high' | 'medium' | 'low' {
  switch (intent) {
    case 'hot': return 'high';
    case 'warm': return 'medium';
    case 'cold': return 'low';
  }
}

// Merge tags without duplicates
function mergeTags(existingTags: string[], segment: string, intent: string): string[] {
  const newTags = [
    ...existingTags,
    'lead:intel',
    `segment:${segment}`,
    `intent:${intent}`
  ];
  return [...new Set(newTags)];
}

// Optional: Try to add lead to email groups if tables exist
async function tryAddToEmailGroup(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  intent: 'hot' | 'warm' | 'cold'
): Promise<void> {
  const groupName = `Lead Intel - ${intent.charAt(0).toUpperCase() + intent.slice(1)}`;
  
  // Try different table name conventions for groups
  const groupTables = ['email_contact_groups', 'contact_groups', 'email_groups'];
  const memberTables = ['email_group_members', 'contact_group_members', 'email_contacts'];
  
  let groupTableName: string | null = null;
  let memberTableName: string | null = null;
  
  // Find which group table exists
  for (const tableName of groupTables) {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (!error) {
        groupTableName = tableName;
        break;
      }
    } catch {
      continue;
    }
  }
  
  if (!groupTableName) {
    console.log('[lead-intelligence] No email group table found, skipping group assignment');
    return;
  }
  
  // Find which member table exists
  for (const tableName of memberTables) {
    try {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (!error) {
        memberTableName = tableName;
        break;
      }
    } catch {
      continue;
    }
  }
  
  if (!memberTableName) {
    console.log('[lead-intelligence] No email group member table found, skipping group assignment');
    return;
  }
  
  console.log(`[lead-intelligence] Using group table: ${groupTableName}, member table: ${memberTableName}`);
  
  try {
    // Check if group exists, create if not
    let { data: existingGroup } = await supabase
      .from(groupTableName)
      .select('id')
      .eq('name', groupName)
      .maybeSingle();
    
    let groupId: string;
    
    if (!existingGroup) {
      const { data: newGroup, error: createError } = await supabase
        .from(groupTableName)
        .insert({
          name: groupName,
          description: `Auto-created group for ${intent} leads from Lead Intelligence`,
          created_by: userId
        })
        .select('id')
        .single();
      
      if (createError) {
        console.log(`[lead-intelligence] Could not create group: ${createError.message}`);
        return;
      }
      groupId = newGroup.id;
      console.log(`[lead-intelligence] Created group: ${groupName}`);
    } else {
      groupId = existingGroup.id;
    }
    
    // Add email to group (skip if duplicate)
    const { error: memberError } = await supabase
      .from(memberTableName)
      .upsert({
        group_id: groupId,
        email: email,
        added_by: userId,
        added_at: new Date().toISOString()
      }, {
        onConflict: 'group_id,email',
        ignoreDuplicates: true
      });
    
    if (memberError) {
      console.log(`[lead-intelligence] Could not add to group: ${memberError.message}`);
    } else {
      console.log(`[lead-intelligence] Added ${email} to group: ${groupName}`);
    }
    
  } catch (err) {
    console.log(`[lead-intelligence] Email group operation failed: ${err}`);
  }
}

async function handleSaveLeads(
  body: { 
    leads: Lead[]; 
    source_type: 'url' | 'text'; 
    source_value: string;
    summary?: string;
    model?: string;
  },
  supabase: ReturnType<typeof createClient>,
  userId: string,
  corsHeaders: Record<string, string>
) {
  const { leads, source_type, source_value, summary, model } = body;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return new Response(JSON.stringify({ error: 'No leads to save' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log(`[lead-intelligence] Saving ${leads.length} leads for user ${userId}`);

  let savedCount = 0;
  let duplicateCount = 0;
  const savedLeadsInfo: Array<{
    email: string | null;
    segment: string;
    intent: string;
    priority: string;
    tags: string[];
  }> = [];

  for (const lead of leads) {
    // Check for duplicates by email or phone
    let isDuplicate = false;

    if (lead.email) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('email', lead.email)
        .limit(1);
      
      if (existing && existing.length > 0) {
        isDuplicate = true;
      }
    }

    if (!isDuplicate && lead.phone) {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', lead.phone)
        .limit(1);
      
      if (existing && existing.length > 0) {
        isDuplicate = true;
      }
    }

    if (isDuplicate) {
      duplicateCount++;
      continue;
    }

    // Classify the lead
    const segment = classifySegment(lead, source_value);
    const intent = classifyIntent(lead.lead_score_0_100 || 0);
    const priority = getPriority(intent);
    const mergedTags = mergeTags(lead.tags || [], segment, intent);

    // Build enhanced metadata
    const enhancedMetadata = {
      name: lead.name,
      company: lead.company,
      role: lead.role,
      location: lead.location,
      lead_score: lead.lead_score_0_100,
      interest_level: lead.interest_level_0_10,
      segment: segment,
      intent: intent,
      priority: priority,
      tags: mergedTags,
      source_type: source_type,
      source_value: source_value,
      created_via: 'lead_intelligence',
      extracted_at: new Date().toISOString(),
    };

    // Insert lead with enhanced metadata
    const { data: insertedLead, error: insertError } = await supabase.from('leads').insert({
      session_id: crypto.randomUUID(),
      user_id: userId,
      email: lead.email || null,
      phone: lead.phone || null,
      interest_level: Math.min(10, Math.max(0, lead.interest_level_0_10 || 5)),
      recommended_plan: lead.recommended_plan || null,
      conversation_summary: lead.notes || summary || null,
      status: 'new',
      tags: mergedTags,
      metadata: enhancedMetadata,
    }).select('id').single();

    if (insertError) {
      console.error('[lead-intelligence] Insert error:', insertError);
    } else {
      savedCount++;
      savedLeadsInfo.push({
        email: lead.email,
        segment,
        intent,
        priority,
        tags: mergedTags
      });

      // Try to add to email group (optional, non-blocking)
      if (lead.email) {
        try {
          await tryAddToEmailGroup(supabase, userId, lead.email, intent);
        } catch (groupErr) {
          console.log('[lead-intelligence] Email group error (non-fatal):', groupErr);
        }
      }

      // Auto-enroll HOT leads into follow-up sequence (non-blocking)
      if (insertedLead && lead.email && intent === 'hot') {
        try {
          await enrollHotLeadInSequence(supabase, insertedLead.id);
        } catch (enrollErr) {
          console.log('[lead-intelligence] Sequence enrollment error (non-fatal):', enrollErr);
        }
      }
    }
  }

  // Create audit run
  const { data: runData, error: runError } = await supabase
    .from('lead_intelligence_runs')
    .insert({
      user_id: userId,
      source_type: source_type,
      source_value: source_value.substring(0, 2000), // Truncate long URLs/text
      extracted_count: leads.length,
      saved_count: savedCount,
      model: model || null,
      summary: summary?.substring(0, 1000) || null,
    })
    .select('id')
    .single();

  if (runError) {
    console.error('[lead-intelligence] Audit log error:', runError);
  }

  console.log(`[lead-intelligence] Saved ${savedCount}, duplicates ${duplicateCount}`);

  return new Response(JSON.stringify({
    saved: savedCount,
    duplicates: duplicateCount,
    run_id: runData?.id || null,
    saved_leads: savedLeadsInfo, // Return classification info for frontend
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Enroll a hot lead into the default follow-up sequence
async function enrollHotLeadInSequence(
  supabase: ReturnType<typeof createClient>,
  leadId: string
): Promise<void> {
  const DEFAULT_SEQUENCE_ID = '11111111-1111-1111-1111-111111111111';
  
  // Check if already enrolled
  const { data: existing } = await supabase
    .from('followup_enrollments')
    .select('id')
    .eq('lead_id', leadId)
    .eq('sequence_id', DEFAULT_SEQUENCE_ID)
    .maybeSingle();
  
  if (existing) {
    console.log('[lead-intelligence] Lead already enrolled in sequence');
    return;
  }
  
  // Create enrollment with immediate first send
  const { error: enrollError } = await supabase
    .from('followup_enrollments')
    .insert({
      sequence_id: DEFAULT_SEQUENCE_ID,
      lead_id: leadId,
      status: 'active',
      current_step: 1,
      enrolled_at: new Date().toISOString(),
      next_send_at: new Date().toISOString() // Immediate
    });
  
  if (enrollError) {
    console.error('[lead-intelligence] Enrollment error:', enrollError);
  } else {
    console.log('[lead-intelligence] Enrolled hot lead in follow-up sequence');
  }
}

async function handleGenerateIntro(
  lead: Lead,
  openAIApiKey: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log('[lead-intelligence] Generating intro email for lead:', lead?.company || lead?.name);

  if (!lead) {
    return new Response(JSON.stringify({ error: 'Lead data is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const systemPrompt = `You are a professional sales copywriter for LifeLink Sync, an emergency SOS and monitoring solution.
Write short, professional intro emails that:
- Are warm but not salesy
- Focus on the recipient's potential needs based on their role/company
- Mention LifeLink Sync's key benefits for their specific context
- End with a soft call-to-action asking if they'd like to learn more
- Are concise (100-150 words max)
- Use a professional yet approachable tone

LifeLink Sync features:
- Emergency SOS alerts with location sharing
- Family circles for connected safety
- Medical info storage for emergencies
- Works offline in critical situations
- Designed for seniors, families, and care organisations`;

  const userPrompt = `Write a professional intro email to introduce LifeLink Sync.

Recipient details:
- Company: ${lead.company || 'Not specified'}
- Name: ${lead.name || 'Not specified'}
- Role: ${lead.role || 'Decision maker'}
- Context: ${lead.notes || 'Potential interest in emergency/safety solutions'}

Write ONLY the email body text (no subject line, no greeting like "Dear X" at the very start - just the content). Keep it under 150 words.`;

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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[lead-intelligence] OpenAI error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to generate email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '';

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a subject line
    const subjectLine = lead.company 
      ? `Introducing LifeLink Sync - Safety Solutions for ${lead.company}`
      : 'Introducing LifeLink Sync - Emergency Safety Made Simple';

    console.log('[lead-intelligence] Email generated successfully');

    return new Response(JSON.stringify({
      subject: subjectLine,
      body: content,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[lead-intelligence] Generate intro error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate email' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
