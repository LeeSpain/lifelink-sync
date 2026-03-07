# 📞 Callback System Testing Guide

## Overview
This guide provides step-by-step instructions for testing the 60-second callback integration with real phone numbers.

## System Architecture

### Components
1. **EnhancedChatWidget** (`src/components/ai-chat/EnhancedChatWidget.tsx`)
   - Voice callback button (Phone icon)
   - Video callback button (Video icon)
   - Language selector (Globe icon)

2. **Instant Callback Edge Function** (`supabase/functions/instant-callback/index.ts`)
   - Receives callback requests
   - Creates callback queue entries
   - Initiates Twilio conference calls
   - Tracks call status

3. **Database Tables**
   - `callback_requests` - Stores callback request details
   - `callback_queue` - Manages callback priority queue
   - `sales_rep_availability` - Tracks available sales reps

## Pre-requisites

### 1. Twilio Configuration
Required environment variables in Supabase:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Sales Rep Setup
At least one sales rep must be configured:
```sql
-- Insert test sales rep availability
INSERT INTO sales_rep_availability (user_id, status, current_call_count, max_concurrent_calls)
VALUES ('user-id-here', 'online', 0, 5);

-- Update profile with phone number
UPDATE profiles
SET phone = '+1234567890'  -- Sales rep's phone
WHERE user_id = 'user-id-here';
```

## Testing Scenarios

### Test 1: Voice Callback from Chat Widget

#### Steps:
1. **Open the application** at `https://your-app-url.com`
2. **Click the Clara AI chat button** (floating widget in top-right)
3. **Click the Phone icon** in the chat header
4. **Expected behavior:**
   - System shows "Great! Our team will call you back in less than 60 seconds"
   - Toast notification appears confirming callback requested
   - If user is logged in, their profile phone number is used
   - If not logged in, they may need to provide phone number

#### Expected Results:
- ✅ Sales rep receives call within 3 seconds
- ✅ Sales rep hears greeting: "You have a new callback request from [Name]"
- ✅ Customer receives call within 60 seconds
- ✅ Customer hears: "Hello, this is ICE SOS returning your callback request"
- ✅ Both parties connected in conference bridge
- ✅ Call status tracked in database

### Test 2: Video Callback Request

#### Steps:
1. **Open Clara AI chat widget**
2. **Click the Video icon** in the chat header
3. **Expected behavior:**
   - System shows "Get ready for a video call" message
   - `callbackType: 'video'` passed to backend
   - Request logged with video flag

#### Expected Results:
- ✅ Request created with `callbackType: 'video'`
- ✅ Sales rep notified of video call request
- ✅ System prepares for video conference (future implementation)

### Test 3: Language Preference in Callback

#### Steps:
1. **Change language to Spanish** using Globe icon
2. **Request callback**
3. **Expected behavior:**
   - `preferredLanguage: 'es'` sent to backend
   - System messages in Spanish
   - Rep notified of Spanish preference

#### Expected Results:
- ✅ Language preference saved to profile
- ✅ Backend receives correct language code
- ✅ Spanish messages shown to user
- ✅ Rep sees Spanish preference in context

### Test 4: Callback from "How It Works" Section

#### Steps:
1. **Scroll to "How It Works" section** on homepage
2. **Click "Call Now (60 sec)" button**
3. **Expected behavior:**
   - Opens Clara chat widget
   - Automatically triggers callback after 500ms delay

#### Expected Results:
- ✅ Chat widget opens
- ✅ Callback triggered automatically
- ✅ Same flow as Test 1

### Test 5: Quick Action Button

#### Steps:
1. **Open Clara chat widget**
2. **Scroll down to quick action buttons**
3. **Click "Call Now" button**
4. **Expected behavior:**
   - Same as header phone icon
   - Initiates voice callback immediately

### Test 6: Queue System (No Reps Available)

#### Steps:
1. **Set all sales reps to offline:**
```sql
UPDATE sales_rep_availability
SET status = 'offline';
```
2. **Request callback**
3. **Expected behavior:**
   - Request added to queue
   - User sees "within 5 minutes" message
   - Priority calculated based on urgency

#### Expected Results:
- ✅ Request queued successfully
- ✅ Priority calculated (0-100)
- ✅ User informed of queue status
- ✅ Callback processed when rep becomes available

### Test 7: High-Priority Urgent Callback

#### Steps:
1. **Modify request to set urgency:**
```javascript
// In EnhancedChatWidget.tsx, line 92
urgency: 'urgent',  // Changed from 'high'
```
2. **Request callback**

#### Expected Results:
- ✅ Priority score 90+ assigned
- ✅ Moved to front of queue
- ✅ Rep receives urgent notification

## Database Verification

### Check Callback Request
```sql
SELECT * FROM callback_requests
ORDER BY created_at DESC
LIMIT 5;
```

### Check Queue Status
```sql
SELECT
  cq.*,
  cr.contact_name,
  cr.contact_phone,
  cr.status as request_status
FROM callback_queue cq
JOIN callback_requests cr ON cq.callback_request_id = cr.id
ORDER BY cq.priority DESC;
```

### Check Call History
```sql
SELECT
  id,
  contact_name,
  contact_phone,
  status,
  call_initiated_at,
  created_at,
  metadata->>'conference_name' as conference_name
FROM callback_requests
WHERE status IN ('calling', 'completed')
ORDER BY created_at DESC
LIMIT 10;
```

## Integration Points

### 1. EnhancedChatWidget → instant-callback
```javascript
// Request payload
{
  phone: user?.phone || 'chat-user',
  name: userName,
  email: user?.email || '',
  urgency: 'high',
  preferredLanguage: currentLanguage,  // 'en' or 'es'
  callbackType: type,  // 'voice' or 'video'
  source: 'chat_widget',
  context: context  // 'global', 'registration', etc.
}
```

### 2. instant-callback → Twilio
```javascript
// Conference call flow
1. Call sales rep first (3-second head start)
2. Rep hears customer context + lead score
3. Call customer
4. Both join conference bridge
5. Status tracked via webhooks
```

### 3. Twilio → callback-status
```javascript
// Status webhook events
- initiated: Call started
- ringing: Phone is ringing
- answered: Call answered
- completed: Call ended
```

## Troubleshooting

### Issue: No call received
**Check:**
- [ ] Twilio credentials configured correctly
- [ ] Phone numbers in E.164 format (+1234567890)
- [ ] Sales rep marked as 'online'
- [ ] Rep profile has valid phone number
- [ ] Supabase function logs for errors

### Issue: Call drops immediately
**Check:**
- [ ] TwiML syntax correct
- [ ] Conference name unique
- [ ] StatusCallback URL accessible
- [ ] Firewall not blocking Twilio

### Issue: Language not working
**Check:**
- [ ] Profile has preferred_language field
- [ ] i18n translations loaded
- [ ] Language code valid ('en', 'es', 'nl')
- [ ] Context properly passed to backend

## Manual Testing Checklist

- [ ] Voice callback from chat header
- [ ] Video callback from chat header
- [ ] Language selector (English)
- [ ] Language selector (Spanish)
- [ ] Quick action "Call Now" button
- [ ] "How It Works" call button
- [ ] Callback without user login
- [ ] Callback with user logged in
- [ ] Queue system (no reps available)
- [ ] Priority calculation (urgent vs normal)
- [ ] Database records created
- [ ] Timeline event logged
- [ ] Phone format validation
- [ ] Error handling (invalid phone)
- [ ] Rate limiting (multiple requests)

## Performance Metrics

### Success Criteria:
- ✅ **Rep receives call:** < 3 seconds
- ✅ **Customer receives call:** < 60 seconds (SLA)
- ✅ **Connection success rate:** > 95%
- ✅ **Database write latency:** < 200ms
- ✅ **Edge function response:** < 500ms

### Monitoring Queries:

```sql
-- Average callback time
SELECT
  AVG(EXTRACT(EPOCH FROM (call_initiated_at - created_at))) as avg_seconds
FROM callback_requests
WHERE call_initiated_at IS NOT NULL;

-- Success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM callback_requests
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Failed calls
SELECT
  contact_name,
  contact_phone,
  status,
  created_at,
  metadata->>'error' as error_message
FROM callback_requests
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

## Production Deployment

### Before Launch:
1. **Test with real phone numbers** in staging
2. **Verify Twilio account limits** (concurrent calls, credits)
3. **Set up monitoring** (Datadog, Sentry)
4. **Configure alerting** (failed calls, high queue times)
5. **Train sales reps** on callback flow
6. **Set up recording** (compliance, quality assurance)
7. **Test international numbers** (if applicable)

### Post-Launch Monitoring:
- Monitor callback queue depth
- Track average wait times
- Review failed call reasons
- Collect customer feedback
- Analyze language preferences
- Optimize rep availability

## Support Contact

For issues with callback system:
- **Backend/Twilio:** Check Supabase function logs
- **Frontend:** Check browser console errors
- **Database:** Review callback_requests and queue tables
- **Twilio:** Check Twilio console call logs

---

**Last Updated:** 2026-02-27
**Version:** 1.0.0
**Status:** ✅ Ready for Testing
