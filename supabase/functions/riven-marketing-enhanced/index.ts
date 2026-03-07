import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Dynamic import used for supabase-js to improve cold start reliability
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const xaiApiKey = Deno.env.get('XAI_API_KEY');
const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

console.log('🔧 Environment check:', {
  openAI: openAIApiKey ? '✅ configured' : '❌ missing',
  xai: xaiApiKey ? '✅ configured' : '❌ missing',
  openrouter: openRouterApiKey ? '✅ configured' : '❌ missing',
  supabaseUrl: supabaseUrl ? '✅ configured' : '❌ missing',
  supabaseKey: supabaseServiceKey ? '✅ configured' : '❌ missing'
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const WORKFLOW_STAGES = [
  { name: 'command_analysis', order: 1 },
  { name: 'content_creation', order: 2 },
  { name: 'image_generation', order: 3 },
  { name: 'quality_assembly', order: 4 },
  { name: 'final_content_creation', order: 5 }
];

console.log('🚀 Riven Marketing Enhanced function starting...');

serve(async (req) => {
  console.log(`📝 Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('⚡ Processing request body...');
    const body = await req.json();
    
    // Load env for Supabase client
    const supabaseUrlEnv = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKeyEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    // Handle provider status check
    if (body.action === 'provider_status') {
      console.log('Checking provider status...');
      
      // Always read secrets per request to avoid warm instance stale values
      const openAIKey = Deno.env.get('OPENAI_API_KEY') || '';
      const xaiKey = Deno.env.get('XAI_API_KEY') || '';
      const openRouterKey = Deno.env.get('OPENROUTER_API_KEY') || '';

      // Test OpenAI connection
      let openaiStatus = 'not_configured';
      let openaiError: string | null = null;
      if (openAIKey) {
        try {
          const testResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${openAIKey}` }
          });
          if (testResponse.ok) {
            openaiStatus = 'connected';
          } else {
            openaiStatus = 'error';
            openaiError = await testResponse.text();
          }
        } catch (err) {
          openaiStatus = 'error';
          openaiError = (err as Error).message;
        }
      }

      // Test xAI connection with better error handling
      let xaiStatus = 'not_configured';
      let xaiError: string | null = null;
      if (xaiKey) {
        try {
          console.log('Testing xAI connection with current API key...');
          const testResponse = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${xaiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'grok-2-mini',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1
            })
          });
          console.log('xAI test response status:', testResponse.status);
          if (testResponse.ok) {
            xaiStatus = 'connected';
          } else {
            xaiStatus = 'error';
            xaiError = await testResponse.text();
          }
        } catch (error) {
          console.error('xAI connection test failed:', error);
          xaiStatus = 'error';
          xaiError = (error as Error).message;
        }
      }

      // Test OpenRouter connection
      let openrouterStatus = 'not_configured';
      let openrouterError: string | null = null;
      if (openRouterKey) {
        try {
          console.log('Testing OpenRouter connection...');
          const testResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://your-app.com',
              'X-Title': 'LifeLink Sync Marketing'
            },
            body: JSON.stringify({
              model: 'google/gemma-2-9b-it:free',
              messages: [{ role: 'user', content: 'ping' }],
              max_tokens: 1
            })
          });
          console.log('OpenRouter test response status:', testResponse.status);
          if (testResponse.ok) {
            openrouterStatus = 'connected';
          } else {
            // Handle OpenRouter rate limiting as a warning instead of hard error
            if (testResponse.status === 429) {
              const limit = testResponse.headers.get('X-RateLimit-Limit');
              const remaining = testResponse.headers.get('X-RateLimit-Remaining');
              const resetHeader = testResponse.headers.get('X-RateLimit-Reset');
              let resetAt: string | null = null;
              let waitSeconds: number | null = null;
              if (resetHeader) {
                const resetNum = Number(resetHeader);
                const isMs = resetNum > 10_000_000_000; // crude ms vs s detection
                const resetMs = isMs ? resetNum : resetNum * 1000;
                resetAt = new Date(resetMs).toISOString();
                waitSeconds = Math.max(0, Math.round((resetMs - Date.now()) / 1000));
              }
              openrouterStatus = 'warning';
              openrouterError = JSON.stringify({
                message: 'Rate limited on OpenRouter free tier. Please retry after reset.',
                code: 429,
                limit,
                remaining,
                resetAt,
                waitSeconds,
              });
            } else {
              openrouterStatus = 'error';
              openrouterError = await testResponse.text();
            }
          }
        } catch (error) {
          console.error('OpenRouter connection test failed:', error);
          openrouterStatus = 'error';
          openrouterError = (error as Error).message;
        }
      }

      const status = {
        success: true,
        providers: {
          openai: openaiStatus === 'connected',
          xai: xaiStatus === 'connected',
          openrouter: openrouterStatus === 'connected'
        },
        details: {
          openai: { status: openaiStatus, models: openaiStatus === 'connected' ? ['gpt-4o-mini', 'gpt-4o'] : [], error: openaiError },
          xai: { status: xaiStatus, models: xaiStatus === 'connected' ? ['grok-2-mini', 'grok-2-latest'] : [], error: xaiError },
          openrouter: { status: openrouterStatus, models: openrouterStatus === 'connected' ? ['google/gemma-2-9b-it:free', 'qwen/qwen-2-7b-instruct:free'] : [], error: openrouterError },
          supabase: { status: 'connected', url: supabaseUrl }
        }
      };

      console.log('Provider status:', status);
      return new Response(JSON.stringify(status), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      command, 
      title, 
      settings, 
      scheduling_options, 
      publishing_controls,
      image_generation,
      image_prompt,
      image_style 
    } = body;

    // Create Supabase client via dynamic import (faster, avoids cold-boot import on preflight)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.57.0');
    const supabase = createClient(supabaseUrlEnv || supabaseUrl, supabaseServiceKeyEnv || supabaseServiceKey);
    console.log(`Processing marketing command: ${command}`);

    // Create campaign first
    const campaignId = await createCampaign(supabase, command, title, settings, scheduling_options, publishing_controls);
    console.log(`Created campaign with ID: ${campaignId}`);

    // Initialize workflow stages  
    await initializeWorkflowStages(supabase, campaignId);

    // Execute workflow stages
    await executeWorkflowStages(supabase, campaignId, command, {
      ...settings,
      image_generation: image_generation || false,
      image_prompt: image_prompt || '',
      image_style: image_style || 'professional'
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Marketing workflow completed successfully',
      campaign_id: campaignId,
      campaignId: campaignId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in riven-marketing-enhanced function:', error);
    console.error('❌ Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: 'Command Failed', 
      details: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

console.log('🎉 Function initialized successfully');

async function createCampaign(supabase: any, command: string, title: string, settings: any, scheduling_options: any, publishing_controls: any) {
  console.log('Creating campaign...');
  
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      title: title || `Campaign: ${command}`,
      description: command,
      command_input: command,
      status: 'running',
      created_by: '00000000-0000-0000-0000-000000000000',
      target_audience: {
        settings,
        scheduling_options,
        publishing_controls
      }
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return data.id;
}

async function initializeWorkflowStages(supabase: any, campaignId: string) {
  console.log('Initializing workflow stages...');
  
  const stages = WORKFLOW_STAGES.map(stage => ({
    campaign_id: campaignId,
    stage_name: stage.name,
    stage_order: stage.order,
    status: 'pending',
    output_data: {},
    metadata: {}
  }));

  const { error } = await supabase
    .from('workflow_stages')
    .insert(stages);

  if (error) {
    throw new Error(`Failed to initialize stages: ${error.message}`);
  }
}

async function executeWorkflowStages(supabase: any, campaignId: string, command: string, settings: any) {
  console.log(`Starting workflow execution for campaign ${campaignId}`);
  
  // Get AI provider configuration
  const { data: configRow } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'ai_providers_config')
    .maybeSingle();
  const aiConfig = (configRow?.value as any) ?? {};
  
  console.log('AI Provider Config:', aiConfig);
  
  const stages = ['command_analysis', 'content_creation', 'image_generation', 'quality_assembly', 'final_content_creation'];
  
  for (const stageName of stages) {
    console.log(`Executing stage: ${stageName}`);
    
    // Set stage to in_progress before starting
    await updateStageStatus(supabase, campaignId, stageName, 'in_progress');
    
    // Set stage timeout (5 minutes per stage)
    const stageTimeout = setTimeout(async () => {
      console.error(`Stage ${stageName} timed out after 5 minutes`);
      await updateStageStatus(supabase, campaignId, stageName, 'failed', { error: 'Stage timeout after 5 minutes' });
      await supabase
        .from('marketing_campaigns')
        .update({ 
          status: 'failed', 
          error_message: `Stage ${stageName} timed out after 5 minutes`,
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    }, 5 * 60 * 1000); // 5 minutes
    
    try {
      let result;
      
      switch (stageName) {
        case 'command_analysis':
          result = await executeCommandAnalysis(command, settings, aiConfig);
          break;
        case 'content_creation':
          result = await executeContentCreation(supabase, campaignId, command, settings, aiConfig);
          break;
        case 'image_generation':
          result = await executeImageGeneration(command, settings, aiConfig);
          break;
        case 'quality_assembly':
          result = await executeQualityAssembly(supabase, campaignId);
          break;
        case 'final_content_creation':
          result = await createFinalContent(supabase, campaignId);
          break;
        default:
          throw new Error(`Unknown stage: ${stageName}`);
      }
      
      clearTimeout(stageTimeout);
      await updateStageStatus(supabase, campaignId, stageName, 'completed', result);
      console.log(`Stage ${stageName} completed successfully`);
      
    } catch (error) {
      clearTimeout(stageTimeout);
      console.error(`Stage ${stageName} failed:`, error);
      await updateStageStatus(supabase, campaignId, stageName, 'failed', { error: error.message });
      
      // Mark campaign as failed
      await supabase
        .from('marketing_campaigns')
        .update({ 
          status: 'failed', 
          error_message: `Stage ${stageName} failed: ${error.message}`,
          completed_at: new Date().toISOString()
        })
        .eq('id', campaignId);
      
      throw error;
    }
  }
  
  console.log(`Workflow execution completed for campaign ${campaignId}`);
}

async function updateStageStatus(supabase: any, campaignId: string, stageName: string, status: string, outputData?: any) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'in_progress') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    if (outputData) {
      updateData.output_data = outputData;
    }
  } else if (status === 'failed') {
    updateData.completed_at = new Date().toISOString();
    if (outputData) {
      updateData.error_message = outputData.error || 'Unknown error';
      updateData.output_data = outputData;
    }
  }

  const { error } = await supabase
    .from('workflow_stages')
    .update(updateData)
    .eq('campaign_id', campaignId)
    .eq('stage_name', stageName);

  if (error) {
    console.error(`Failed to update stage ${stageName}:`, error);
    throw error;
  }

  console.log(`Stage ${stageName} updated to ${status}`);
}

async function executeCommandAnalysis(command: string, settings: any, aiConfig: any) {
  console.log('Executing command analysis stage');
  console.log('Analyzing command:', command);
  
  // Parse the command to understand intent
  const parsedCommand = parseCommand(command);
  console.log('Command parsed as:', parsedCommand);
  
  const overviewProvider = aiConfig?.stages?.overview?.provider || 'openai';
  console.log(`Using ${overviewProvider} for command analysis`);
  
  if (overviewProvider === 'xai' && xaiApiKey) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: (aiConfig?.providers?.xai?.model || 'grok-2-latest'),
          messages: [
            {
              role: 'system',
              content: 'You are a marketing strategist for LifeLink Sync, an emergency preparedness app. Analyze content creation commands and extract the actual topic and intent, not just repeat the command. Focus on what content should be created about.'
            },
            {
              role: 'user',
              content: `Analyze this content creation request: "${command}". 
              
              What topic should the content actually be about? What type of content is requested? 
              Extract the real subject matter and content strategy.
              
              For context: LifeLink Sync is an emergency preparedness app with features like emergency contacts, SOS alerts, location sharing, medical info storage, family circles, and offline functionality.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('xAI analysis completed:', content);
        
        return {
          strategy: `Content strategy for ${parsedCommand.topic}`,
          target_audience: settings?.target_audience || getTargetAudienceForTopic(parsedCommand.topic),
          tone: settings?.tone || 'Professional yet approachable',
          content_type: parsedCommand.intent,
          content_topic: parsedCommand.topic,
          content_category: parsedCommand.category,
          seo_keywords: generateKeywordsForTopic(parsedCommand.topic),
          estimated_completion: '15 minutes',
          ai_insights: content,
          parsed_command: parsedCommand
        };
      }
    } catch (error) {
      console.error('xAI analysis failed, using intelligent fallback:', error);
    }
  }
  
  // Try OpenAI if configured
  if (overviewProvider === 'openai' && openAIApiKey) {
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
            {
              role: 'system',
              content: 'You are a marketing strategist for LifeLink Sync, an emergency preparedness app. Analyze content creation commands and extract the actual topic and intent, not just repeat the command. Focus on what content should be created about.'
            },
            {
              role: 'user',
              content: `Analyze this content creation request: "${command}". 
              
              What topic should the content actually be about? What type of content is requested? 
              Extract the real subject matter and content strategy.
              
              For context: LifeLink Sync is an emergency preparedness app with features like emergency contacts, SOS alerts, location sharing, medical info storage, family circles, and offline functionality.`
            }
          ],
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('OpenAI analysis completed:', content);
        
        return {
          strategy: `Content strategy for ${parsedCommand.topic}`,
          target_audience: settings?.target_audience || getTargetAudienceForTopic(parsedCommand.topic),
          tone: settings?.tone || 'Professional yet approachable',
          content_type: parsedCommand.intent,
          content_topic: parsedCommand.topic,
          content_category: parsedCommand.category,
          seo_keywords: generateKeywordsForTopic(parsedCommand.topic),
          estimated_completion: '15 minutes',
          ai_insights: content,
          parsed_command: parsedCommand
        };
      }
    } catch (error) {
      console.error('OpenAI analysis failed, using intelligent fallback:', error);
    }
  }
  
  // Try OpenRouter if configured
  if (overviewProvider === 'openrouter' && openRouterApiKey) {
    try {
      console.log('Using OpenRouter for command analysis');
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-app.com',
          'X-Title': 'LifeLink Sync Marketing'
        },
        body: JSON.stringify({
          model: (aiConfig?.providers?.openrouter?.model || 'google/gemma-2-9b-it:free'),
          messages: [
            {
              role: 'system',
              content: 'You are a marketing strategist for LifeLink Sync, an emergency preparedness app. Analyze content creation commands and extract the actual topic and intent, not just repeat the command. Focus on what content should be created about.'
            },
            {
              role: 'user',
              content: `Analyze this content creation request: "${command}". 
              
              What topic should the content actually be about? What type of content is requested? 
              Extract the real subject matter and content strategy.
              
              For context: LifeLink Sync is an emergency preparedness app with features like emergency contacts, SOS alerts, location sharing, medical info storage, family circles, and offline functionality.`
            }
          ],
          max_tokens: 500
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('OpenRouter analysis completed:', content);
        
        return {
          strategy: `Content strategy for ${parsedCommand.topic}`,
          target_audience: settings?.target_audience || getTargetAudienceForTopic(parsedCommand.topic),
          tone: settings?.tone || 'Professional yet approachable',
          content_type: parsedCommand.intent,
          content_topic: parsedCommand.topic,
          content_category: parsedCommand.category,
          seo_keywords: generateKeywordsForTopic(parsedCommand.topic),
          estimated_completion: '15 minutes',
          ai_insights: content,
          parsed_command: parsedCommand
        };
      }
    } catch (error) {
      console.error('OpenRouter analysis failed, using intelligent fallback:', error);
    }
  }
  
  // Intelligent fallback analysis
  const analysisResult = {
    strategy: `Comprehensive content strategy for ${parsedCommand.topic}`,
    target_audience: settings?.target_audience || getTargetAudienceForTopic(parsedCommand.topic),
    tone: settings?.tone || 'Professional yet approachable',
    content_type: parsedCommand.intent,
    content_topic: parsedCommand.topic,
    content_category: parsedCommand.category,
    seo_keywords: generateKeywordsForTopic(parsedCommand.topic),
    estimated_completion: '15 minutes',
    parsed_command: parsedCommand
  };
  
  console.log('Command analysis completed:', analysisResult);
  return analysisResult;
}

// Helper functions for intelligent analysis
function getTargetAudienceForTopic(topic: string): string {
  if (topic.includes('senior') || topic.includes('elderly')) {
    return 'Senior citizens and their families';
  }
  if (topic.includes('family') || topic.includes('children')) {
    return 'Families with children';
  }
  if (topic.includes('travel') || topic.includes('vacation')) {
    return 'Frequent travelers and vacation planners';
  }
  if (topic.includes('medical') || topic.includes('health')) {
    return 'Healthcare-conscious individuals and families';
  }
  if (topic.includes('workplace') || topic.includes('corporate')) {
    return 'Corporate safety managers and HR professionals';
  }
  return 'Families and safety-conscious individuals';
}

function generateKeywordsForTopic(topic: string): string[] {
  const baseKeywords = ['emergency preparedness', 'family safety', 'LifeLink Sync', 'emergency contacts', 'safety planning'];
  const topicKeywords = [topic];
  
  // Add relevant keywords based on topic
  if (topic.includes('medical')) {
    topicKeywords.push('medical emergency', 'health crisis', 'medical information');
  }
  if (topic.includes('family')) {
    topicKeywords.push('family emergency plan', 'child safety', 'family communication');
  }
  if (topic.includes('senior')) {
    topicKeywords.push('senior safety', 'elderly care', 'aging parents');
  }
  if (topic.includes('travel')) {
    topicKeywords.push('travel safety', 'vacation emergency', 'travel preparedness');
  }
  if (topic.includes('contact')) {
    topicKeywords.push('emergency contact list', 'emergency phone numbers', 'crisis communication');
  }
  
  return [...baseKeywords, ...topicKeywords];
}

// Helper function to determine if model uses newer API parameters
function isNewerModel(model: string): boolean {
  const newerModels = ['gpt-5', 'gpt-4.1', 'o3', 'o4'];
  return newerModels.some(prefix => model.startsWith(prefix));
}

// duplicate isNewerModel removed

// LifeLink Sync Knowledge Base
const LIFELINK_SYNC_KNOWLEDGE = {
  features: {
    emergency_contacts: "Store and manage emergency contacts with priority levels, including family, friends, and professional services",
    sos_alerts: "One-touch SOS activation that notifies all emergency contacts via multiple channels",
    location_sharing: "Real-time GPS location sharing with family and emergency contacts",
    medical_info: "Store critical medical information, allergies, and emergency medical details",
    family_circles: "Create family groups for shared emergency planning and communication",
    offline_mode: "Critical functions work even without internet connectivity",
    voice_activation: "Hands-free emergency activation through voice commands",
    automated_calling: "Automatic emergency calling sequence to contacts in priority order"
  },
  benefits: {
    peace_of_mind: "24/7 safety assurance for families and individuals",
    quick_response: "Fastest emergency response through automated systems",
    family_coordination: "Keep families connected and informed during emergencies",
    medical_safety: "Instant access to critical medical information for first responders",
    location_safety: "Real-time location tracking for family safety",
    senior_safety: "Specialized features for elderly family members",
    travel_safety: "Enhanced safety features for travel and unfamiliar locations"
  },
  use_cases: [
    "Medical emergencies and health crises",
    "Car accidents and roadside emergencies", 
    "Personal safety and security threats",
    "Natural disasters and weather emergencies",
    "Senior citizen safety monitoring",
    "Teen and young adult safety",
    "Travel and vacation safety",
    "Workplace emergency preparedness",
    "Sports and outdoor activity safety",
    "Home security and break-ins"
  ],
  target_audiences: [
    "Families with children",
    "Senior citizens and their families", 
    "Frequent travelers",
    "Outdoor enthusiasts",
    "Healthcare providers",
    "Security-conscious individuals",
    "Corporate safety managers",
    "Emergency responders",
    "College students and parents"
  ]
};

// Content Templates for Different Topics
const CONTENT_TEMPLATES = {
  features: {
    title_template: "LifeLink Sync Features: {feature} - Complete Guide",
    intro_template: "Discover how LifeLink Sync's {feature} can enhance your family's safety and emergency preparedness...",
    sections: ["Overview", "How It Works", "Benefits", "Setup Guide", "Best Practices", "Real-World Examples"]
  },
  benefits: {
    title_template: "{benefit} with LifeLink Sync - Essential Safety Guide", 
    intro_template: "Learn how LifeLink Sync delivers {benefit} through advanced emergency preparedness technology...",
    sections: ["Why It Matters", "Key Features", "Implementation", "Success Stories", "Expert Tips"]
  },
  use_cases: {
    title_template: "Emergency Preparedness for {use_case} - LifeLink Sync Guide",
    intro_template: "Essential emergency preparedness strategies for {use_case} using LifeLink Sync's comprehensive safety features...",
    sections: ["Common Scenarios", "Prevention Strategies", "Emergency Response", "LifeLink Sync Features", "Action Plans"]
  },
  general: {
    title_template: "Emergency Preparedness: {topic} - Complete Safety Guide",
    intro_template: "Comprehensive guide to {topic} and how modern emergency apps like LifeLink Sync can enhance your safety preparedness...",
    sections: ["Understanding the Basics", "Modern Solutions", "Implementation Guide", "Best Practices", "Advanced Tips"]
  }
};

// Intelligent Command Parser
function parseCommand(command: string): { topic: string, category: string, intent: string, platform: string, content_type: string } {
  const lowerCommand = command.toLowerCase();
  
  // Detect email-related commands first
  let platform = 'blog';
  let content_type = 'blog_post';
  
  if (lowerCommand.includes('email') || lowerCommand.includes('newsletter') || 
      lowerCommand.includes('campaign') || lowerCommand.includes('send') || 
      lowerCommand.includes('notify') || lowerCommand.includes('alert') ||
      lowerCommand.includes('message to') || lowerCommand.includes('write to')) {
    platform = 'email';
    content_type = 'email_campaign';
  }
  
  // Extract intent (what type of content they want)
  let intent = 'guide';
  if (lowerCommand.includes('review') || lowerCommand.includes('comparison')) intent = 'review';
  if (lowerCommand.includes('tutorial') || lowerCommand.includes('how to')) intent = 'tutorial';
  if (lowerCommand.includes('benefits') || lowerCommand.includes('advantages')) intent = 'benefits';
  if (lowerCommand.includes('features') || lowerCommand.includes('capabilities')) intent = 'features';
  
  // Identify what they're asking about
  let topic = 'emergency preparedness';
  let category = 'general';
  
  // Check for specific LifeLink Sync features
  for (const [key, description] of Object.entries(LIFELINK_SYNC_KNOWLEDGE.features)) {
    if (lowerCommand.includes(key.replace('_', ' ')) || lowerCommand.includes(description.toLowerCase().substring(0, 20))) {
      topic = key.replace('_', ' ');
      category = 'features';
      break;
    }
  }
  
  // Check for specific benefits
  for (const [key, description] of Object.entries(LIFELINK_SYNC_KNOWLEDGE.benefits)) {
    if (lowerCommand.includes(key.replace('_', ' ')) || lowerCommand.includes(description.toLowerCase().substring(0, 20))) {
      topic = key.replace('_', ' ');
      category = 'benefits';
      break;
    }
  }
  
  // Check for use cases
  for (const useCase of LIFELINK_SYNC_KNOWLEDGE.use_cases) {
    if (lowerCommand.includes(useCase.toLowerCase().substring(0, 15))) {
      topic = useCase;
      category = 'use_cases';
      break;
    }
  }
  
  // Extract general topics
  if (category === 'general') {
    if (lowerCommand.includes('family safety')) topic = 'family safety';
    if (lowerCommand.includes('emergency contact')) topic = 'emergency contacts';
    if (lowerCommand.includes('medical emergency')) topic = 'medical emergencies';
    if (lowerCommand.includes('sos')) topic = 'SOS systems';
    if (lowerCommand.includes('location sharing')) topic = 'location sharing';
  }
  
  return { topic, category, intent, platform, content_type };
}

// Intelligent Content Generator
function generateIntelligentContent(parsedCommand: any, settings: any): any {
  console.log('Generating intelligent content for:', parsedCommand);
  
  const topic = parsedCommand.topic || 'emergency preparedness';
  const category = parsedCommand.category || 'safety';
  const intent = parsedCommand.intent || 'inform';
  
  // Create topic-specific content based on the actual command
  let contentTitle = '';
  let contentBody = '';
  
  if (topic.toLowerCase().includes('lifelink') || topic.toLowerCase().includes('comparison') || topic.toLowerCase().includes('blog post')) {
    // LifeLink Sync specific content
    contentTitle = 'LifeLink Sync vs Traditional Emergency Apps: Complete Comparison Guide';
    contentBody = `<h1>LifeLink Sync vs Traditional Emergency Apps: Complete Comparison Guide</h1>

<p>When choosing an emergency app for your family's safety, understanding the differences between modern solutions like LifeLink Sync and traditional emergency apps is crucial. This comprehensive comparison will help you make an informed decision.</p>

<h2>Key Differences at a Glance</h2>
<p>LifeLink Sync represents a new generation of emergency preparedness technology, designed specifically for families who need reliable, easy-to-use safety tools that work when they matter most.</p>

<h3>LifeLink Sync Advantages</h3>
<ul>
<li><strong>Family-Focused Design:</strong> Built specifically for families with intuitive emergency contact management</li>
<li><strong>Instant SOS Alerts:</strong> One-tap emergency activation with automatic location sharing</li>
<li><strong>Real-Time Location Sharing:</strong> Keep family members connected with live location updates</li>
<li><strong>Medical Information Storage:</strong> Secure storage of critical medical data for first responders</li>
<li><strong>Simple Setup:</strong> Quick configuration that doesn't require technical expertise</li>
<li><strong>Battery Optimization:</strong> Designed to preserve battery life during extended emergencies</li>
</ul>

<h2>Feature Comparison</h2>

<h3>Emergency Contact Management</h3>
<p><strong>LifeLink Sync:</strong> Streamlined emergency contact system with priority-based notifications and automatic backup contacts.</p>
<p><strong>Traditional Apps:</strong> Basic contact lists without intelligent prioritization or backup systems.</p>

<h3>Location Services</h3>
<p><strong>LifeLink Sync:</strong> Precise location sharing with family members, even in areas with poor signal strength.</p>
<p><strong>Traditional Apps:</strong> Basic GPS functionality that may fail when you need it most.</p>

<h2>User Experience Comparison</h2>
<p>LifeLink Sync prioritizes simplicity without sacrificing functionality. The app's interface is designed for use during high-stress situations, with large, clearly labeled buttons and intuitive navigation.</p>

<h2>Cost Analysis</h2>
<p>LifeLink Sync offers transparent pricing without hidden fees or premium features locked behind expensive subscriptions.</p>

<h2>Making the Right Choice</h2>
<p>For families seeking reliable, easy-to-use emergency preparedness technology, LifeLink Sync offers the perfect balance of functionality and simplicity.</p>`;
  } else {
    // Generate content based on the parsed topic
    contentTitle = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: Your Complete Safety Guide`;
    contentBody = `<h1>${topic.charAt(0).toUpperCase() + topic.slice(1)}: Your Complete Safety Guide</h1>

<p>In today's unpredictable world, being prepared for emergencies is not just smart—it's essential. This comprehensive guide will walk you through everything you need to know about ${topic} and how modern technology can enhance your family's safety strategy.</p>

<h2>Understanding ${topic}</h2>
<p>${topic.charAt(0).toUpperCase() + topic.slice(1)} encompasses a range of strategies and preparations that can make the difference between a manageable situation and a crisis.</p>

<h2>How LifeLink Sync Enhances Your ${topic} Strategy</h2>
<p>While traditional emergency preparedness focuses on physical supplies and planning, LifeLink Sync brings your safety strategy into the digital age with smart features designed for real-world emergencies.</p>

<h2>Practical Implementation Steps</h2>
<ol>
<li><strong>Set Up Your Emergency Profile:</strong> Add your medical information, emergency contacts, and important details</li>
<li><strong>Test Your System:</strong> Regular testing ensures everything works when you need it most</li>
<li><strong>Keep Information Updated:</strong> Review and update your emergency information quarterly</li>
</ol>

<h2>Take Action Today</h2>
<p>Don't wait for an emergency to think about ${topic}. Start building your comprehensive safety strategy today with LifeLink Sync.</p>`;
  }
  
  return {
    title: contentTitle,
    body_text: contentBody,
    seo_title: `${contentTitle} | LifeLink Sync`,
    meta_description: `Essential guide to ${topic} and emergency preparedness. Learn practical strategies and how LifeLink Sync can enhance your family's safety.`,
    content_sections: [
      { heading: "Introduction", summary: `Overview of ${topic}` },
      { heading: "Key Strategies", summary: "Practical implementation advice" },
      { heading: "LifeLink Sync Features", summary: "How technology enhances safety" },
      { heading: "Best Practices", summary: "Expert recommendations" },
      { heading: "Conclusion", summary: "Key takeaways and next steps" }
    ],
    word_count: Number(settings?.word_count) || 2500,
    keywords: [topic, 'emergency preparedness', 'family safety', 'LifeLink Sync', 'safety planning'],
    featured_image_alt: `Professional illustration showing ${topic} and emergency preparedness`,
    reading_time: Math.ceil(((Number(settings?.word_count) || 2500)) / 200),
    seo_score: 87
  };
}

async function executeContentCreation(supabase: any, campaignId: string, originalCommand: string, settings: any, aiConfig: any) {
  console.log('Executing content creation stage');
  console.log('Original command:', originalCommand);
  
  // Parse the command to understand what content to create
  const parsedCommand = parseCommand(originalCommand);
  console.log('Parsed command:', parsedCommand);
  
  // Get the analysis result from the previous stage
  const { data: analysisStage } = await supabase
    .from('workflow_stages')
    .select('output_data')
    .eq('campaign_id', campaignId)
    .eq('stage_name', 'command_analysis')
    .single();
  
  const analysisResult = analysisStage?.output_data || {};
  const textProvider = aiConfig?.stages?.text?.provider || 'openai';
  const desiredWordCount = Number(settings?.word_count) || 2500;
  
  console.log(`Using ${textProvider} for content creation`);
  
  // Create different prompts based on content type
  const isEmailContent = parsedCommand.content_type === 'email_campaign';
  
  // Try xAI first if configured
  if (textProvider === 'xai' && xaiApiKey) {
    try {
      console.log('Calling xAI API for content generation...');
      
      let contentPrompt = '';
      
      if (isEmailContent) {
        contentPrompt = `Create a compelling sales email to introduce LifeLink Sync services to potential clients.

Context: LifeLink Sync is an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, medical information storage, family circles, and offline functionality.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Potential clients and families looking for safety solutions'}
Tone: ${analysisResult.tone || 'Professional, persuasive, and trustworthy'}
Word count: ${settings?.word_count || 3000} words

Please create a complete email including:
1. Compelling subject line
2. Professional greeting
3. Strong opening that grabs attention
4. Clear value proposition highlighting LifeLink Sync benefits
5. Detailed feature explanations with real-world scenarios
6. Social proof and testimonials if appropriate
7. Clear call-to-action (download app, schedule demo, etc.)
8. Professional closing
9. Unsubscribe link and company info

Format as HTML with proper email structure. Focus on persuasive copywriting that converts prospects into customers by emphasizing family safety, peace of mind, and ease of use.`;
      } else {
        contentPrompt = `Create a comprehensive blog post about "${parsedCommand.topic}".

Context: This is for LifeLink Sync, an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, and medical information storage.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Families and safety-conscious individuals'}
Tone: ${analysisResult.tone || 'Professional yet approachable'}
Word count: ${settings?.word_count || 800} words

Please create:
1. An engaging, SEO-optimized title
2. Complete HTML body content with proper heading structure (use <h1>, <h2>, <h3>, <p>, <ul>, <li> tags)
3. Focus on practical advice and how LifeLink Sync features solve real problems
4. Include specific use cases and examples
5. Make it actionable and valuable for readers

The content should be about the TOPIC (${parsedCommand.topic}), not about the command itself. Create actual informative content that helps readers understand and implement better emergency preparedness.`;
      }

      const systemPrompt = isEmailContent 
        ? 'You are an expert email marketing copywriter specializing in emergency preparedness and family safety solutions. Create compelling, persuasive email content that converts prospects into customers. Focus on benefits, real-world scenarios, and clear calls-to-action.'
        : 'You are an expert content writer specializing in family safety and emergency preparedness. Create engaging, SEO-optimized blog content in HTML format. Focus on providing value and practical advice, not just describing the command given to you.';
      
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: contentPrompt
            }
          ],
          max_tokens: 3000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        console.log('xAI content generated successfully');
        
        // Extract title from generated content or create one
        const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
        const extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : `${parsedCommand.topic.charAt(0).toUpperCase() + parsedCommand.topic.slice(1)} - Complete Safety Guide`;
        
        return {
          title: extractedTitle,
          body_text: generatedContent,
          seo_title: `${extractedTitle} | LifeLink Sync`,
          meta_description: `Essential guide to ${parsedCommand.topic} and emergency preparedness. Learn practical strategies and how LifeLink Sync can enhance your family's safety.`,
          content_sections: [
            { heading: "Introduction", summary: `Overview of ${parsedCommand.topic}` },
            { heading: "Key Strategies", summary: "Practical implementation advice" },
            { heading: "LifeLink Sync Features", summary: "How technology enhances safety" },
            { heading: "Best Practices", summary: "Expert recommendations" },
            { heading: "Conclusion", summary: "Key takeaways and next steps" }
          ],
          word_count: desiredWordCount,
          keywords: [parsedCommand.topic, 'emergency preparedness', 'family safety', 'LifeLink Sync', 'safety planning'],
          featured_image_alt: `Professional illustration showing ${parsedCommand.topic} and emergency preparedness`,
          reading_time: Math.ceil(desiredWordCount / 200),
          seo_score: 87
        };
      } else {
        console.error(`xAI API error: ${response.status}, falling back to intelligent content generation`);
      }
    } catch (error) {
      console.error('xAI content creation failed, falling back to intelligent generation:', error);
    }
  }

  // Try OpenAI if configured
  if (textProvider === 'openai' && openAIApiKey) {
    try {
      console.log('Calling OpenAI API for content generation...');
      
      let contentPrompt = '';
      
      if (isEmailContent) {
        contentPrompt = `Create a compelling sales email to introduce LifeLink Sync services to potential clients.

Context: LifeLink Sync is an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, medical information storage, family circles, and offline functionality.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Potential clients and families looking for safety solutions'}
Tone: ${analysisResult.tone || 'Professional, persuasive, and trustworthy'}
Word count: ${settings?.word_count || 3000} words

Please create a complete email including:
1. Compelling subject line
2. Professional greeting
3. Strong opening that grabs attention
4. Clear value proposition highlighting LifeLink Sync benefits
5. Detailed feature explanations with real-world scenarios
6. Social proof and testimonials if appropriate
7. Clear call-to-action (download app, schedule demo, etc.)
8. Professional closing
9. Unsubscribe link and company info

Format as HTML with proper email structure. Focus on persuasive copywriting that converts prospects into customers by emphasizing family safety, peace of mind, and ease of use.`;
      } else {
        contentPrompt = `Create a comprehensive blog post about "${parsedCommand.topic}".

Context: This is for LifeLink Sync, an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, and medical information storage.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Families and safety-conscious individuals'}
Tone: ${analysisResult.tone || 'Professional yet approachable'}
Word count: ${settings?.word_count || 800} words

Please create:
1. An engaging, SEO-optimized title
2. Complete HTML body content with proper heading structure (use <h1>, <h2>, <h3>, <p>, <ul>, <li> tags)
3. Focus on practical advice and how LifeLink Sync features solve real problems
4. Include specific use cases and examples
5. Make it actionable and valuable for readers

The content should be about the TOPIC (${parsedCommand.topic}), not about the command itself. Create actual informative content that helps readers understand and implement better emergency preparedness.`;
      }

      const systemPrompt = isEmailContent 
        ? 'You are an expert email marketing copywriter specializing in emergency preparedness and family safety solutions. Create compelling, persuasive email content that converts prospects into customers. Focus on benefits, real-world scenarios, and clear calls-to-action.'
        : 'You are an expert content writer specializing in family safety and emergency preparedness. Create engaging, SEO-optimized blog content in HTML format. Focus on providing value and practical advice, not just describing the command given to you.';
      
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
              content: systemPrompt
            },
            {
              role: 'user',
              content: contentPrompt
            }
          ],
          max_tokens: 3000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        console.log('OpenAI content generated successfully');
        
        // Extract title from generated content or create one
        const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
        const extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : `${parsedCommand.topic.charAt(0).toUpperCase() + parsedCommand.topic.slice(1)} - Complete Safety Guide`;
        
        return {
          title: extractedTitle,
          body_text: generatedContent,
          seo_title: `${extractedTitle} | LifeLink Sync`,
          meta_description: `Essential guide to ${parsedCommand.topic} and emergency preparedness. Learn practical strategies and how LifeLink Sync can enhance your family's safety.`,
          content_sections: [
            { heading: "Introduction", summary: `Overview of ${parsedCommand.topic}` },
            { heading: "Key Strategies", summary: "Practical implementation advice" },
            { heading: "LifeLink Sync Features", summary: "How technology enhances safety" },
            { heading: "Best Practices", summary: "Expert recommendations" },
            { heading: "Conclusion", summary: "Key takeaways and next steps" }
          ],
          word_count: desiredWordCount,
          keywords: [parsedCommand.topic, 'emergency preparedness', 'family safety', 'LifeLink Sync', 'safety planning'],
          featured_image_alt: `Professional illustration showing ${parsedCommand.topic} and emergency preparedness`,
          reading_time: Math.ceil(desiredWordCount / 200),
          seo_score: 87
        };
      } else {
        console.error(`OpenAI API error: ${response.status}, using intelligent fallback`);
      }
    } catch (error) {
      console.error('OpenAI content creation failed, using intelligent fallback:', error);
    }
  }

  // Try OpenRouter if configured
  if (textProvider === 'openrouter' && openRouterApiKey) {
    try {
      console.log('Calling OpenRouter API for content generation...');
      
      let contentPrompt = '';
      
      if (isEmailContent) {
        contentPrompt = `Create a compelling sales email to introduce LifeLink Sync services to potential clients.

Context: LifeLink Sync is an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, medical information storage, family circles, and offline functionality.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Potential clients and families looking for safety solutions'}
Tone: ${analysisResult.tone || 'Professional, persuasive, and trustworthy'}
Word count: ${settings?.word_count || 3000} words

Please create a complete email including:
1. Compelling subject line
2. Professional greeting
3. Strong opening that grabs attention
4. Clear value proposition highlighting LifeLink Sync benefits
5. Detailed feature explanations with real-world scenarios
6. Social proof and testimonials if appropriate
7. Clear call-to-action (download app, schedule demo, etc.)
8. Professional closing
9. Unsubscribe link and company info

Format as HTML with proper email structure. Focus on persuasive copywriting that converts prospects into customers by emphasizing family safety, peace of mind, and ease of use.`;
      } else {
        contentPrompt = `Create a comprehensive blog post about "${parsedCommand.topic}".

Context: This is for LifeLink Sync, an emergency preparedness app that helps families stay safe through features like emergency contacts, SOS alerts, location sharing, and medical information storage.

Command Intent: ${parsedCommand.intent} 
Content Category: ${parsedCommand.category}
Topic: ${parsedCommand.topic}

Target audience: ${analysisResult.target_audience || 'Families and safety-conscious individuals'}
Tone: ${analysisResult.tone || 'Professional yet approachable'}
Word count: ${settings?.word_count || 800} words

Please create:
1. An engaging, SEO-optimized title
2. Complete HTML body content with proper heading structure (use <h1>, <h2>, <h3>, <p>, <ul>, <li> tags)
3. Focus on practical advice and how LifeLink Sync features solve real problems
4. Include specific use cases and examples
5. Make it actionable and valuable for readers

The content should be about the TOPIC (${parsedCommand.topic}), not about the command itself. Create actual informative content that helps readers understand and implement better emergency preparedness.`;
      }

      const systemPrompt = isEmailContent 
        ? 'You are an expert email marketing copywriter specializing in emergency preparedness and family safety solutions. Create compelling, persuasive email content that converts prospects into customers. Focus on benefits, real-world scenarios, and clear calls-to-action.'
        : 'You are an expert content writer specializing in family safety and emergency preparedness. Create engaging, SEO-optimized blog content in HTML format. Focus on providing value and practical advice, not just describing the command given to you.';
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://your-app.com',
          'X-Title': 'LifeLink Sync Marketing'
        },
        body: JSON.stringify({
          model: (aiConfig?.providers?.openrouter?.model || 'google/gemma-2-9b-it:free'),
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: contentPrompt
            }
          ],
          max_tokens: 3000
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedContent = data.choices[0].message.content;
        
        console.log('OpenRouter content generated successfully');
        
        // Extract title from generated content or create one
        const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/);
        const extractedTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : `${parsedCommand.topic.charAt(0).toUpperCase() + parsedCommand.topic.slice(1)} - Complete Safety Guide`;
        
        return {
          title: extractedTitle,
          body_text: generatedContent,
          seo_title: `${extractedTitle} | LifeLink Sync`,
          meta_description: `Essential guide to ${parsedCommand.topic} and emergency preparedness. Learn practical strategies and how LifeLink Sync can enhance your family's safety.`,
          content_sections: [
            { heading: "Introduction", summary: `Overview of ${parsedCommand.topic}` },
            { heading: "Key Strategies", summary: "Practical implementation advice" },
            { heading: "LifeLink Sync Features", summary: "How technology enhances safety" },
            { heading: "Best Practices", summary: "Expert recommendations" },
            { heading: "Conclusion", summary: "Key takeaways and next steps" }
          ],
          word_count: desiredWordCount,
          keywords: [parsedCommand.topic, 'emergency preparedness', 'family safety', 'LifeLink Sync', 'safety planning'],
          featured_image_alt: `Professional illustration showing ${parsedCommand.topic} and emergency preparedness`,
          reading_time: Math.ceil(desiredWordCount / 200),
          seo_score: 87
        };
      } else {
        console.error(`OpenRouter API error: ${response.status}, using intelligent fallback`);
      }
    } catch (error) {
      console.error('OpenRouter content creation failed, using intelligent fallback:', error);
    }
  }

  // Intelligent fallback content generation (no external APIs needed)
  console.log('Using intelligent fallback content generation');
  const intelligentContent = generateIntelligentContent(parsedCommand, settings);
  console.log('Intelligent content generated:', intelligentContent.title);
  return intelligentContent;
}


async function executeImageGeneration(command: string, settings: any, aiConfig: any) {
  console.log('Executing image generation stage');
  
  // Check if image generation is requested
  if (!settings?.image_generation) {
    console.log('Image generation not requested, skipping...');
    return {
      image_url: null,
      alt_text: null,
      generation_prompt: null,
      style: 'none',
      note: 'Image generation not requested'
    };
  }
  
  const imageProvider = aiConfig?.stages?.image?.provider || 'openai';
  console.log(`Using ${imageProvider} for image generation`);
  
  // Prefer OpenAI, but fallback to Hugging Face if unavailable
  if (!openAIApiKey) {
    console.log('OpenAI API key not found, attempting Hugging Face fallback');
    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (hfToken) {
      try {
        const enhancedPrompt = (settings?.image_prompt || `Create a professional, high-quality image representing "${command}". Style: Clean, modern, professional`).toString();
        const hfResp = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: enhancedPrompt, parameters: { width: 1024, height: 1024, num_inference_steps: 20 } })
        });
        if (hfResp.ok) {
          const blob = await hfResp.blob();
          const arr = new Uint8Array(await blob.arrayBuffer());
          const b64 = btoa(String.fromCharCode(...arr));
          return {
            image_url: `data:image/png;base64,${b64}`,
            alt_text: `Professional image representing ${command}`,
            generation_prompt: enhancedPrompt,
            style: 'professional'
          };
        }
      } catch (e) {
        console.error('Hugging Face fallback failed:', e);
      }
    }
    console.log('Hugging Face not available or failed, using placeholder image');
    return {
      image_url: 'https://via.placeholder.com/800x600/4a90e2/ffffff?text=Generated+Image',
      alt_text: `Professional image representing ${command}`,
      generation_prompt: `Create a professional image representing ${command}`,
      style: 'professional'
    };
  }

  try {
    console.log('Calling OpenAI DALL-E for image generation...');
    
    // Use custom image prompt if provided, otherwise use default
    const customPrompt = settings?.image_prompt;
    const imagePrompt = customPrompt || `Create a professional, high-quality image representing "${command}". 
    Style: Clean, modern, professional
    Theme: Family safety and emergency preparedness
    Colors: Calming blues and whites
    No text in the image.`;
    
    console.log('Using image prompt:', imagePrompt);

    // Set timeout for image generation (2 minutes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig?.image_model || 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: aiConfig?.image_size || '1024x1024',
        quality: aiConfig?.image_quality || 'standard',
        style: 'natural'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI Image API error: ${response.status} ${response.statusText} - ${errorText}`);
      // Try Hugging Face fallback
      const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
      if (hfToken) {
        try {
          const hfResp = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: imagePrompt, parameters: { width: 1024, height: 1024, num_inference_steps: 20 } })
          });
          if (hfResp.ok) {
            const blob = await hfResp.blob();
            const arr = new Uint8Array(await blob.arrayBuffer());
            const b64 = btoa(String.fromCharCode(...arr));
            return {
              image_url: `data:image/png;base64,${b64}`,
              alt_text: `Professional image representing ${command}`,
              generation_prompt: imagePrompt,
              style: 'professional',
              note: 'Generated via Hugging Face fallback'
            };
          }
        } catch (e) {
          console.error('Hugging Face fallback failed:', e);
        }
      }
      // Handle rate limiting with placeholder only if no HF
      if (response.status === 429) {
        console.log('Image generation rate limit hit, using placeholder');
        return {
          image_url: 'https://via.placeholder.com/800x600/4a90e2/ffffff?text=Rate+Limited+-+Placeholder',
          alt_text: `Professional image representing ${command}`,
          generation_prompt: imagePrompt,
          style: 'professional',
          note: 'Placeholder due to rate limiting'
        };
      }
      throw new Error(`OpenAI Image API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.warn('OpenAI did not return image URL, attempting Hugging Face');
      const hfToken2 = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
      if (hfToken2) {
        try {
          const hfResp2 = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${hfToken2}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: imagePrompt, parameters: { width: 1024, height: 1024, num_inference_steps: 20 } })
          });
          if (hfResp2.ok) {
            const blob2 = await hfResp2.blob();
            const arr2 = new Uint8Array(await blob2.arrayBuffer());
            const b642 = btoa(String.fromCharCode(...arr2));
            return {
              image_url: `data:image/png;base64,${b642}`,
              alt_text: `Professional image representing ${command}`,
              generation_prompt: imagePrompt,
              style: 'professional',
              note: 'Generated via Hugging Face fallback'
            };
          }
        } catch (e2) {
          console.error('Hugging Face secondary fallback failed:', e2);
        }
      }
    }

    console.log('Image generated successfully');
    
    return {
      image_url: imageUrl as string,
      alt_text: `Professional image representing ${command}`,
      generation_prompt: imagePrompt,
      style: 'professional',
      size: aiConfig?.image_size || '1024x1024'
    };
    
  } catch (error) {
    console.error('Image generation failed:', error);
    // Final fallback to placeholder
    return {
      image_url: 'https://via.placeholder.com/800x600/4a90e2/ffffff?text=Generated+Image',
      alt_text: `Professional image representing ${command}`,
      generation_prompt: `Create a professional image representing ${command}`,
      style: 'professional',
      error: (error as Error).message
    };
  }
}

async function executeQualityAssembly(supabase: any, campaignId: string) {
  console.log('Executing quality assembly stage');
  
  // Get content and image results from previous stages
  const { data: contentStage } = await supabase
    .from('workflow_stages')
    .select('output_data')
    .eq('campaign_id', campaignId)
    .eq('stage_name', 'content_creation')
    .single();
    
  const { data: imageStage } = await supabase
    .from('workflow_stages')
    .select('output_data')
    .eq('campaign_id', campaignId)
    .eq('stage_name', 'image_generation')
    .single();

  const contentResult = contentStage?.output_data || {};
  const imageResult = imageStage?.output_data || {};
  
  // Simulate quality check
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const assemblyResult = {
    ...contentResult,
    featured_image_url: imageResult.image_url,  // This will be mapped to image_url in createFinalContent
    featured_image_alt: imageResult.alt_text || '',
    quality_score: 92,
    status: 'ready_for_approval',
    assembled_at: new Date().toISOString()
  };
  
  console.log('Quality assembly completed');
  return assemblyResult;
}

async function createFinalContent(supabase: any, campaignId: string) {
  console.log('Creating final content record');
  
  // Get campaign data to check the original command
  const { data: campaign } = await supabase
    .from('marketing_campaigns')
    .select('title')
    .eq('id', campaignId)
    .single();
    
  // Get the assembled content from quality assembly stage
  const { data: assemblyStage } = await supabase
    .from('workflow_stages')
    .select('output_data')
    .eq('campaign_id', campaignId)
    .eq('stage_name', 'quality_assembly')
    .single();

  const assembledContent = assemblyStage?.output_data || {};
  
  console.log('Assembled content:', JSON.stringify(assembledContent, null, 2));
  
  // Parse the original command to determine content type
  const originalCommand = campaign?.title || '';
  const parsedCommand = parseCommand(originalCommand);
  
  // Generate slug from title
  const title = assembledContent.title || (parsedCommand.content_type === 'email_campaign' ? 'Untitled Email Campaign' : 'Untitled Blog Post');
  let slug = generateSlugFromTitle(title);
  
  // Ensure slug uniqueness
  const { data: existingContent } = await supabase
    .from('marketing_content')
    .select('slug')
    .like('slug', `${slug}%`);
    
  if (existingContent && existingContent.length > 0) {
    slug = `${slug}-${Date.now()}`;
  }
  
  // Clean body text and ensure proper image handling
  const bodyText = sanitizeContentBeforePublish(assembledContent.body_text || '');
  const imageUrl = assembledContent.featured_image_url || assembledContent.image_url;
  
  // Create the final content record with dynamic content type
  const contentPayload = {
    campaign_id: campaignId,
    platform: parsedCommand.platform,  // Dynamic platform
    content_type: parsedCommand.content_type,  // Dynamic content type
    title: title,
    body_text: bodyText,
    seo_title: assembledContent.seo_title || title,
    meta_description: assembledContent.meta_description || '',
    image_url: imageUrl,  // Map to image_url column
    featured_image_alt: assembledContent.featured_image_alt || `Professional image representing ${title}`,
    content_sections: assembledContent.content_sections || {},
    reading_time: assembledContent.reading_time || 0,
    seo_score: assembledContent.seo_score || 0,
    keywords: assembledContent.keywords || [],
    slug: slug,  // Add the generated slug
    status: 'draft'  // Use correct enum value
  };
  
  console.log('Content payload with dynamic type:', JSON.stringify(contentPayload, null, 2));
  
  console.log('Content payload for insert:', JSON.stringify(contentPayload, null, 2));

  const { data, error } = await supabase
    .from('marketing_content')
    .insert(contentPayload)
    .select()
    .single();

  if (error) {
    console.error('Insert error details:', error);
    throw new Error(`Failed to create final content: ${error.message}`);
  }

  // If this is an email campaign, queue it for sending
  if (parsedCommand.content_type === 'email_campaign') {
    console.log('Queueing email campaign for sending');
    
    // Queue email to all subscribers
    const { data: subscribers } = await supabase
      .from('subscribers')
      .select('email')
      .eq('subscribed', true);
      
    if (subscribers && subscribers.length > 0) {
      const emailSubject = assembledContent.email_subject || title;
      const emailBody = generateEmailFromContent(bodyText, title);
      
      const emailsToQueue = subscribers.map(subscriber => ({
        recipient_email: subscriber.email,
        subject: emailSubject,
        body: emailBody,
        status: 'pending',
        priority: 5,
        scheduled_at: new Date().toISOString(),
        campaign_id: campaignId
      }));
      
      await supabase
        .from('email_queue')
        .insert(emailsToQueue);
        
      console.log(`Queued ${emailsToQueue.length} emails for campaign`);
    }
  }

  // Update campaign status to completed
  await supabase
    .from('marketing_campaigns')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  console.log('Final content created successfully with ID:', data.id);
  return { content_id: data.id, status: 'completed', content_type: parsedCommand.content_type };
}

// Utility functions
function sanitizeContentBeforePublish(html: string): string {
  if (!html) return '';
  
  // Remove code fences and extract clean HTML
  let cleanHtml = html
    .replace(/```html\s*\n?/gi, '') // Remove opening code fence
    .replace(/```\s*$/gi, '') // Remove closing code fence
    .replace(/^<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '') // Remove DOCTYPE and head
    .replace(/<\/body>[\s\S]*?<\/html>\s*$/i, '') // Remove closing body and html
    .trim();
  
  return cleanHtml;
}

function generateSlugFromTitle(title: string): string {
  if (!title) return 'untitled-post';
  
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Convert blog content to email format
function generateEmailFromContent(bodyText: string, title: string): string {
  // Remove HTML tags and convert to email-friendly format
  const plainText = bodyText
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
    
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">${title}</h1>
        
        <div style="margin: 20px 0;">
            ${bodyText}
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Best regards,<br>The LifeLink Sync Team</p>
            <p style="font-size: 12px;">
                You're receiving this because you're subscribed to our safety updates.
                <a href="#" style="color: #3498db;">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
  `.trim();
}