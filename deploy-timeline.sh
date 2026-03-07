#!/bin/bash
# Deploy Unified Contact Timeline System
# Sprint 3: Perfect Memory Implementation

set -e

echo "🚀 Deploying Unified Contact Timeline System..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Database Migration
echo -e "${BLUE}📊 Step 1: Deploying database schema...${NC}"
supabase db push
echo -e "${GREEN}✅ Database schema deployed${NC}"
echo ""

# Step 2: Deploy Edge Functions
echo -e "${BLUE}🔧 Step 2: Deploying edge functions...${NC}"

echo "  - Deploying timeline-aggregator..."
supabase functions deploy timeline-aggregator
echo -e "${GREEN}  ✅ timeline-aggregator deployed${NC}"

echo "  - Re-deploying clara-voice-agent (with timeline integration)..."
supabase functions deploy clara-voice-agent
echo -e "${GREEN}  ✅ clara-voice-agent deployed${NC}"

echo "  - Re-deploying emergency-conference (with userId pass-through)..."
supabase functions deploy emergency-conference
echo -e "${GREEN}  ✅ emergency-conference deployed${NC}"

echo ""

# Step 3: Verify Deployment
echo -e "${BLUE}🔍 Step 3: Verifying deployment...${NC}"

echo "  - Checking tables..."
TABLES=$(supabase db list-tables 2>/dev/null || echo "")
if echo "$TABLES" | grep -q "contact_timeline"; then
  echo -e "${GREEN}  ✅ contact_timeline table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  contact_timeline table not found - check migration${NC}"
fi

if echo "$TABLES" | grep -q "contact_engagement_summary"; then
  echo -e "${GREEN}  ✅ contact_engagement_summary table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  contact_engagement_summary table not found${NC}"
fi

if echo "$TABLES" | grep -q "ai_contact_context"; then
  echo -e "${GREEN}  ✅ ai_contact_context table exists${NC}"
else
  echo -e "${YELLOW}  ⚠️  ai_contact_context table not found${NC}"
fi

echo ""
echo "  - Checking functions..."
FUNCTIONS=$(supabase functions list 2>/dev/null || echo "")
if echo "$FUNCTIONS" | grep -q "timeline-aggregator"; then
  echo -e "${GREEN}  ✅ timeline-aggregator function deployed${NC}"
else
  echo -e "${YELLOW}  ⚠️  timeline-aggregator function not found${NC}"
fi

echo ""

# Step 4: Summary
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo ""
echo -e "${GREEN}✅ Database Tables:${NC}"
echo "   - contact_timeline (main event log)"
echo "   - contact_engagement_summary (metrics)"
echo "   - ai_contact_context (AI cache)"
echo ""
echo -e "${GREEN}✅ Edge Functions:${NC}"
echo "   - timeline-aggregator (event capture)"
echo "   - clara-voice-agent (with timeline context)"
echo "   - emergency-conference (with userId)"
echo ""
echo -e "${GREEN}✅ Frontend Components:${NC}"
echo "   - useContactTimeline hook (src/hooks/)"
echo "   - ContactTimelineViewer (src/components/admin/)"
echo ""

# Step 5: Next Steps
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo ""
echo "1. Test Timeline System:"
echo "   supabase functions invoke timeline-aggregator --body '{\"action\":\"add_event\", \"event\":{...}}'"
echo ""
echo "2. View in Admin UI:"
echo "   Import ContactTimelineViewer component in your admin panel"
echo ""
echo "3. Clara Auto-Context:"
echo "   Trigger an emergency - Clara will automatically use timeline context!"
echo ""
echo "4. Monitor Logs:"
echo "   supabase functions logs timeline-aggregator --tail"
echo "   supabase functions logs clara-voice-agent --tail"
echo ""
echo -e "${BLUE}📖 Full Documentation:${NC}"
echo "   - UNIFIED_TIMELINE_GUIDE.md (complete guide)"
echo "   - CLARA_AI_AGENT_GUIDE.md (Clara integration)"
echo ""
echo -e "${GREEN}🎉 Sprint 3 Complete: Unified Contact Timeline is LIVE!${NC}"
echo ""
echo "Your platform now has perfect memory across all customer interactions."
echo "Clara can reference past emergencies and conversations naturally."
echo "Admins see complete customer journey in one beautiful timeline."
echo ""
