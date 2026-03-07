# Conference Bridge - Quick Start Guide

## 🚀 Get It Running in 10 Minutes

### Step 1: Deploy Database Migration

```bash
cd /Users/leewakeman/ice-sos-lite

# Push the new migration to Supabase
supabase db push

# Or if using Supabase CLI locally:
supabase migration up
```

### Step 2: Deploy Edge Functions

```bash
# Deploy all three new functions
supabase functions deploy emergency-conference
supabase functions deploy conference-status
supabase functions deploy emergency-sos-conference

# Check deployment status
supabase functions list
```

### Step 3: Configure Function Settings

Go to **Supabase Dashboard → Edge Functions**:

1. **conference-status**:
   - Click settings
   - **Disable** "Enforce JWT verification"
   - Click Save
   - (This allows Twilio webhooks to reach it)

2. **emergency-conference**:
   - Set timeout to 30 seconds
   - Click Save

### Step 4: Test It!

#### Option A: From Your App

```tsx
// In your SOS button handler
const handleSOS = async () => {
  const { data, error } = await supabase.functions.invoke('emergency-sos-conference', {
    body: {
      userProfile: {
        first_name: user.firstName,
        last_name: user.lastName,
        phone: user.phone, // REQUIRED for conference
        emergency_contacts: user.emergencyContacts,
      },
      location: currentLocation,
      locationData: {
        latitude: lat,
        longitude: lng,
        googleMapsLink: `https://maps.google.com/?q=${lat},${lng}`,
      },
      timestamp: new Date().toISOString(),
      useConference: true, // Set to true!
    },
  });

  if (data?.incident_id) {
    // Show live dashboard
    setActiveIncidentId(data.incident_id);
  }
};
```

#### Option B: Direct API Test

```bash
# Get your user JWT token from browser dev tools (localStorage)
export USER_JWT="your-jwt-token"
export SUPABASE_URL="https://your-project.supabase.co"

curl -X POST "$SUPABASE_URL/functions/v1/emergency-sos-conference" \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": {
      "first_name": "Test",
      "last_name": "User",
      "phone": "+1234567890",
      "emergency_contacts": [
        {
          "name": "Contact 1",
          "phone": "+0987654321",
          "email": "contact1@example.com"
        }
      ]
    },
    "location": "Test Location",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "useConference": true
  }'
```

### Step 5: Add Dashboard to Your UI

```tsx
import { LiveConferenceDashboard } from '@/components/emergency/LiveConferenceDashboard';

function EmergencyPage() {
  const [incidentId, setIncidentId] = useState<string | null>(null);

  return (
    <div>
      {incidentId && (
        <LiveConferenceDashboard incidentId={incidentId} />
      )}
    </div>
  );
}
```

---

## 🔍 Verify It's Working

### Check Database

```sql
-- See all conferences
SELECT * FROM emergency_conferences ORDER BY created_at DESC LIMIT 10;

-- See participants for latest conference
SELECT
  cp.*,
  ec.conference_name
FROM conference_participants cp
JOIN emergency_conferences ec ON cp.conference_id = ec.id
ORDER BY cp.created_at DESC
LIMIT 20;
```

### Check Logs

```bash
# Watch conference creation
supabase functions logs emergency-conference --tail

# Watch status updates
supabase functions logs conference-status --tail
```

### What to Look For

✅ **In Logs:**
- "📞 Creating conference room: emergency-..."
- "✅ User dialed: CA..."
- "✅ Contact dialed: Contact Name CA..."
- "📡 Conference status webhook: {event: 'participant-join'}"

✅ **In Database:**
- `emergency_conferences` table has new row
- `conference_participants` table has rows for user + contacts
- Status changes from 'calling' → 'ringing' → 'in_conference'

✅ **On Phone:**
- User's phone rings
- All contact phones ring simultaneously (not one-by-one)
- Everyone can hear each other when they answer

---

## 🐛 Common Issues

### "Twilio credentials not configured"

**Fix:**
```bash
# Set in Supabase Dashboard → Settings → Edge Functions → Secrets
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

### "Conference not found"

**Cause:** Migration not run or conference creation failed

**Fix:**
1. Check database: `SELECT * FROM emergency_conferences;`
2. Check logs: `supabase functions logs emergency-conference`
3. Re-run migration if table missing

### Webhook not receiving events

**Cause:** JWT verification enabled on `conference-status`

**Fix:**
1. Go to Supabase Dashboard
2. Edge Functions → conference-status → Settings
3. Disable "Enforce JWT verification"
4. Save

### Sequential calling instead of simultaneous

**Cause:** Using old `emergency-sos-enhanced` function

**Fix:**
Use `emergency-sos-conference` instead (new one)

---

## 💡 Pro Tips

### Test with Real Phones

Use **Twilio Test Credentials** if you don't want to use real numbers yet:
- Phone: +15005550006 (valid test number)
- All calls will be simulated but won't actually dial

### Monitor in Real-Time

Open three browser tabs:
1. Supabase Dashboard → Table Editor → emergency_conferences
2. Supabase Dashboard → Table Editor → conference_participants
3. Your app with LiveConferenceDashboard

Press SOS and watch all three update in real-time!

### Debug Mode

Add logging to your hook:

```tsx
const { conferenceStatus } = useEmergencyConference({ incidentId });

useEffect(() => {
  console.log('Conference status:', conferenceStatus);
}, [conferenceStatus]);
```

---

## 🎯 Success Checklist

- [ ] Database migration applied
- [ ] Three functions deployed
- [ ] JWT verification disabled on conference-status
- [ ] Twilio credentials configured
- [ ] Test call completed successfully
- [ ] All phones rang simultaneously
- [ ] Dashboard shows live updates
- [ ] Participants can hear each other
- [ ] Database records created correctly

---

## 📞 Next: Add Your Real Numbers

Edit your user profile:

```sql
-- Add your phone number
UPDATE profiles
SET phone = '+1234567890'
WHERE user_id = 'your-user-id';

-- Add emergency contacts
UPDATE profiles
SET emergency_contacts = '[
  {"name": "Mom", "phone": "+0987654321", "email": "mom@example.com"},
  {"name": "Dad", "phone": "+1122334455", "email": "dad@example.com"}
]'::jsonb
WHERE user_id = 'your-user-id';
```

Press SOS → Your phone + Mom's phone + Dad's phone all ring!

---

**That's it! Conference Bridge is live. 🎉**

Next up: Add Clara (AI Voice Agent) to coordinate the conference.
