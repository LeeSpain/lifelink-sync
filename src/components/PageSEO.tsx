import React from 'react';
import { SEO } from './SEO';

interface PageSEOProps {
  pageType: 'home' | 'register' | 'auth' | 'dashboard' | 'support' | 'contact' | 'privacy' | 'terms' | 'sos' | 'devices' | 'regional' | 'family' | 'admin' | 'videos' | 'ai-register' | 'payment-success' | 'map-demo' | 'test-registration' | 'emergency-response-services' | 'ai-emergency-assistant' | 'family-safety-monitoring' | 'senior-emergency-protection';
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  customImage?: string;
  locale?: string;
}

const getPageSEO = (pageType: PageSEOProps['pageType']) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com';
  
  const seoConfig: Record<string, any> = {
    home: {
      title: 'LifeLink Sync - AI-Powered Emergency Protection & 24/7 Safety Monitoring',
      description: 'Advanced emergency protection with AI assistant, GPS tracking, and 24/7 monitoring. Instant SOS alerts, family notifications, and professional emergency response worldwide.',
      keywords: ['emergency protection', 'AI safety assistant', 'SOS service', 'GPS tracking', '24/7 monitoring', 'personal safety', 'emergency response', 'safety app', 'emergency alert system', 'AI emergency assistance'],
      image: '/lovable-uploads/lifelink-sync-og.png',
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "LifeLink Sync",
        "alternateName": "LifeLink Sync Emergency Protection",
        "url": baseUrl,
        "description": "AI-powered emergency protection service with 24/7 monitoring and instant SOS alerts",
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        },
        "sameAs": [
          "https://facebook.com/lifelinksync",
          "https://twitter.com/lifelinksync",
          "https://linkedin.com/company/lifelinksync"
        ]
      }
    },
    register: {
      title: 'Register for LifeLink Sync - Free Emergency Protection Service',
      description: 'Create your free LifeLink Sync account and get instant access to AI-powered emergency protection, GPS tracking, and 24/7 safety monitoring.',
      keywords: ['register emergency protection', 'sign up safety service', 'free emergency app', 'create safety account', 'emergency protection registration'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Register - LifeLink Sync",
        "description": "Create your emergency protection account"
      }
    },
    auth: {
      title: 'Sign In to LifeLink Sync - Access Your Emergency Protection Dashboard',
      description: 'Sign in to your LifeLink Sync account to access your emergency protection dashboard, manage settings, and view your safety status.',
      keywords: ['sign in emergency protection', 'login safety service', 'emergency dashboard access', 'safety account login'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Sign In - LifeLink Sync",
        "description": "Access your emergency protection account"
      }
    },
    dashboard: {
      title: 'Emergency Protection Dashboard - LifeLink Sync',
      description: 'Manage your emergency protection settings, view safety status, configure alerts, and access AI assistant from your secure dashboard.',
      keywords: ['emergency dashboard', 'safety settings', 'protection management', 'AI assistant access', 'emergency configuration']
    },
    support: {
      title: 'Support & Help Center - LifeLink Sync Emergency Protection',
      description: 'Get help with LifeLink Sync emergency protection service. Find answers, contact support, and learn how to maximize your safety.',
      keywords: ['emergency protection support', 'safety service help', 'LifeLink Sync assistance', 'emergency app help', 'safety support'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does LifeLink Sync emergency protection work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "LifeLink Sync provides 24/7 emergency monitoring with AI assistance, GPS tracking, and instant alerts to emergency contacts and response teams."
            }
          }
        ]
      }
    },
    contact: {
      title: 'Contact LifeLink Sync - Emergency Protection Support & Sales',
      description: 'Contact LifeLink Sync for emergency protection support, sales inquiries, or partnership opportunities. 24/7 support available.',
      keywords: ['contact emergency protection', 'LifeLink Sync support', 'emergency service contact', 'safety service inquiries'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        "name": "Contact LifeLink Sync",
        "description": "Get in touch with our emergency protection team"
      }
    },
    sos: {
      title: 'Emergency SOS Service - Instant Help & Protection | LifeLink Sync',
      description: 'Instant emergency SOS service with AI assistance, GPS location sharing, and immediate response. Get help when you need it most.',
      keywords: ['emergency SOS', 'instant emergency help', 'emergency button', 'panic button', 'emergency assistance', 'immediate help'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "EmergencyService",
        "name": "LifeLink Sync Emergency Service",
        "description": "Instant emergency response and assistance",
        "serviceType": "Emergency Response"
      }
    },
    devices: {
      title: 'Emergency Protection Devices - Smart Safety Equipment | LifeLink Sync',
      description: 'Professional emergency protection devices with GPS tracking, panic buttons, and AI monitoring. Shop smart safety equipment.',
      keywords: ['emergency devices', 'safety equipment', 'panic button device', 'GPS tracker', 'emergency pendant', 'safety devices'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ProductCollection",
        "name": "Emergency Protection Devices",
        "description": "Smart safety and emergency protection equipment"
      }
    },
    regional: {
      title: 'Regional Emergency Services - Local Protection Centers | LifeLink Sync',
      description: 'Local emergency protection services and regional response centers. Find emergency support in your area with native language assistance.',
      keywords: ['regional emergency services', 'local emergency protection', 'area emergency centers', 'regional safety services'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "ServiceArea",
        "name": "Regional Emergency Services",
        "description": "Local emergency protection and response services"
      }
    },
    family: {
      title: 'Family Emergency Access - Protect Your Loved Ones | LifeLink Sync',
      description: 'Family emergency access and protection for your loved ones. Monitor family safety, share locations, and coordinate emergency response.',
      keywords: ['family emergency protection', 'family safety monitoring', 'loved ones protection', 'family emergency access'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "Family Emergency Protection",
        "description": "Emergency protection services for families and loved ones"
      }
    },
    privacy: {
      title: 'Privacy Policy - LifeLink Sync Emergency Protection Service',
      description: 'LifeLink Sync privacy policy and data protection information. Learn how we protect your personal information and emergency data.',
      keywords: ['privacy policy', 'data protection', 'emergency data privacy', 'personal information security'],
      type: 'article'
    },
    terms: {
      title: 'Terms of Service - LifeLink Sync Emergency Protection Agreement',
      description: 'LifeLink Sync terms of service and user agreement. Understand your rights and responsibilities for emergency protection services.',
      keywords: ['terms of service', 'user agreement', 'emergency service terms', 'protection service agreement'],
      type: 'article'
    },
    admin: {
      title: 'Admin Dashboard - LifeLink Sync Management Portal',
      description: 'Administrative dashboard for LifeLink Sync emergency protection service management, user oversight, and system configuration.',
      keywords: ['admin dashboard', 'emergency service management', 'system administration'],
      noIndex: true,
      noFollow: true
    },
    videos: {
      title: 'LifeLink Sync Video Library - Learn About Emergency Protection',
      description: 'Watch our comprehensive video library to learn about LifeLink Sync features, capabilities, and how we protect families of all ages.',
      keywords: ['emergency protection videos', 'safety tutorials', 'LifeLink Sync videos', 'emergency training', 'protection demos', 'safety education'],
      structuredData: {
        "@context": "https://schema.org",
        "@type": "VideoGallery",
        "name": "LifeLink Sync Video Library",
        "description": "Educational videos about emergency protection services"
      }
    }
  };

  return seoConfig[pageType] || seoConfig.home;
};

export const PageSEO: React.FC<PageSEOProps> = ({
  pageType,
  customTitle,
  customDescription,
  customKeywords,
  customImage,
  locale = 'en_US'
}) => {
  const config = getPageSEO(pageType);
  
  return (
    <SEO
      title={customTitle || config.title}
      description={customDescription || config.description}
      keywords={customKeywords || config.keywords}
      image={customImage || config.image}
      type={config.type || 'website'}
      locale={locale}
      structuredData={config.structuredData}
      noIndex={config.noIndex}
      noFollow={config.noFollow}
      alternateLocales={[
        { hreflang: 'en', href: `${typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com'}${window?.location?.pathname || '/'}` },
        { hreflang: 'es', href: `${typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com'}${window?.location?.pathname || '/'}?lang=es` },
        { hreflang: 'nl', href: `${typeof window !== 'undefined' ? window.location.origin : 'https://lifelink-sync.com'}${window?.location?.pathname || '/'}?lang=nl` }
      ]}
    />
  );
};

export default PageSEO;