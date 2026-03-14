import React from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'Product' | 'Service' | 'LocalBusiness' | 'FAQPage' | 'Article' | 'WebPage';
  data?: any;
  className?: string;
}

const generateOrganizationData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'LifeLink Sync',
  'description': 'Professional emergency response and family safety monitoring services with AI-powered protection',
  'url': 'https://lifelink-sync.com',
  'logo': 'https://lifelink-sync.com/logo.png',
  'foundingDate': '2024',
  'contactPoint': {
    '@type': 'ContactPoint',
    'telephone': '+34-900-000-000',
    'contactType': 'Customer Service',
    'availableLanguage': ['English', 'Spanish', 'Dutch'],
    'areaServed': ['ES', 'GB', 'NL']
  },
  'address': {
    '@type': 'PostalAddress',
    'addressCountry': 'ES',
    'addressRegion': 'Madrid'
  },
  'sameAs': [
    'https://twitter.com/lifelinksync',
    'https://facebook.com/lifelinksync',
    'https://linkedin.com/company/lifelinksync'
  ],
  'serviceArea': {
    '@type': 'GeoCircle',
    'geoMidpoint': {
      '@type': 'GeoCoordinates',
      'latitude': 40.4168,
      'longitude': -3.7038
    },
    'geoRadius': '1000000'
  }
});

const generateServiceData = (serviceType: string) => {
  const baseService = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'provider': {
      '@type': 'Organization',
      'name': 'LifeLink Sync'
    },
    'areaServed': ['ES', 'GB', 'NL'],
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Emergency Protection Services',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': '24/7 Emergency Monitoring'
          }
        }
      ]
    }
  };

  switch (serviceType) {
    case 'emergency-response':
      return {
        ...baseService,
        'name': 'Emergency Response Services',
        'description': '24/7 professional emergency response and monitoring services with AI-powered detection',
        'serviceType': 'Emergency Response',
        'category': 'Emergency Services'
      };
    case 'ai-assistant':
      return {
        ...baseService,
        'name': 'AI Emergency Assistant',
        'description': 'Intelligent emergency detection and response using advanced AI technology',
        'serviceType': 'AI Emergency Detection',
        'category': 'Technology Services'
      };
    case 'family-monitoring':
      return {
        ...baseService,
        'name': 'Family Safety Monitoring',
        'description': 'Comprehensive family safety monitoring with real-time location tracking',
        'serviceType': 'Family Monitoring',
        'category': 'Safety Services'
      };
    case 'senior-protection':
      return {
        ...baseService,
        'name': 'Senior Emergency Protection',
        'description': 'Specialized emergency protection for seniors with medical alert integration',
        'serviceType': 'Senior Care',
        'category': 'Healthcare Services'
      };
    default:
      return baseService;
  }
};

const generateProductData = (productType: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': 'LifeLink Sync Emergency Protection',
  'description': 'Complete emergency protection system with AI monitoring and professional response',
  'brand': {
    '@type': 'Brand',
    'name': 'LifeLink Sync'
  },
  'manufacturer': {
    '@type': 'Organization',
    'name': 'LifeLink Sync'
  },
  'category': 'Emergency Safety Equipment',
  'offers': {
    '@type': 'Offer',
    'priceCurrency': 'EUR',
    'price': '9.99',
    'priceValidUntil': '2026-12-31',
    'availability': 'https://schema.org/InStock',
    'seller': {
      '@type': 'Organization',
      'name': 'LifeLink Sync'
    }
  },
  'aggregateRating': {
    '@type': 'AggregateRating',
    'ratingValue': '4.8',
    'reviewCount': '1247',
    'bestRating': '5',
    'worstRating': '1'
  }
});

const StructuredData: React.FC<StructuredDataProps> = ({ 
  type, 
  data = {}, 
  className = '' 
}) => {
  let structuredData;

  switch (type) {
    case 'Organization':
      structuredData = generateOrganizationData();
      break;
    case 'Service':
      structuredData = generateServiceData(data?.serviceType || 'general');
      break;
    case 'Product':
      structuredData = generateProductData(data?.productType || 'general');
      break;
    case 'LocalBusiness':
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        ...generateOrganizationData(),
        'priceRange': '€€',
        'openingHours': 'Mo,Tu,We,Th,Fr,Sa,Su 00:00-23:59'
      };
      break;
    default:
      structuredData = data;
  }

  // Merge any custom data
  if (data && typeof data === 'object') {
    structuredData = { ...structuredData, ...data };
  }

  return (
    <script 
      type="application/ld+json"
      className={className}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

export default StructuredData;