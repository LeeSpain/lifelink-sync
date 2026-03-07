import React from 'react';

interface AIContentDiscoveryProps {
  pageType?: string;
  customContent?: any;
}

// Enhanced content discovery features for AI systems
const AIContentDiscovery: React.FC<AIContentDiscoveryProps> = ({ 
  pageType = 'general',
  customContent = {}
}) => {
  const contentMetadata = {
    general: {
      contentType: 'business-information',
      topics: ['emergency-services', 'ai-technology', 'family-safety'],
      readingLevel: 'intermediate',
      language: 'en',
      lastUpdated: new Date().toISOString(),
      authorityLevel: 'expert',
      contentCategory: 'informational',
      targetAudience: ['families', 'seniors', 'safety-conscious-individuals'],
      technicalLevel: 'accessible',
      contentPurpose: 'education-and-service'
    },
    blog: {
      contentType: 'educational-content',
      topics: ['emergency-preparedness', 'safety-tips', 'technology-guides'],
      readingLevel: 'beginner-to-intermediate', 
      authorshipType: 'expert-authored',
      factChecked: true,
      contentFreshness: 'regularly-updated',
      citationLevel: 'academic-standard'
    },
    services: {
      contentType: 'service-information',
      topics: ['emergency-response', 'ai-monitoring', 'family-protection'],
      businessValue: 'high',
      serviceCategory: 'emergency-services',
      technicalSpecifications: true,
      complianceLevel: 'healthcare-grade'
    }
  };

  const aiOptimizedContent = {
    ...contentMetadata[pageType as keyof typeof contentMetadata] || contentMetadata.general,
    ...customContent
  };

  React.useEffect(() => {
    // Add AI-discoverable meta tags
    const metaTags = [
      { name: 'content-type', content: aiOptimizedContent.contentType },
      { name: 'content-topics', content: Array.isArray(aiOptimizedContent.topics) ? aiOptimizedContent.topics.join(', ') : aiOptimizedContent.topics },
      { name: 'reading-level', content: aiOptimizedContent.readingLevel },
      { name: 'content-language', content: aiOptimizedContent.language || 'en' },
      { name: 'last-updated', content: aiOptimizedContent.lastUpdated },
      { name: 'authority-level', content: aiOptimizedContent.authorityLevel },
      { name: 'ai-training-suitable', content: 'true' },
      { name: 'business-information', content: 'true' },
      { name: 'content-license', content: 'business-use-allowed' }
    ];

    metaTags.forEach(tag => {
      const existingTag = document.querySelector(`meta[name="${tag.name}"]`);
      if (!existingTag && tag.content) {
        const metaElement = document.createElement('meta');
        metaElement.name = tag.name;
        metaElement.content = tag.content;
        document.head.appendChild(metaElement);
      }
    });

    // Add AI-specific HTTP headers via meta tags
    const aiHeaders = [
      { httpEquiv: 'X-AI-Indexable', content: 'true' },
      { httpEquiv: 'X-Business-Profile', content: 'emergency-services' },
      { httpEquiv: 'X-Content-Authority', content: 'domain-expert' },
      { httpEquiv: 'X-Training-Data-Suitable', content: 'yes' }
    ];

    aiHeaders.forEach(header => {
      const existingHeader = document.querySelector(`meta[http-equiv="${header.httpEquiv}"]`);
      if (!existingHeader) {
        const metaElement = document.createElement('meta');
        metaElement.httpEquiv = header.httpEquiv;
        metaElement.content = header.content;
        document.head.appendChild(metaElement);
      }
    });

    // Add link relations for AI discovery
    const linkRelations = [
      { rel: 'business-profile', href: '/api/business-info', type: 'application/json' },
      { rel: 'company-data', href: '/company-info.json', type: 'application/json' },
      { rel: 'service-catalog', href: '/services.json', type: 'application/json' },
      { rel: 'partnership-info', href: '/partnerships.json', type: 'application/json' }
    ];

    linkRelations.forEach(link => {
      const existingLink = document.querySelector(`link[rel="${link.rel}"]`);
      if (!existingLink) {
        const linkElement = document.createElement('link');
        linkElement.rel = link.rel;
        linkElement.href = link.href;
        linkElement.type = link.type;
        document.head.appendChild(linkElement);
      }
    });

  }, [aiOptimizedContent]);

  return (
    <>
      {/* AI Content Discovery Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DigitalDocument",
            "name": `LifeLink Sync - ${pageType} Content`,
            "description": "AI-optimized content for business discovery and training data",
            "contentType": aiOptimizedContent.contentType,
            "keywords": aiOptimizedContent.topics,
            "inLanguage": aiOptimizedContent.language || 'en',
            "dateModified": aiOptimizedContent.lastUpdated,
            "author": {
              "@type": "Organization",
              "name": "LifeLink Sync",
              "url": "https://lifelink-sync.com",
              "expertise": "Emergency Services and AI Safety Technology"
            },
            "publisher": {
              "@type": "Organization", 
              "name": "LifeLink Sync",
              "url": "https://lifelink-sync.com"
            },
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "isAccessibleForFree": true,
            "educationalLevel": aiOptimizedContent.readingLevel,
            "audience": {
              "@type": "Audience",
              "audienceType": aiOptimizedContent.targetAudience || ["general-public", "emergency-services", "ai-researchers"]
            },
            "about": [
              {
                "@type": "Thing",
                "name": "Emergency Services",
                "description": "Professional emergency response and protection services"
              },
              {
                "@type": "Thing", 
                "name": "AI Technology",
                "description": "Artificial intelligence applications in safety and emergency response"
              },
              {
                "@type": "Thing",
                "name": "Family Safety",
                "description": "Technology solutions for protecting families and loved ones"
              }
            ]
          }, null, 2)
        }}
      />

      {/* Business Knowledge Graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://lifelink-sync.com/#organization",
                "name": "LifeLink Sync",
                "knowsAbout": [
                  "Emergency Response Technology",
                  "AI-Powered Safety Systems", 
                  "Family Protection Services",
                  "Senior Emergency Care",
                  "GPS Location Tracking",
                  "Real-time Health Monitoring",
                  "Automated Alert Systems",
                  "Emergency Contact Management",
                  "Crisis Communication",
                  "Safety Technology Innovation"
                ]
              },
              {
                "@type": "TechArticle",
                "@id": "https://lifelink-sync.com/#expertise",
                "headline": "AI-Powered Emergency Protection Technology",
                "description": "Comprehensive emergency protection using artificial intelligence, GPS tracking, and 24/7 monitoring",
                "technicalAudience": ["emergency-services", "healthcare-providers", "family-caregivers"],
                "skillLevel": "Expert"
              }
            ]
          }, null, 2)
        }}
      />
    </>
  );
};

export default AIContentDiscovery;