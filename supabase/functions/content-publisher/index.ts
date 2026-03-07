import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action, contentId, scheduledTime } = await req.json();

    switch (action) {
      case 'publish':
        return await publishContent(contentId, supabaseClient);
      case 'schedule':
        return await scheduleContent(contentId, scheduledTime, supabaseClient);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Content publisher error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function publishContent(contentId: string, supabase: any) {
  // Add to posting queue for immediate processing
  await supabase
    .from('posting_queue')
    .insert({
      content_id: contentId,
      scheduled_time: new Date().toISOString(),
      status: 'scheduled',
      platform: 'auto' // Will be determined from content
    });

  // Trigger posting processor
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/posting-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'post_now', contentId })
    });
    
    if (!response.ok) {
      console.error('Failed to trigger posting processor');
    }
  } catch (error) {
    console.error('Error triggering posting processor:', error);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function scheduleContent(contentId: string, scheduledTime: string, supabase: any) {
  // Get content platform
  const { data: content } = await supabase
    .from('marketing_content')
    .select('platform')
    .eq('id', contentId)
    .single();

  await supabase
    .from('posting_queue')
    .insert({
      content_id: contentId,
      scheduled_time: scheduledTime,
      platform: content?.platform || 'auto',
      status: 'scheduled'
    });

  // Update content status
  await supabase
    .from('marketing_content')
    .update({
      status: 'scheduled',
      scheduled_time: scheduledTime
    })
    .eq('id', contentId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}