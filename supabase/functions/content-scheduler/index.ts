import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchedulingRequest {
  action: 'schedule' | 'bulk_schedule' | 'get_schedule' | 'update_schedule' | 'cancel_schedule';
  contentIds?: string[];
  contentId?: string;
  scheduledTime?: string;
  platform?: string;
  timezone?: string;
  bulkScheduleData?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    startDate: string;
    endDate?: string;
    timeSlots: string[];
    platforms: string[];
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: SchedulingRequest = await req.json();
    console.log('Processing scheduling request:', request);

    let result;
    
    switch (request.action) {
      case 'schedule':
        result = await scheduleContent(request);
        break;
      case 'bulk_schedule':
        result = await bulkScheduleContent(request);
        break;
      case 'get_schedule':
        result = await getSchedule();
        break;
      case 'update_schedule':
        result = await updateSchedule(request);
        break;
      case 'cancel_schedule':
        result = await cancelSchedule(request);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content scheduler:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function scheduleContent(request: SchedulingRequest) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!request.contentId || !request.scheduledTime || !request.platform) {
    throw new Error('Missing required fields for scheduling');
  }

  // Add to posting queue
  const response = await fetch(`${supabaseUrl}/rest/v1/social_media_posting_queue`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      content_id: request.contentId,
      platform: request.platform,
      scheduled_time: request.scheduledTime,
      status: 'scheduled',
      retry_count: 0,
      max_retries: 3
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to schedule content: ${response.statusText}`);
  }

  // Update content status
  await fetch(`${supabaseUrl}/rest/v1/marketing_content?id=eq.${request.contentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      status: 'scheduled',
      scheduled_time: request.scheduledTime
    }),
  });

  return { scheduled: true, contentId: request.contentId, scheduledTime: request.scheduledTime };
}

async function bulkScheduleContent(request: SchedulingRequest) {
  if (!request.contentIds || !request.bulkScheduleData) {
    throw new Error('Missing data for bulk scheduling');
  }

  const { frequency, interval, startDate, endDate, timeSlots, platforms } = request.bulkScheduleData;
  const contentIds = request.contentIds;
  
  const scheduledItems = [];
  let currentDate = new Date(startDate);
  const finalDate = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
  
  let contentIndex = 0;
  let timeSlotIndex = 0;
  let platformIndex = 0;

  while (currentDate <= finalDate && contentIndex < contentIds.length) {
    const contentId = contentIds[contentIndex];
    const timeSlot = timeSlots[timeSlotIndex];
    const platform = platforms[platformIndex];
    
    // Create scheduled time
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const scheduledTime = new Date(currentDate);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // Skip if time is in the past
    if (scheduledTime > new Date()) {
      await scheduleContent({
        action: 'schedule',
        contentId,
        platform,
        scheduledTime: scheduledTime.toISOString()
      });

      scheduledItems.push({
        contentId,
        platform,
        scheduledTime: scheduledTime.toISOString()
      });
    }

    // Move to next content/platform/time slot
    contentIndex++;
    platformIndex = (platformIndex + 1) % platforms.length;
    
    // If we've used all platforms for this time slot, move to next time slot
    if (platformIndex === 0) {
      timeSlotIndex = (timeSlotIndex + 1) % timeSlots.length;
      
      // If we've used all time slots for this day, move to next day
      if (timeSlotIndex === 0) {
        switch (frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * interval));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            break;
        }
      }
    }
  }

  return { 
    scheduled: scheduledItems.length, 
    items: scheduledItems,
    message: `Successfully scheduled ${scheduledItems.length} items`
  };
}

async function getSchedule() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Get scheduled content for next 30 days
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/social_media_posting_queue?status=eq.scheduled&scheduled_time=lte.${thirtyDaysFromNow}&order=scheduled_time.asc&select=*,marketing_content(title,content_type,platform)`,
    {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.statusText}`);
  }

  const schedule = await response.json();
  
  // Group by date
  const groupedSchedule = schedule.reduce((acc: any, item: any) => {
    const date = new Date(item.scheduled_time).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {});

  return groupedSchedule;
}

async function updateSchedule(request: SchedulingRequest) {
  if (!request.contentId || !request.scheduledTime) {
    throw new Error('Missing required fields for schedule update');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Update in posting queue
  const response = await fetch(
    `${supabaseUrl}/rest/v1/social_media_posting_queue?content_id=eq.${request.contentId}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({
        scheduled_time: request.scheduledTime,
        updated_at: new Date().toISOString()
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update schedule: ${response.statusText}`);
  }

  // Update content table
  await fetch(`${supabaseUrl}/rest/v1/marketing_content?id=eq.${request.contentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      scheduled_time: request.scheduledTime
    }),
  });

  return { updated: true, contentId: request.contentId, newTime: request.scheduledTime };
}

async function cancelSchedule(request: SchedulingRequest) {
  if (!request.contentId) {
    throw new Error('Content ID required for cancellation');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  // Remove from posting queue
  const response = await fetch(
    `${supabaseUrl}/rest/v1/social_media_posting_queue?content_id=eq.${request.contentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to cancel schedule: ${response.statusText}`);
  }

  // Update content status
  await fetch(`${supabaseUrl}/rest/v1/marketing_content?id=eq.${request.contentId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      status: 'draft',
      scheduled_time: null
    }),
  });

  return { cancelled: true, contentId: request.contentId };
}

serve(handler);