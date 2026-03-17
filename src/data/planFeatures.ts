/**
 * Single source of truth for plan features and pricing.
 * Import this everywhere instead of hardcoding feature lists.
 * Last verified: 17 March 2026
 */

export interface PlanFeature {
  id: string
  text: string
  detail: string
  included: boolean
}

export interface PlanAddon {
  id: string
  text: string
  price: number
  unit: string
  firstFree?: boolean
  autoUnlock?: boolean
}

export interface NotIncludedItem {
  id: string
  text: string
  detail: string
  price: string
}

export const INDIVIDUAL_PLAN = {
  price: {
    monthly: 9.99,
    annual: 99.90,
    annualSaving: 19.98,
    currency: 'EUR',
  },
  trial: {
    days: 7,
    cardRequired: false,
  },
  features: [
    { id: 'clara-ai', text: 'CLARA AI — 24/7 protection', detail: 'Always watching over you', included: true },
    { id: 'app-sos', text: 'One-tap App SOS', detail: 'Instant from your phone', included: true },
    { id: 'voice-sos', text: 'Voice activation', detail: '"CLARA, help me" — hands free', included: true },
    { id: 'contacts', text: 'Unlimited emergency contacts', detail: 'No cap — add as many as needed', included: true },
    { id: 'gps', text: 'Live GPS location sharing', detail: 'Real-time during emergencies', included: true },
    { id: 'medical', text: 'Medical profile', detail: 'Auto-shared with first responders', included: true },
    { id: 'conference', text: 'Conference bridge', detail: 'Family coordinated instantly', included: true },
    { id: 'tablet', text: 'Tablet dashboard', detail: 'Always-on home monitoring', included: true },
    { id: 'family-link', text: '1 Family Link FREE', detail: 'Extra links €2.99/mo each', included: true },
    { id: 'trial', text: '7-day free trial', detail: 'No card required', included: true },
  ] as PlanFeature[],
  notIncluded: [
    { id: 'pendant', text: 'SOS Pendant', detail: 'Optional one-time purchase', price: '~€49.99 one-time' },
  ] as NotIncludedItem[],
  addons: [
    { id: 'family-link-extra', text: 'Extra Family Links', price: 2.99, unit: 'per link/month', firstFree: true },
    { id: 'wellbeing', text: 'Daily Wellbeing', price: 2.99, unit: 'per month' },
    { id: 'medication', text: 'Medication Reminder', price: 2.99, unit: 'per month' },
    { id: 'clara-complete', text: 'CLARA Complete', price: 0, unit: 'free when both above active', autoUnlock: true },
  ] as PlanAddon[],
}

/** Short feature text array for compact lists (wizard, pricing cards) */
export const PLAN_FEATURE_TEXTS = INDIVIDUAL_PLAN.features.map(f => f.text)
