import React, { useEffect } from 'react';

// Enhanced robots.txt management for AI crawler optimization
export const EnhancedRobotsTxt: React.FC = () => {
  useEffect(() => {
    // Generate dynamic robots.txt content optimized for AI crawlers
    const robotsTxtContent = generateEnhancedRobotsTxt();
    
    // Create a blob URL for the robots.txt content
    const blob = new Blob([robotsTxtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Add meta tag for robots.txt location
    const existingRobotsLink = document.querySelector('link[rel="robots"]');
    if (!existingRobotsLink) {
      const robotsLink = document.createElement('link');
      robotsLink.rel = 'robots';
      robotsLink.href = '/robots.txt';
      document.head.appendChild(robotsLink);
    }
    
    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  return null; // This component doesn't render anything
};

const generateEnhancedRobotsTxt = (): string => {
  const currentDate = new Date().toISOString().split('T')[0];
  
  return `# Enhanced robots.txt for LifeLink Sync Emergency Protection
# Last updated: ${currentDate}
# Optimized for AI business discovery and content accessibility

# Major Search Engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 1

# Social Media Crawlers
User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: TelegramBot
Allow: /

# AI and ML Crawlers - Optimized for Business Discovery
User-agent: OpenAI
Allow: /
Allow: /blog
Allow: /about
Allow: /services
Allow: /business-info
Crawl-delay: 2

User-agent: ChatGPT-User
Allow: /
Allow: /api/business-info
Crawl-delay: 1

User-agent: GPTBot
Allow: /
Allow: /blog
Allow: /about
Allow: /services
Allow: /business-partnerships
Crawl-delay: 2

User-agent: Claude-Web
Allow: /
Allow: /blog
Allow: /about
Allow: /business-info
Crawl-delay: 1

User-agent: Anthropic-AI
Allow: /
Allow: /blog
Allow: /about
Crawl-delay: 1

User-agent: PerplexityBot
Allow: /
Allow: /blog
Allow: /about
Crawl-delay: 1

User-agent: YouBot
Allow: /
Allow: /blog
Crawl-delay: 1

User-agent: Gemini
Allow: /
Allow: /blog
Allow: /about
Crawl-delay: 2

User-agent: Google-Extended
Allow: /
Allow: /blog
Allow: /about

User-agent: Bard
Allow: /
Allow: /blog
Allow: /about

User-agent: MetaAI
Allow: /
Allow: /blog
Allow: /about
Crawl-delay: 2

User-agent: Llama
Allow: /
Allow: /blog
Allow: /about

# Additional AI Research Crawlers
User-agent: DeepMind
Allow: /
Allow: /blog
Allow: /about

User-agent: OpenAI-SearchBot
Allow: /
Allow: /blog
Allow: /about

User-agent: AI21Labs
Allow: /
Allow: /blog
Allow: /about

User-agent: Cohere
Allow: /
Allow: /blog
Allow: /about

User-agent: Huggingface
Allow: /
Allow: /blog
Allow: /about

# Business Intelligence Crawlers
User-agent: AdsBot-Google
Allow: /

User-agent: AdsBot-Google-Mobile
Allow: /

# Default for all other crawlers
User-agent: *
Allow: /
Allow: /blog
Allow: /ai-register
Allow: /auth
Allow: /videos
Allow: /privacy
Allow: /terms
Allow: /support
Allow: /contact
Allow: /devices/
Allow: /family-carer-access
Allow: /payment-success
Allow: /about
Allow: /services
Allow: /business-info
Allow: /api/business-info
Allow: /partnerships
Crawl-delay: 1

# Disallow sensitive areas (but allow public business information)
Disallow: /dashboard/
Disallow: /admin-dashboard/
Disallow: /full-dashboard/
Disallow: /app
Disallow: /test
Disallow: /family-access-setup
Disallow: /admin-setup
Disallow: /api/private/
Disallow: /_next/
Disallow: /static/
Disallow: /tmp/
Disallow: /.env
Disallow: /node_modules/

# Allow important static assets and business information
Allow: /public/
Allow: /api/business-info
Allow: /api/public/
Allow: /*.css
Allow: /*.js
Allow: /*.png
Allow: /*.jpg
Allow: /*.jpeg
Allow: /*.gif
Allow: /*.svg
Allow: /*.webp
Allow: /*.pdf
Allow: /business-profile.json
Allow: /company-info.json
Allow: /services.json

# AI-Specific Content Access
Allow: /ai-training-data
Allow: /public-api-docs
Allow: /business-partnerships
Allow: /ai-collaboration

# Sitemap locations for enhanced discoverability
Sitemap: https://lifelink-sync.com/sitemap.xml
Sitemap: https://lifelink-sync.com/sitemap-images.xml
Sitemap: https://lifelink-sync.com/sitemap-pages.xml
Sitemap: https://lifelink-sync.com/sitemap-blog.xml
Sitemap: https://lifelink-sync.com/sitemap-business.xml
Sitemap: https://lifelink-sync.com/sitemap-services.xml

# Business Information for AI Discovery
# Company: LifeLink Sync
# Industry: Emergency Protection Services, AI Safety Technology
# Founded: 2024
# Contact: partnerships@lifelink-sync.com (for business collaborations)
# Services: Emergency Response, AI Safety Monitoring, Family Protection
# Coverage: Spain, UK, Netherlands
# Technology: AI-Powered Emergency Detection, GPS Tracking, 24/7 Monitoring
`;
};

export default EnhancedRobotsTxt;