export const CODEBASE_MAP = `
LIFELINK SYNC CODEBASE MAP
===========================

ADMIN PAGES
- src/pages/AdminDashboard.tsx — main admin shell, tab routing
- src/components/admin/AdminLayout.tsx — admin sidebar navigation, ALL sidebar expand/collapse state lives here
- src/components/admin/AdminNotificationCenter.tsx — notification bell

MEMBER DASHBOARD
- src/pages/Dashboard.tsx — member dashboard shell
- src/components/dashboard/family/FamilyAccessPanel.tsx — family management
- src/components/dashboard/family/FamilyMemberView.tsx — member view
- src/components/dashboard/ReferralPanel.tsx — 5-star referral

PRICING + COMMERCIAL
- src/components/Pricing.tsx — public pricing page, monthly/annual toggle
- src/hooks/usePricing.ts — all prices from DB
- src/pages/CheckoutPage.tsx — Stripe checkout flow
- src/pages/GiftPurchasePage.tsx — gift purchase flow
- src/pages/GiftRedeemPage.tsx — gift redemption
- src/pages/GiftConfirmationPage.tsx — post-gift confirmation

AUTH + SIGNUP
- src/pages/AuthPage.tsx — login, signup, forgot password
- src/pages/AIRegister.tsx — AI-guided registration
- src/pages/TrialSignupPage.tsx — trial signup

ROUTING
- src/App.tsx — ALL routes defined here

EDGE FUNCTIONS
- supabase/functions/ai-chat — CLARA brain
- supabase/functions/clara-memory — contact memory
- supabase/functions/clara-escalation — WhatsApp alerts to Lee
- supabase/functions/whatsapp-inbound — inbound WhatsApp
- supabase/functions/clara-dev-agent — this file, dev agent
- supabase/functions/gift-checkout — gift Stripe checkout
- supabase/functions/redeem-gift — gift redemption
- supabase/functions/referral-convert — referral star activation
- supabase/functions/stripe-webhook — all Stripe events
- supabase/functions/clara-morning-briefing — 8am daily report
- supabase/functions/clara-weekly-report — Monday report

KEY PATTERNS
- Sidebar expand/collapse: useState with object of booleans in AdminLayout.tsx
- Pricing: always use usePricing() hook, never hardcode
- Auth protection: AdminProtectedRoute wraps all /admin routes
- Translations: all UI text via useTranslation(), keys in src/locales/
- Stripe: create-checkout edge function, stripe-webhook handles events
- Family: family_groups + family_memberships tables
- Gifts: gift_subscriptions table, gift-checkout function
- Referrals: referrals table, referral-convert function
`;
