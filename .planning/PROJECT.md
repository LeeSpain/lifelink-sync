# LifeLink Sync — Project Overview

## Product
**LifeLink Sync** — AI-powered emergency protection platform for families.
CLARA is the autonomous AI sales, support, and safety assistant.

## Tech Stack
- React + TypeScript + Vite (SPA)
- Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- Tailwind CSS + shadcn/ui
- Capacitor (iOS/Android)
- Vercel (deployment)
- Twilio (SMS, WhatsApp, Voice)
- Anthropic Claude (AI provider)
- Stripe (payments, subscriptions)

## Current Milestone: v3.0 Commercial Build 1 — Annual Pricing

**Goal:** Add annual billing option across the entire platform. €99.90/year = 2 months free vs €9.99/month. Consistent across pricing page, sign-up flow, Stripe, member dashboard, admin dashboard, and CLARA training data.

**Target features:**
- Monthly/Annual toggle on pricing page
- Annual Stripe price (€99.90/year) created and linked
- Sign-up flow offers billing cycle choice at payment step
- Member dashboard shows billing cycle + renewal date
- Admin dashboard shows annual vs monthly subscriber counts
- CLARA training data updated to know about annual pricing
- All UI changes in EN, ES, NL

**Out of scope:**
- Family billing bundles (separate milestone)
- Gift subscriptions (separate milestone)
- Referral programme (separate milestone)
- Trial flow changes (7-day free, no card stays exactly the same)

**Constraints:**
- Must not break existing monthly subscribers
- Trial → paid conversion can offer annual as alternative
- Annual option appears at point of first payment only
- Existing Stripe webhook handler must be updated to handle annual

## Active Requirements
See REQUIREMENTS.md

## Previous Milestones
See MILESTONES.md

---
*Last updated: 2026-03-14*
*Maintainer: LeeSpain*
