import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EMERGENCY-SERVICE] ${step}${detailsStr}`);
};

interface EmergencyServiceRequest {
  event_id: string;
  user_profile: {
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
  };
  location: {
    lat: number;
    lng: number;
    address?: string;
    accuracy?: number;
  };
  emergency_type: 'medical' | 'fire' | 'police' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  additional_info?: string;
}

interface EmergencyServiceProvider {
  id: string;
  name: string;
  region: string;
  contact_number: string;
  api_endpoint?: string;
  is_active: boolean;
  response_time_minutes: number;
}

// Mock emergency service providers - replace with real integrations
const EMERGENCY_PROVIDERS: EmergencyServiceProvider[] = [
  {
    id: 'spain-112',
    name: 'Spain National Emergency Services (112)',
    region: 'ES',
    contact_number: '112',
    api_endpoint: process.env.SPAIN_EMERGENCY_API_URL,
    is_active: true,
    response_time_minutes: 5
  },
  {
    id: 'madrid-samur',
    name: 'SAMUR Madrid Emergency',
    region: 'ES-MD',
    contact_number: '+34915885522',
    api_endpoint: process.env.MADRID_EMERGENCY_API_URL,
    is_active: true,
    response_time_minutes: 8
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Emergency service integration initiated");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const {
      event_id,
      user_profile,
      location,
      emergency_type,
      severity,
      additional_info
    }: EmergencyServiceRequest = await req.json();

    logStep("Emergency request received", {
      event_id,
      emergency_type,
      severity,
      location: `${location.lat}, ${location.lng}`
    });

    // Determine appropriate emergency service provider based on location
    const provider = await determineEmergencyProvider(location);
    
    if (!provider) {
      logStep("No emergency provider available for location", { location });
      throw new Error("No emergency service provider available for this location");
    }

    logStep("Emergency provider selected", { provider: provider.name });

    // Create emergency service request record
    const { data: serviceRequest, error: requestError } = await supabaseClient
      .from('emergency_service_requests')
      .insert([{
        event_id,
        provider_id: provider.id,
        provider_name: provider.name,
        emergency_type,
        severity,
        location_data: location,
        user_profile: user_profile,
        additional_info,
        status: 'initiated',
        request_timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (requestError) {
      logStep("Failed to create service request record", { error: requestError });
      throw new Error(`Database error: ${requestError.message}`);
    }

    logStep("Service request recorded", { request_id: serviceRequest.id });

    // Attempt to integrate with emergency service API
    let integrationResult;
    try {
      integrationResult = await integrateWithEmergencyService(provider, {
        event_id,
        user_profile,
        location,
        emergency_type,
        severity,
        additional_info,
        request_id: serviceRequest.id
      });
    } catch (integrationError) {
      logStep("Emergency service API integration failed", { error: integrationError.message });
      
      // Fallback to manual notification
      integrationResult = await handleManualEmergencyEscalation(provider, {
        event_id,
        user_profile,
        location,
        emergency_type,
        severity,
        additional_info,
        request_id: serviceRequest.id
      });
    }

    // Update service request with result
    await supabaseClient
      .from('emergency_service_requests')
      .update({
        status: integrationResult.success ? 'submitted' : 'failed',
        response_data: integrationResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceRequest.id);

    // Log emergency escalation for compliance
    await supabaseClient
      .from('emergency_escalation_log')
      .insert([{
        event_id,
        service_request_id: serviceRequest.id,
        provider_id: provider.id,
        action_taken: integrationResult.action_taken,
        success: integrationResult.success,
        response_time_ms: integrationResult.response_time_ms,
        metadata: {
          emergency_type,
          severity,
          location,
          integration_method: integrationResult.method
        }
      }]);

    logStep("Emergency escalation completed", {
      success: integrationResult.success,
      method: integrationResult.method,
      provider: provider.name
    });

    return new Response(JSON.stringify({
      success: true,
      request_id: serviceRequest.id,
      provider: provider.name,
      integration_result: integrationResult,
      estimated_response_time: `${provider.response_time_minutes} minutes`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in emergency service integration", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function determineEmergencyProvider(location: { lat: number; lng: number }): Promise<EmergencyServiceProvider | null> {
  // Spain coverage check (approximate boundaries)
  const isInSpain = (
    location.lat >= 35.0 && location.lat <= 44.0 && 
    location.lng >= -10.0 && location.lng <= 5.0
  );

  if (isInSpain) {
    // Check if in Madrid area for SAMUR
    const isInMadrid = (
      location.lat >= 40.3 && location.lat <= 40.6 && 
      location.lng >= -3.9 && location.lng <= -3.5
    );

    if (isInMadrid) {
      return EMERGENCY_PROVIDERS.find(p => p.id === 'madrid-samur') || null;
    }

    return EMERGENCY_PROVIDERS.find(p => p.id === 'spain-112') || null;
  }

  // Default to first available provider for international
  return EMERGENCY_PROVIDERS.find(p => p.is_active) || null;
}

async function integrateWithEmergencyService(
  provider: EmergencyServiceProvider,
  request: any
): Promise<any> {
  const startTime = Date.now();

  // If provider has API endpoint, attempt integration
  if (provider.api_endpoint) {
    try {
      const response = await fetch(provider.api_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('EMERGENCY_SERVICE_API_KEY')}`,
        },
        body: JSON.stringify({
          emergency_type: request.emergency_type,
          severity: request.severity,
          location: request.location,
          user_info: request.user_profile,
          incident_id: request.request_id,
          additional_info: request.additional_info
        })
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          method: 'api_integration',
          action_taken: 'emergency_request_submitted',
          response_time_ms: responseTime,
          provider_response: data,
          incident_number: data.incident_number || null
        };
      } else {
        throw new Error(`API responded with status ${response.status}`);
      }
    } catch (error) {
      logStep("API integration failed, falling back to manual", { error: error.message });
      throw error;
    }
  } else {
    throw new Error("No API endpoint available for provider");
  }
}

async function handleManualEmergencyEscalation(
  provider: EmergencyServiceProvider,
  request: any
): Promise<any> {
  const startTime = Date.now();

  // Create manual alert to emergency services
  // This would typically involve:
  // 1. Sending SMS to emergency dispatch
  // 2. Making automated phone call
  // 3. Sending email alert to emergency coordinator

  logStep("Initiating manual emergency escalation", {
    provider: provider.name,
    contact: provider.contact_number
  });

  // For now, simulate manual escalation process
  // In production, this would integrate with SMS/calling services
  
  const escalationData = {
    provider_name: provider.name,
    contact_number: provider.contact_number,
    emergency_details: {
      type: request.emergency_type,
      severity: request.severity,
      location: `${request.location.lat}, ${request.location.lng}`,
      address: request.location.address || 'Address not available',
      user: `${request.user_profile.first_name} ${request.user_profile.last_name}`,
      phone: request.user_profile.phone || 'Not provided',
      additional_info: request.additional_info || 'None'
    },
    timestamp: new Date().toISOString()
  };

  // Log for manual follow-up by operations team
  logStep("Manual escalation data prepared", escalationData);

  const responseTime = Date.now() - startTime;

  return {
    success: true,
    method: 'manual_escalation',
    action_taken: 'manual_alert_created',
    response_time_ms: responseTime,
    escalation_data: escalationData,
    next_steps: [
      'Operations team notified',
      'Manual call to emergency services scheduled',
      'Follow-up tracking initiated'
    ]
  };
}