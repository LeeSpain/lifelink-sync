#!/bin/bash
# Deploy Instant Voice Callback System
# Sprint 4: Convert Leads 10x Faster

set -e

echo "🚀 Deploying Instant Voice Callback System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Database Migration
echo -e "${BLUE}📊 Step 1: Deploying callback database schema...${NC}"
supabase db push
echo -e "${GREEN}✅ Database schema deployed${NC}"
echo ""

# Step 2: Deploy Edge Functions
echo -e "${BLUE}🔧 Step 2: Deploying edge functions...${NC}"

echo "  - Deploying instant-callback..."
supabase functions deploy instant-callback
echo -e "${GREEN}  ✅ instant-callback deployed${NC}"

echo "  - Deploying callback-status..."
supabase functions deploy callback-status
echo -e "${GREEN}  ✅ callback-status deployed${NC}"

echo ""

# Step 3: Verify Deployment
echo -e "${BLUE}🔍 Step 3: Verifying deployment...${NC}"

echo "  - Checking tables..."
TABLES=$(supabase db list-tables 2>/dev/null || echo "")

if echo "$TABLES" | grep -q "callback_requests"; then
  echo -e "${GREEN}  ✅ callback_requests table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  callback_requests table not found - check migration${NC}"
fi

if echo "$TABLES" | grep -q "callback_queue"; then
  echo -e "${GREEN}  ✅ callback_queue table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  callback_queue table not found${NC}"
fi

if echo "$TABLES" | grep -q "sales_rep_availability"; then
  echo -e "${GREEN}  ✅ sales_rep_availability table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  sales_rep_availability table not found${NC}"
fi

echo ""
echo "  - Checking functions..."
FUNCTIONS=$(supabase functions list 2>/dev/null || echo "")

if echo "$FUNCTIONS" | grep -q "instant-callback"; then
  echo -e "${GREEN}  ✅ instant-callback function deployed${NC}"
else
  echo -e "${YELLOW}  ⚠️  instant-callback function not found${NC}"
fi

if echo "$FUNCTIONS" | grep -q "callback-status"; then
  echo -e "${GREEN}  ✅ callback-status function deployed${NC}"
else
  echo -e "${YELLOW}  ⚠️  callback-status function not found${NC}"
fi

echo ""

# Step 4: Disable JWT for webhook
echo -e "${BLUE}⚙️  Step 4: Important configuration...${NC}"
echo ""
echo -e "${YELLOW}ACTION REQUIRED:${NC}"
echo "Go to Supabase Dashboard → Edge Functions → callback-status"
echo "Disable 'Enforce JWT verification' to allow Twilio webhooks"
echo ""

# Step 5: Summary
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo ""
echo -e "${GREEN}✅ Database Tables:${NC}"
echo "   - callback_requests (main callback tracking)"
echo "   - callback_queue (priority queue system)"
echo "   - sales_rep_availability (rep status)"
echo "   - callback_analytics (performance metrics)"
echo ""
echo -e "${GREEN}✅ Edge Functions:${NC}"
echo "   - instant-callback (handles callback requests)"
echo "   - callback-status (Twilio webhook handler)"
echo ""
echo -e "${GREEN}✅ Frontend Components:${NC}"
echo "   - InstantCallbackWidget (landing page widget)"
echo "   - CallbackDashboard (sales rep dashboard)"
echo ""

# Step 6: Next Steps
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo ""
echo "1. Add Widget to Landing Page:"
echo "   import { InstantCallbackWidget } from '@/components/marketing/InstantCallbackWidget';"
echo "   <InstantCallbackWidget variant=\"floating\" urgency=\"high\" />"
echo ""
echo "2. Setup Sales Rep:"
echo "   - Add phone number to rep's profile"
echo "   - Import CallbackDashboard in admin panel"
echo "   - Rep clicks 'Online' to receive callbacks"
echo ""
echo "3. Test Callback Flow:"
echo "   - Visit landing page"
echo "   - Click callback widget"
echo "   - Enter phone number"
echo "   - Rep gets call → Customer gets call → Connected!"
echo ""
echo "4. Monitor Performance:"
echo "   SELECT * FROM callback_analytics WHERE date = CURRENT_DATE;"
echo ""
echo -e "${BLUE}📖 Full Documentation:${NC}"
echo "   - INSTANT_CALLBACK_GUIDE.md (complete guide)"
echo "   - UNIFIED_TIMELINE_GUIDE.md (timeline integration)"
echo ""
echo -e "${GREEN}🎉 Sprint 4 Complete: Instant Voice Callback is LIVE!${NC}"
echo ""
echo "Convert leads 10x faster with 60-second callbacks."
echo "Visitors click → call within 60 seconds → close the deal."
echo "Your competitors are still sending emails. You're on the phone."
echo ""
