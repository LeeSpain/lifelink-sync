export const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || (import.meta.env.MODE !== 'production' ? 'G-XWNSKESY1C' : ''));
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

// Enhanced Google Analytics configuration
export const GA_CONFIG = {
  measurementId: GA_MEASUREMENT_ID,
  cookieFlags: 'SameSite=None;Secure',
  customDimensions: {
    userRole: 'custom_dimension_1',
    subscriptionPlan: 'custom_dimension_2',
    userLocation: 'custom_dimension_3'
  }
};