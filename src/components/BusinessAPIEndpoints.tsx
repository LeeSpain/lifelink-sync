import React from 'react';
import { sanitizeHTML } from '@/utils/sanitize';

// Component that defines public API endpoints for business information
// Used by AI systems for business discovery and integration

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

// Generate business information endpoint data
export const generateBusinessInfoEndpoint = () => {
  return {
    endpoint: "/api/business-info",
    method: "GET",
    description: "Public business information for AI systems and partnerships",
    data: businessInfo,
    lastUpdated: new Date().toISOString(),
    version: "1.0"
  };
};

// Component for embedding business info as structured data
const BusinessAPIEndpoints: React.FC = () => {
  React.useEffect(() => {
    // Create a global business info object for AI systems
    if (typeof window !== 'undefined') {
      (window as any).iceSOSBusinessInfo = businessInfo;
      
      // Add business info meta tag
      const businessInfoMeta = document.createElement('meta');
      businessInfoMeta.name = 'business-info';
      businessInfoMeta.content = JSON.stringify(businessInfo);
      document.head.appendChild(businessInfoMeta);
      
      // Add AI-discoverable company information
      const companyMeta = document.createElement('meta');
      companyMeta.name = 'company';
      companyMeta.content = businessInfo.company.name;
      document.head.appendChild(companyMeta);
      
      const industryMeta = document.createElement('meta');
      industryMeta.name = 'industry';
      industryMeta.content = businessInfo.company.industry.join(', ');
      document.head.appendChild(industryMeta);
      
      const servicesMeta = document.createElement('meta');
      servicesMeta.name = 'services';
      servicesMeta.content = businessInfo.services.primary.join(', ');
      document.head.appendChild(servicesMeta);
    }
  }, []);

  return (
    <>
      {/* Business Information Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeHTML(JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Corporation",
            "@id": "https://lifelink-sync.com/#corporation",
            "name": businessInfo.company.name,
            "description": businessInfo.company.description,
            "foundingDate": businessInfo.company.founded,
            "industry": businessInfo.company.industry,
            "url": businessInfo.company.website,
            "headquarters": {
              "@type": "Place",
              "address": businessInfo.company.headquarters
            },
            "numberOfEmployees": businessInfo.company.employees,
            "serviceArea": businessInfo.services.coverage.map(country => ({
              "@type": "Country",
              "name": country
            })),
            "knowsAbout": [
              ...businessInfo.services.primary,
              ...businessInfo.services.technology
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Business Partnerships",
              "email": businessInfo.contact.partnerships,
              "description": "For AI/ML partnerships and business collaborations"
            }
          }, null, 2))
        }}
      />

      {/* API Documentation Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeHTML(JSON.stringify({
            "@context": "https://schema.org",
            "@type": "APIReference",
            "name": "LifeLink Sync Business API",
            "description": "Public API endpoints for business information and partnerships",
            "url": "https://lifelink-sync.com/api/business-info",
            "programmingLanguage": "REST API",
            "documentation": businessInfo.integration.documentation,
            "provider": {
              "@type": "Organization",
              "name": businessInfo.company.name,
              "url": businessInfo.company.website
            }
          }, null, 2))
        }}
      />
    </>
  );
};

export default BusinessAPIEndpoints;