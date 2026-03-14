# Commercial Build 2 — Family Seats

## Milestone Overview

**What**: Family seat billing frontend — the backend already exists.
**Status**: Planning — Phase 1 ready for execution approval.

### What Already Exists (DO NOT rebuild)
- `family_groups`, `family_memberships`, `family_invites` DB tables with RLS
- `family-subscription-checkout`, `process-family-payment`, `manage-addons` edge functions
- Stripe quantity billing (€2.99/month per seat, 1st seat free)
- `useFamilyMembers`, `useFamilyRole`, `useRealTimeFamily` hooks
- `FamilyAccessPanel`, `FamilyInviteModal`, `FamilyCircleOverview` components
- ~50+ family translation keys in EN/ES/NL

### What Must Not Break
- All existing individual subscribers
- All existing trial flows
- Annual pricing built in Commercial Build 1
- Current SOS/emergency flows

### Design Rules
- Use existing shadcn/ui components only
- Follow existing Tailwind patterns
- All text in EN, ES, NL translations
- CLARA training_data updated with family billing info

---

## Phase 1 — Guardian Dashboard Section

**Goal**: Owner can see all family members, their status, add-ons, billing total, and invite/remove controls — all in the existing dashboard "Family" tab area.

### What exists now
- `FamilyAccessPanel.tsx` already loads family_groups + family_memberships + family_invites
- `FamilyInviteModal.tsx` already has invite form (name, email, phone, relationship, billing_type)
- `useFamilyMembers` hook returns members[] + pendingInvites[]
- `useFamilyRole` hook returns owner/member/none
- Dashboard "Family" tab has subtabs: Connections, Live Map, Circles, Places, History

### Tasks

#### 1.1 — Enhance FamilyAccessPanel with billing summary
**File**: `src/components/dashboard/family/FamilyAccessPanel.tsx`
- Add billing summary card at top: "X seats active · Y owner-paid · Z self-paid · Total: €X.XX/month"
- Use existing `dashboard.billingSummary`, `dashboard.ownerPaidSeats` translation keys
- Query `member_addons` where addon_slug='family_link' for quantity + free_units
- Show "1 free seat included" badge on first member
- Show per-member cost breakdown

#### 1.2 — Member list with status + actions
**File**: `src/components/dashboard/family/FamilyAccessPanel.tsx`
- Each member card shows: name, email, relationship, billing_type badge, status badge
- Action buttons per member: "Remove" (with confirmation dialog)
- Pending invites show: "Pending" badge, "Resend" + "Cancel" buttons
- Use existing `useFamilyMemberActions()` hook (resendInvite, cancelInvite, removeMember)
- Add-on status per member: show which add-ons are active (wellbeing, medication)

#### 1.3 — Add-on management per member
**File**: New component `src/components/dashboard/family/MemberAddonManager.tsx`
- Dropdown or toggle per member for: Daily Wellbeing, Medication Reminder
- Calls existing `manage-addons` edge function with action='add'|'remove'
- Shows CLARA Complete badge if both add-ons active
- Price display: "+€2.99/mo each"

#### 1.4 — Translations for Phase 1
**Files**: `src/locales/{en,es,nl}/common.json`
- New keys under `familySeats.*`:
  - `familySeats.billingSummary` — "Billing Summary"
  - `familySeats.seatsActive` — "{{count}} seats active"
  - `familySeats.ownerPaid` — "Owner-paid"
  - `familySeats.selfPaid` — "Self-paid"
  - `familySeats.totalMonthly` — "Total: {{amount}}/month"
  - `familySeats.freeSeatIncluded` — "1 free seat included"
  - `familySeats.removeMember` — "Remove member"
  - `familySeats.removeConfirm` — "Are you sure? This will cancel their seat."
  - `familySeats.resendInvite` — "Resend invite"
  - `familySeats.cancelInvite` — "Cancel invite"
  - `familySeats.pendingInvite` — "Pending"
  - `familySeats.addonActive` — "Active"
  - `familySeats.addonAdd` — "Add"
  - `familySeats.addonRemove` — "Remove"
  - All in EN + ES + NL

#### 1.5 — CLARA training data for family billing
**File**: New migration `supabase/migrations/20260315000000_clara_family_training.sql`
- Insert training_data rows for:
  - "How does family billing work?"
  - "How do I add a family member?"
  - "How do I remove a family member?"
  - "What does the first free seat mean?"
  - "Can family members pay for themselves?"

### Files Changed (Phase 1)
| File | Change |
|------|--------|
| `src/components/dashboard/family/FamilyAccessPanel.tsx` | Billing summary + enhanced member list |
| `src/components/dashboard/family/MemberAddonManager.tsx` | NEW — per-member addon toggles |
| `src/locales/en/common.json` | ~15 new familySeats.* keys |
| `src/locales/es/common.json` | ~15 new familySeats.* keys |
| `src/locales/nl/common.json` | ~15 new familySeats.* keys |
| `supabase/migrations/20260315000000_clara_family_training.sql` | NEW — 5 training rows |

### Verification (Phase 1)
- [ ] Owner sees billing summary with correct seat count + total
- [ ] Free seat shows "included" badge
- [ ] Owner-paid vs self-paid badges display correctly
- [ ] Remove member shows confirmation, calls edge function, refreshes list
- [ ] Resend/cancel invite buttons work via useFamilyMemberActions
- [ ] Add-on toggles per member call manage-addons correctly
- [ ] CLARA Complete badge appears when both add-ons active on a member
- [ ] All new text appears in EN, ES, NL
- [ ] `npm run build` passes with zero errors

---

## Phase 2 — Invite Flow (Owner Side)

**Goal**: Owner enters name + email, selects billing type, system creates invite + triggers email.

### Tasks
- 2.1 — Polish FamilyInviteModal with GDPR notice + billing type selector
- 2.2 — Wire email sending via Resend (currently TODO in edge function)
- 2.3 — Magic link generation with invite_token
- 2.4 — Invite confirmation screen + "invite sent" toast
- 2.5 — Translations for invite flow

---

## Phase 3 — Invite Acceptance Landing Page

**Goal**: Invited member clicks link, sees warm welcome, GDPR consent for adults, activates seat.

### Tasks
- 3.1 — New page: `/invite/:token` — FamilyInviteAcceptPage
- 3.2 — Token validation + invite details display
- 3.3 — GDPR consent step (checkbox + link to privacy policy)
- 3.4 — "Self-paid" flow redirects to Stripe checkout
- 3.5 — "Owner-paid" flow activates immediately
- 3.6 — Post-acceptance redirect to dashboard
- 3.7 — Expired/invalid token error states
- 3.8 — Translations for acceptance flow

---

## Phase 4 — Role-Based UI

**Goal**: Owner sees guardian view + their own CLARA. Members see their CLARA only.

### Tasks
- 4.1 — Dashboard conditional rendering based on useFamilyRole
- 4.2 — Owner: full Family tab with management controls
- 4.3 — Member: simplified Family tab (view only, no management)
- 4.4 — Member: own CLARA, own SOS, own medical profile
- 4.5 — Member: "Leave family" option
- 4.6 — Translations for role-specific UI

---

## Phase 5 — Edge Cases

**Goal**: Handle all edge cases gracefully.

### Tasks
- 5.1 — Owner downgrade warning: "You have X paid seats that will be canceled"
- 5.2 — Member leaving flow: confirmation → cancel membership → notify owner
- 5.3 — Expired invite resend: detect expired, offer resend button
- 5.4 — Payment failure banner: shown to all family members when billing fails
- 5.5 — Seat quota enforcement: prevent inviting beyond plan limit
- 5.6 — Translations for all edge case messages
