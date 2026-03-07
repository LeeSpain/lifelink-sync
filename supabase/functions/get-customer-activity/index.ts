import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivityItem {
  id: string;
  timestamp: string;
  type: string;
  category: string;
  title: string;
  description: string;
  metadata?: any;
  user?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { customerId, limit = 50, offset = 0, category } = await req.json();

    if (!customerId) {
      return new Response(JSON.stringify({ error: 'Customer ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const activities: ActivityItem[] = [];

    // Fetch subscription history
    const { data: subHistory } = await supabaseClient
      .from('subscription_history')
      .select('*, profiles!subscription_history_changed_by_fkey(first_name, last_name)')
      .eq('user_id', customerId)
      .order('changed_at', { ascending: false })
      .limit(20);

    if (subHistory) {
      subHistory.forEach((item: any) => {
        activities.push({
          id: item.id,
          timestamp: item.changed_at,
          type: 'subscription',
          category: 'subscription',
          title: `Subscription ${item.action}`,
          description: item.reason || `Tier changed to ${item.new_tier}`,
          metadata: {
            action: item.action,
            old_tier: item.old_tier,
            new_tier: item.new_tier,
            old_end_date: item.old_end_date,
            new_end_date: item.new_end_date,
          },
          user: item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : 'System',
        });
      });
    }

    // Fetch customer notes
    const { data: notes } = await supabaseClient
      .from('customer_notes')
      .select('*, profiles!customer_notes_created_by_fkey(first_name, last_name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (notes) {
      notes.forEach((note: any) => {
        activities.push({
          id: note.id,
          timestamp: note.created_at,
          type: 'note',
          category: 'note',
          title: note.is_important ? '⭐ Important Note' : 'Note Added',
          description: note.note_text,
          user: note.profiles ? `${note.profiles.first_name} ${note.profiles.last_name}` : 'Unknown',
        });
      });
    }

    // Fetch security events
    const { data: secEvents } = await supabaseClient
      .from('security_events')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(15);

    if (secEvents) {
      secEvents.forEach((event: any) => {
        activities.push({
          id: event.id,
          timestamp: event.created_at,
          type: 'security',
          category: 'security',
          title: `Security Event: ${event.event_type}`,
          description: `Severity: ${event.severity}`,
          metadata: event.metadata,
        });
      });
    }

    // Fetch emergency contacts changes (using created_at as activity)
    const { data: contacts } = await supabaseClient
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (contacts) {
      contacts.forEach((contact: any) => {
        activities.push({
          id: contact.id,
          timestamp: contact.created_at,
          type: 'contact',
          category: 'contact',
          title: 'Emergency Contact Added',
          description: `Added ${contact.name} as ${contact.relationship || 'contact'}`,
          metadata: { name: contact.name, phone: contact.phone, type: contact.type },
        });
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply category filter if provided
    let filteredActivities = activities;
    if (category && category !== 'all') {
      filteredActivities = activities.filter(a => a.category === category);
    }

    // Apply pagination
    const paginatedActivities = filteredActivities.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        activities: paginatedActivities,
        total: filteredActivities.length,
        hasMore: filteredActivities.length > offset + limit,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching customer activity:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});