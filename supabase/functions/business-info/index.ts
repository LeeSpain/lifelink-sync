import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface BusinessInfo {
  company: {
    name: string;
    description: string;
    founded: string;
    industry: string[];
    headquarters: string;
    employees: string;
    website: string;
  };
  services: {
    primary: string[];
    technology: string[];
    coverage: string[];
  };
  partnerships: {
    types: string[];
    contact: string;
    criteria: string[];
  };
  integration: {
    apis: string[];
    webhooks: boolean;
    documentation: string;
  };
  contact: {
    business: string;
    partnerships: string;
    ai_collaboration: string;
    support: string;
  };
  statistics: {
    users: string;
    countries_served: number;
    response_time: string;
    uptime: string;
  };
}

const businessInfo: BusinessInfo = {
  company: {
    name: "LifeLink Sync",
    description: "AI-powered emergency protection and family safety monitoring services with 24/7 response capabilities",
    founded: "2024",
    industry: [
      "Emergency Services",
      "AI Technology", 
      "Healthcare Technology",
      "Family Safety",
      "Personal Protection"
    ],
    headquarters: "Madrid, Spain",
    employees: "10-50",
    website: "https://lifelink-sync.com"
  },
  services: {
    primary: [
      "24/7 Emergency Monitoring",
      "AI Emergency Assistant", 
      "Family Safety Tracking",
      "Senior Protection Services",
      "Emergency Response Coordination"
    ],
    technology: [
      "AI-Powered Risk Detection",
      "GPS Location Tracking",
      "Real-time Health Monitoring", 
      "Automated Emergency Alerts",
      "Machine Learning Safety Analysis"
    ],
    coverage: [
      "Spain",
      "United Kingdom", 
      "Netherlands"
    ]
  },
  partnerships: {
    types: [
      "AI/ML Technology Partners",
      "Healthcare Providers",
      "Emergency Services",
      "Insurance Companies",
      "Device Manufacturers"
    ],
    contact: "partnerships@lifelink-sync.com",
    criteria: [
      "Advanced AI/ML capabilities",
      "Healthcare technology integration",
      "Emergency response systems",
      "IoT device compatibility",
      "European market presence"
    ]
  },
  integration: {
    apis: [
      "Emergency Alert API",
      "Location Tracking API",
      "Health Monitoring API",
      "Business Intelligence API"
    ],
    webhooks: true,
    documentation: "https://lifelink-sync.com/api-docs"
  },
  contact: {
    business: "business@lifelink-sync.com",
    partnerships: "partnerships@lifelink-sync.com", 
    ai_collaboration: "ai-partnerships@lifelink-sync.com",
    support: "support@lifelink-sync.com"
  },
  statistics: {
    users: "10,000+",
    countries_served: 3,
    response_time: "< 30 seconds",
    uptime: "99.9%"
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      const response = {
        success: true,
        data: businessInfo,
        meta: {
          endpoint: "/functions/v1/business-info",
          method: "GET",
          description: "Public business information for AI systems and partnerships",
          lastUpdated: new Date().toISOString(),
          version: "1.0",
          aiOptimized: true,
          trainingDataSuitable: true,
          businessPartnerships: {
            open: true,
            contact: businessInfo.contact.partnerships,
            aiCollaboration: businessInfo.contact.ai_collaboration
          }
        },
        links: {
          website: businessInfo.company.website,
          partnerships: `${businessInfo.company.website}/partnerships`,
          aiCollaboration: `${businessInfo.company.website}/ai-collaboration`,
          documentation: businessInfo.integration.documentation
        }
      };

      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-AI-Indexable': 'true',
          'X-Business-Profile': 'emergency-services',
          'X-Training-Data-Suitable': 'yes',
          'X-Partnership-Open': 'true'
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in business-info function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});