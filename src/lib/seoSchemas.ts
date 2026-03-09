const BASE_URL = 'https://lifelink-sync.com';
const LOGO = `${BASE_URL}/lovable-uploads/lifelink-sync-icon-512.png`;
const OG_IMAGE = `${BASE_URL}/lovable-uploads/lifelink-sync-og.png`;

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LifeLink Sync",
  "url": BASE_URL,
  "logo": LOGO,
  "image": OG_IMAGE,
  "description": "AI-powered emergency protection platform providing 24/7 safety monitoring, instant SOS alerts, GPS tracking and CLARA AI assistance for individuals and families",
  "foundingDate": "2024",
  "areaServed": [
    { "@type": "Country", "name": "Spain" },
    { "@type": "Country", "name": "United Kingdom" },
    { "@type": "Country", "name": "Netherlands" }
  ],
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@lifelink-sync.com",
      "availableLanguage": ["English", "Spanish", "Dutch"]
    },
    {
      "@type": "ContactPoint",
      "contactType": "sales",
      "email": "info@lifelink-sync.com"
    }
  ],
  "sameAs": [
    "https://linkedin.com/company/lifelink-sync",
    "https://twitter.com/lifelinksync"
  ]
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LifeLink Sync",
  "applicationCategory": [
    "HealthApplication",
    "LifestyleApplication",
    "SecurityApplication"
  ],
  "operatingSystem": "iOS, Android, Web",
  "url": BASE_URL,
  "description": "AI-powered emergency protection with CLARA AI assistant, instant SOS alerts, GPS tracking and family safety monitoring",
  "screenshot": OG_IMAGE,
  "featureList": [
    "CLARA AI 24/7 assistant",
    "One-tap SOS emergency alert",
    "Bluetooth SOS pendant support",
    "Voice activation emergency trigger",
    "Live GPS location sharing",
    "Family circle notifications",
    "Medical profile for first responders",
    "Conference bridge",
    "Instant callback",
    "Daily wellbeing check-ins",
    "Medication reminders"
  ],
  "offers": {
    "@type": "Offer",
    "price": "9.99",
    "priceCurrency": "EUR",
    "priceSpecification": {
      "@type": "RecurringPaymentSpecification",
      "billingPeriod": "P1M",
      "price": "9.99",
      "priceCurrency": "EUR"
    },
    "description": "Individual Plan — 7-day free trial, no credit card required"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "127",
    "bestRating": "5"
  },
  "inLanguage": ["en", "es", "nl"]
};

export const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "LifeLink Sync SOS Pendant",
  "description": "Bluetooth emergency pendant that pairs with your smartphone to instantly activate CLARA AI and trigger your full emergency response",
  "brand": {
    "@type": "Brand",
    "name": "LifeLink Sync"
  },
  "category": "Emergency Safety Device",
  "offers": {
    "@type": "Offer",
    "price": "129.00",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock"
  }
};

export const faqSchemaHomepage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is LifeLink Sync?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LifeLink Sync is an AI-powered emergency protection platform. It provides 24/7 safety monitoring through CLARA AI, instant SOS alerts, GPS tracking and family circle coordination for individuals and families in Spain, the UK and Netherlands."
      }
    },
    {
      "@type": "Question",
      "name": "How much does LifeLink Sync cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LifeLink Sync costs €9.99 per month with a 7-day free trial. No credit card is required for the trial. Extra family links cost €2.99 per month each. Add-ons including Daily Wellbeing and Medication Reminder are €2.99 per month each."
      }
    },
    {
      "@type": "Question",
      "name": "How does CLARA AI work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CLARA is LifeLink Sync's AI safety assistant available 24/7. When you trigger an emergency via the app SOS button, Bluetooth pendant or voice command, CLARA instantly alerts your family circle, shares your GPS location, sends your medical profile to first responders and can open a conference bridge or arrange an instant callback."
      }
    },
    {
      "@type": "Question",
      "name": "Does the SOS pendant work without a phone?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. The LifeLink Sync SOS pendant pairs with your smartphone via Bluetooth. When you press the pendant button it activates CLARA and triggers your full emergency response through your paired phone. A smartphone connection is required."
      }
    },
    {
      "@type": "Question",
      "name": "Is LifeLink Sync available in Spain?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. LifeLink Sync is available in Spain, the UK and the Netherlands. The app is fully available in Spanish (Español) and integrates with Spanish emergency services. The emergency number for Spain is 112."
      }
    },
    {
      "@type": "Question",
      "name": "Does LifeLink Sync replace calling 112 or 999?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. LifeLink Sync is a supplementary emergency protection service and does not replace emergency services. In any life-threatening situation always contact emergency services directly: 112 in Spain and the EU, 999 in the UK, 911 in the US."
      }
    },
    {
      "@type": "Question",
      "name": "What is the free trial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "LifeLink Sync offers a 7-day free trial with full access to all features. No credit card is required to start. You will receive reminder emails on day 3, day 6 and day 7 before the trial ends."
      }
    }
  ]
};

export const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "LifeLink Sync Pricing",
  "description": "Emergency protection plans from €9.99/month",
  "mainEntity": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Offer",
          "name": "Individual Plan",
          "price": "9.99",
          "priceCurrency": "EUR",
          "description": "Full emergency protection with CLARA AI, SOS alerts, GPS tracking and 1 family link included. 7-day free trial."
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Offer",
          "name": "Daily Wellbeing Add-On",
          "price": "2.99",
          "priceCurrency": "EUR",
          "description": "CLARA daily check-in calls, wellbeing tracking and family digest"
        }
      },
      {
        "@type": "ListItem",
        "position": 3,
        "item": {
          "@type": "Offer",
          "name": "Medication Reminder Add-On",
          "price": "2.99",
          "priceCurrency": "EUR",
          "description": "AI-driven medication reminders with family notification if missed"
        }
      }
    ]
  }
};

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "LifeLink Sync",
  "url": BASE_URL,
  "image": OG_IMAGE,
  "description": "AI-powered emergency protection platform",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Madrid",
    "addressCountry": "ES"
  },
  "areaServed": [
    "Spain", "United Kingdom", "Netherlands"
  ],
  "priceRange": "€€"
};

export const breadcrumbSchema = (
  items: { name: string; url: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": item.name,
    "item": `${BASE_URL}${item.url}`
  }))
});
