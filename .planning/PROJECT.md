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

## Current Milestone: v5.0 Commercial Build 4 — 5-Star Referral Programme

**Goal:** Referral system where subscribers earn 12 months free CLARA when 5 people they refer become simultaneous paying members. Visual 5-star progress in dashboard.

**Target features:**
- Unique referral link per subscriber (lifelink-sync.com/join?ref=[userID])
- 5-star visual tracker (silver → gold as referrals convert)
- Referral only counts on FIRST PAYMENT (not trial)
- Star reverts if referred member cancels
- All 5 must be gold simultaneously for reward
- 12-month Stripe credit applied automatically
- CLARA congratulates on each gold star
- Admin: champion leaderboard, credits tracking, conversion funnel

**Out of scope:**
- Multiple programmes per account (no stacking)
- Referral for family seats (individual subscriptions only)

**Constraints:**
- Must not break existing subscribers, family seats, gifts, annual pricing
- Auto-renews while all 5 remain active
- Stripe credit, not plan change

## Active Requirements
See REQUIREMENTS.md

## Previous Milestones
See MILESTONES.md

---
*Last updated: 2026-03-15*
*Maintainer: LeeSpain*
