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

## Current Milestone: v2.0 CLARA GOD MODE Phase 2

**Goal:** Make CLARA fully autonomous — she handles WhatsApp conversations, follows up with leads/trials on schedule, proactively reaches out to inactive users, and sends Lee a morning briefing every day.

**Target features:**
- Build 4: WhatsApp Bridge — inbound WhatsApp → CLARA auto-responds
- Build 6: Cron Jobs — 7 scheduled automations (morning briefing, trial follow-ups, hot lead chase, weekly report)
- Build 7: Heartbeat — CLARA proactively contacts inactive trial users, subscribers, and quiet leads
- Cleanup: Fix geo-lookup CORS error in browser console

**Out of scope:**
- Tablet vision AI (Phase 3)
- WhatsApp Business number registration (using sandbox)
- Stripe webhook changes
- Frontend changes (except geo-lookup fix)

**Constraints:**
- Supabase free plan — only ai-chat, clara-memory, clara-escalation deployed
- Need Pro plan to deploy more functions
- Twilio sandbox only for now
- All builds must use existing pg_cron and pg_net

## Active Requirements
See REQUIREMENTS.md

---
*Last updated: 2026-03-14*
*Maintainer: LeeSpain*
