import React from 'react';
import StructuredData from './StructuredData';

interface AIBusinessProfileProps {
  className?: string;
}

// Enhanced business profile for AI discovery and business partnerships
const AIBusinessProfile: React.FC<AIBusinessProfileProps> = ({ className = '' }) => {
  const businessData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://lifelink-sync.com/#organization',
    'name': 'LifeLink Sync',
    'alternateName': ['LifeLink Sync Emergency Protection', 'Emergency Protection Services'],
    'url': 'https://lifelink-sync.com',
    'description': 'Professional AI-powered emergency protection and family safety monitoring services with 24/7 response capabilities, serving individuals, families, and seniors across Europe.',
    'foundingDate': '2024',
    'slogan': 'AI-Powered Emergency Protection for Modern Families',
    
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://lifelink-sync.com/logo.png',
      'width': 400,
      'height': 400
    },
    
    'contactPoint': [
      {
        '@type': 'ContactPoint',
        'telephone': '+34-900-000-000',
        'contactType': 'Customer Service',
        'availableLanguage': ['English', 'Spanish', 'Dutch'],
        'areaServed': ['ES', 'GB', 'NL'],
        'hoursAvailable': {
          '@type': 'OpeningHoursSpecification',
          'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          'opens': '00:00',
          'closes': '23:59'
        }
      },
      {
        '@type': 'ContactPoint',
        'contactType': 'Business Partnerships',
        'email': 'partnerships@lifelink-sync.com',
        'description': 'For AI companies, technology integrations, and business collaborations'
      },
      {
        '@type': 'ContactPoint',
        'contactType': 'AI/ML Partnerships',
        'email': 'ai-partnerships@lifelink-sync.com',
        'description': 'Specialized contact for AI/ML companies and research institutions'
      }
    ],
    
    'address': {
      '@type': 'PostalAddress',
      'addressCountry': 'ES',
      'addressRegion': 'Madrid',
      'addressLocality': 'Madrid'
    },
    
    'areaServed': [
      {
        '@type': 'Country',
        'name': 'Spain',
        'identifier': 'ES'
      },
      {
        '@type': 'Country', 
        'name': 'United Kingdom',
        'identifier': 'GB'
      },
      {
        '@type': 'Country',
        'name': 'Netherlands', 
        'identifier': 'NL'
      }
    ],
    
    'industry': [
      'Emergency Services',
      'Safety Technology',
      'AI-Powered Healthcare',
      'Family Protection Services',
      'Personal Safety Technology'
    ],
    
    'naics': '561612', // Security Guard and Patrol Services
    'isicV4': '8010', // Private security activities
    
    'businessFunction': [
      'Emergency Response',
      'AI-Powered Safety Monitoring', 
      'Family Protection Services',
      'Senior Care Technology',
      'Location-Based Safety Services'
    ],
    
    'serviceArea': {
      '@type': 'GeoCircle',
      'geoMidpoint': {
        '@type': 'GeoCoordinates',
        'latitude': 40.4168,
        'longitude': -3.7038
      },
      'geoRadius': '1000000'
    },
    
    'sameAs': [
      'https://twitter.com/lifelinksync',
      'https://facebook.com/lifelinksync', 
      'https://linkedin.com/company/lifelinksync',
      'https://instagram.com/lifelinksync'
    ],
    
    'knowsAbout': [
      'Emergency Response',
      'AI Safety Technology',
      'Family Protection',
      'Senior Emergency Care',
      'GPS Tracking Technology',
      'Emergency Alert Systems',
      'Personal Safety Apps',
      'Emergency Monitoring Services',
      'AI-Powered Health Monitoring',
      'Location-Based Services'
    ],
    
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Emergency Protection Services',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': '24/7 Emergency Monitoring',
            'description': 'AI-powered continuous safety monitoring with instant emergency response',
            'serviceType': 'Emergency Monitoring'
          },
          'priceSpecification': {
            '@type': 'PriceSpecification',
            'price': '9.99',
            'priceCurrency': 'EUR',
            'unitText': 'monthly'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'AI Emergency Assistant',
            'description': 'Intelligent emergency detection and response using advanced AI technology',
            'serviceType': 'AI Emergency Detection'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Family Safety Monitoring',
            'description': 'Comprehensive family safety monitoring with real-time location tracking',
            'serviceType': 'Family Protection'
          }
        }
      ]
    },
    
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '1247',
      'bestRating': '5',
      'worstRating': '1'
    },
    
    'award': [
      'Best Emergency Technology Innovation 2024',
      'Top Family Safety App Europe 2024'
    ],
    
    'memberOf': [
      {
        '@type': 'Organization',
        'name': 'European Emergency Services Association',
        'url': 'https://eesa.org'
      },
      {
        '@type': 'Organization', 
        'name': 'International Association for Healthcare Security',
        'url': 'https://iahss.org'
      }
    ],
    
    'employee': [
      {
        '@type': 'Person',
        'name': 'Chief Technology Officer',
        'jobTitle': 'CTO',
        'worksFor': {
          '@type': 'Organization',
          'name': 'LifeLink Sync'
        },
        'knowsAbout': ['AI Technology', 'Emergency Systems', 'Safety Technology']
      }
    ],
    
    'keywords': [
      'emergency protection',
      'AI safety technology',
      'family monitoring',
      'senior protection',
      'emergency response',
      'GPS tracking',
      'personal safety',
      'emergency alerts',
      'AI assistant',
      '24/7 monitoring',
      'location tracking',
      'safety devices',
      'emergency services',
      'health monitoring',
      'family safety'
    ]
  };

  return (
    <StructuredData 
      type="Organization" 
      data={businessData}
      className={className}
    />
  );
};

export default AIBusinessProfile;