import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoResponse {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude?: number;
  longitude?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    console.log(`🌍 Geo lookup request for IP: ${clientIP}`);

    // Call IP geolocation service
    const geoResponse = await fetch(`https://ipwho.is/${clientIP}`);
    const geoData = await geoResponse.json();

    console.log('📍 Geo API response:', geoData);

    if (!geoData.success && geoData.success !== undefined) {
      throw new Error(`Geo lookup failed: ${geoData.message || 'Unknown error'}`);
    }

    const locationData: GeoResponse = {
      ip: clientIP,
      country: geoData.country || 'Unknown',
      region: geoData.region || 'Unknown', 
      city: geoData.city || 'Unknown',
      latitude: geoData.latitude || undefined,
      longitude: geoData.longitude || undefined
    };

    console.log('✅ Successfully retrieved location data:', locationData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: locationData 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );

  } catch (error) {
    console.error('❌ Error in geo-lookup:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        data: {
          ip: 'unknown',
          country: 'Unknown',
          region: 'Unknown',
          city: 'Unknown'
        }
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});