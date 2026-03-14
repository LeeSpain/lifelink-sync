# CONCERNS.md — LifeLink Sync Technical Concerns & Debt

Last Updated: 2026-03-14

---

## CRITICAL SECURITY CONCERNS

### 1. Hardcoded Credentials in Supabase Client
**File**: `/src/integrations/supabase/client.ts`
**Severity**: HIGH
**Issue**: Publishable Supabase API key and URL are hardcoded with fallback values in source code:
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://cprbgquiqbyoyrffznny.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_wyjo5Wsjre-vUzLEH02y4A_Rnao0LGD";
```
**Risk**: While Supabase anon keys are intended to be public, hardcoding project URLs allows attackers to target your infrastructure. Also visible in `.env.example`.

**Recommendation**:
- Remove fallback hardcoded values entirely (throw error if env var missing)
- Keep .env.example free of real values (use placeholders)
- Rotate the publishable key to prevent unauthorized access to the specific project

---

### 2. Content Security Policy Allows `unsafe-inline` and `unsafe-eval`
**File**: `/vercel.json`
**Severity**: HIGH
**Issue**: CSP header contains dangerous directives:
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com
style-src 'self' 'unsafe-inline'
```
**Risk**: Negates XSS protection. Any attacker injecting a style or script tag can execute arbitrary code.

**Recommendation**:
- Remove `'unsafe-inline'` and `'unsafe-eval'` from script-src
- Use nonces or hashes for critical inline scripts (Stripe integration)
- Move inline styles to external CSS files or CSS-in-JS
- Use Stripe's recommended CSP configuration

---

### 3. localStorage Used for Session Persistence
**File**: `/src/integrations/supabase/client.ts`
**Severity**: MEDIUM
**Issue**: Auth tokens persisted to localStorage which is vulnerable to XSS:
```typescript
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
}
```
**Risk**: If XSS occurs (e.g., via unsafe-inline CSP), attacker can steal auth tokens.

**Recommendation**:
- Consider using httpOnly cookies via a custom storage adapter or backend session management
- If localStorage is necessary, ensure CSP is strict and XSS vulnerabilities are eliminated
- Implement token rotation on sensitive operations (payments, emergency contacts)

---

### 4. Permissive Permissions-Policy Header
**File**: `/vercel.json`
**Severity**: MEDIUM
**Issue**: Microphone access allowed:
```
Permissions-Policy: camera=(), microphone=(self), geolocation=(self)
```
**Risk**: Any third-party script can request microphone/location access. For emergency app, this is especially risky.

**Recommendation**:
- Restrict to `microphone=()` and `geolocation=()` unless explicitly needed
- If needed, implement explicit user prompts and permission checks in code
- Document why each permission is required

---

## DATABASE CONCERNS

### 5. Missing Indexes on Critical Lookup Columns
**Severity**: MEDIUM
**Observation**: While some indexes exist, the following high-traffic columns may lack indexes:
- Foreign key joins (user_id, circle_id, profile_id) in hot tables
- Timestamp-based range queries (created_at, updated_at filters)
- Status/state columns used in WHERE clauses frequently

**Recommendation**:
- Run analysis on slow queries in Supabase dashboard
- Add composite indexes for common filter combinations
- Monitor query performance after each migration

---

### 6. RLS Policy Complexity & Potential Gaps
**Severity**: MEDIUM
**Observation**: 127 instances of CREATE OR REPLACE FUNCTION in migrations. Complex nested queries in RLS policies.

**Risk**:
- `circle_permissions.can_view_location` mentioned in MEMORY.md as NOT ENFORCED in code
- RLS policies using `EXISTS (SELECT 1 FROM profiles...)` may have race conditions or subtle bugs
- Admin bypass policies using role checks could be vulnerable if role assignment is not protected

**Recommendation**:
- Document all RLS policies and their threat models
- Add automated tests for RLS enforcement (e.g., attempt to read other user's data)
- Audit admin role assignment flow (how is someone marked as admin?)
- Use parameterized row-level checks instead of complex subqueries

---

### 7. Data Deletion Patterns Without Soft Deletes
**Severity**: MEDIUM
**Observation**: Multiple migrations use hard DELETE statements:
- `DELETE FROM public.conversations WHERE user_id IS NULL`
- `DELETE FROM public.security_events` (cleanup triggers)
- `DELETE FROM live_locations` (cleanup queries)

**Risk**:
- No audit trail for deleted records
- Emergency SOS data (7-year retention requirement) could be accidentally deleted
- Compliance issues if a user requests data deletion but it's already gone

**Recommendation**:
- Implement soft delete pattern (add `deleted_at` column) for critical tables
- Use triggers to archive to audit log before hard deletion
- Ensure SOS events table has immutable hard deletes only after 7-year retention window

---

### 8. Unused Migration Files & Schema Cruft
**Severity**: LOW
**Observation**: 241 migration files, many with non-descriptive UUIDs. Old canvas-map migrations exist but are no longer used (per MEMORY.md).

**Recommendation**:
- Document which tables are truly active vs. deprecated
- Clean up unused columns/tables (e.g., old canvas map columns)
- Create a deprecation policy for future cleanup

---

## PERFORMANCE CONCERNS

### 9. Bundle Size Not Monitored
**Severity**: MEDIUM
**Issue**: Large dependencies loaded:
- maplibre-gl (vector mapping)
- react-big-calendar (large calendar library)
- recharts (charting)
- Multiple Radix UI components
- Capacitor + all platform-specific plugins

**Risk**:
- Initial load time impacts emergency response (critical for SOS app)
- Mobile users on slower connections experience delays

**Recommendation**:
- Implement bundle size monitoring in CI/CD
- Use code splitting for admin/dashboard features
- Lazy load map libraries on-demand
- Consider lighter alternatives (e.g., replace react-big-calendar if possible)
- Measure Core Web Vitals weekly

---

### 10. No Memoization or Virtualization Strategy Documented
**Severity**: LOW
**Observation**: Large component tree without clear re-render prevention. VirtualizedList exists in admin but no mention of usage elsewhere.

**Recommendation**:
- Profile React renders in DevTools
- Add React.memo() to frequently-rendered list items
- Document when virtualization is critical (e.g., 1000+ emergency contacts)

---

### 11. Admin Dashboard May Cause Performance Issues
**Severity**: MEDIUM
**Observation**: 100+ admin component files suggest a large, monolithic dashboard. Complexity evident from names like:
- AdvancedAnalyticsDashboard, CampaignAnalyticsDashboard, AnalyticsDashboard (multiple analytics?)
- Multiple "RealTime" components (may have unmanaged subscriptions)

**Risk**:
- Memory leaks from uncleanedupSubcriptions
- Slow page load for admins
- Difficult to maintain

**Recommendation**:
- Audit and consolidate overlapping analytics components
- Ensure all Supabase subscriptions have cleanup in useEffect
- Consider splitting admin dashboard into separate lazy-loaded routes
- Profile with DevTools Profiler monthly

---

## TRANSLATION & INTERNATIONALIZATION

### 12. Known Translation Gaps (From CLAUDE.md)
**Severity**: MEDIUM
**Status**: Documented in CLAUDE.md — not yet fixed

**Missing translations**:
1. CLARA AI chat widget
2. "How It Works" modal/popup
3. Hero section phone mockup overlay text
4. Spain regional partner section
5. Pendant page copy

**Risk**: Users in ES/NL experience partial English UI.

**Recommendation**:
- Audit codebase for hardcoded strings (search for direct <span> with text, not t() calls)
- Wire CLARA chat to useLanguage() context
- Test language switching end-to-end for each language
- Add pre-deployment check: no <span>Email</span> without t() wrapper

---

### 13. Forgotten Password Link Missing
**Severity**: MEDIUM
**Issue**: Login page lacks "Forgot Password?" link per CLAUDE.md.

**Recommendation**:
- Implement password reset flow with email verification
- Add translations for reset success/error states
- Test email delivery before launch

---

## CODE QUALITY CONCERNS

### 14. Large Admin Component Files
**Severity**: LOW
**Observation**: Admin directory has 100+ component files. Some files likely exceed 500 lines.

**Recommendation**:
- Measure file sizes: `wc -l src/components/admin/*.tsx`
- Break down oversized components into smaller, testable units
- Extract shared admin patterns into a utilities library

---

### 15. No TypeScript Strict Mode Validation Visible
**Severity**: LOW
**Observation**: tsconfig likely has strict mode, but no evidence of eslint rules enforcing it.

**Recommendation**:
- Add `strict: true` to tsconfig (if not already)
- Add eslint rule: `@typescript-eslint/no-explicit-any`
- Ensure build fails if any type errors present

---

### 16. Error Handling Not Standardized
**Severity**: MEDIUM
**Issue**: No consistent error handling pattern visible for:
- Supabase query errors
- Stripe payment failures
- Network timeouts
- Emergency SOS failures (CRITICAL!)

**Risk**: Users may silently fail to send SOS or add emergency contacts.

**Recommendation**:
- Create `src/lib/errorHandler.ts` with standardized error logging
- Wrap all critical operations (SOS, payments, contacts) in try/catch with user feedback
- Log to Sentry for production monitoring
- Test error states explicitly (e.g., "what happens if Supabase is down?")

---

### 17. No Visible Error Boundary for SOS Page
**Severity**: HIGH
**Issue**: SOS app failure could be catastrophic. No evidence of error boundaries on `/sos-app`.

**Recommendation**:
- Wrap SOSAppPage in a dedicated error boundary
- Ensure fallback UI can still send SOS (offline-first approach)
- Test SOS button with network disabled

---

## MISSING FEATURES & INCOMPLETE IMPLEMENTATIONS

### 18. Map System Migration Completed but Not Fully Tested
**Severity**: MEDIUM
**Issue**: MapLibre migration completed (per MEMORY.md) but:
- Old canvas files still exist (not deleted)
- FamilyAppPage uses mock data, not real live_presence
- Emergency location fallback is hardcoded (Albox Spain)

**Recommendation**:
- Delete deprecated canvas map files
- Wire FamilyAppPage to real live_presence data
- Make emergency fallback location user-configurable
- Add automated tests for map rendering

---

### 19. live_presence vs live_locations Data Normalization
**Severity**: MEDIUM
**Issue**: Per MEMORY.md, data model is not normalized between presence and location tables.

**Risk**: Inconsistent data leading to stale location information.

**Recommendation**:
- Document the schema difference and reconciliation process
- Implement periodic sync job to keep tables in sync
- Add database-level constraints if only one should be authoritative

---

### 20. Multiple Analytics Implementations
**Severity**: LOW
**Observation**: Multiple dashboard components suggest redundant analytics implementations.

**Components Found**:
- AnalyticsDashboard, AdvancedAnalyticsDashboard, CRMAnalyticsComponent, CustomerAnalytics, CampaignAnalyticsDashboard, EmailAnalyticsDashboard

**Recommendation**:
- Consolidate into single analytics engine
- Document which is the source of truth
- Remove duplicates after migration

---

## OPERATIONAL CONCERNS

### 21. No Visible Logging/Monitoring Strategy
**Severity**: MEDIUM
**Issue**: SecurityMonitor, PerformanceMonitor, RealTimeAnalyticsDebugger exist but unclear if:
- Logs go to Sentry/CloudWatch
- Real-time alerts are configured
- SOS events are monitored for failures

**Recommendation**:
- Set up Sentry error tracking (referenced in .env.example)
- Add alerts for SOS failures and payment processing errors
- Implement application performance monitoring (APM)
- Log all auth failures and admin actions

---

### 22. No Deployment Checklist Visible
**Severity**: MEDIUM
**Issue**: vite.json and vercel.json exist but no documented deployment process.

**Recommendation**:
- Create `docs/deployment-checklist.md`
- Document pre-deployment tests (Stripe, Supabase, auth)
- Include rollback procedures
- Document environment variable requirements

---

### 23. Secret Rotation Not Documented
**Severity**: MEDIUM
**Issue**: Stripe keys, Supabase keys, API tokens exist but no rotation policy.

**Recommendation**:
- Document when each secret should be rotated
- Implement automated secret rotation (if possible)
- Store secrets in Vercel's built-in secret management, not .env

---

## KNOWN ISSUES FROM PROJECT FILES

### 24. Spain Regional Section Copy Still Mentions "Call Centre"
**File**: CLAUDE.md mentions this is legacy copy
**Severity**: MEDIUM
**Status**: Documented but unfixed
**Fix**: Replace "Professional Call Centre Support" with "24/7 AI Emergency Response"

---

### 25. Pendant Page Incorrect Copy
**File**: Device page
**Severity**: LOW
**Status**: Documented but unfixed
**Fix**: Replace "Works With Your Smart Home" with "Connects To Your Devices"

---

## MIGRATION & DEPLOYMENT RISKS

### 26. High Migration Count (241 Files)
**Severity**: MEDIUM
**Risk**:
- Hard to understand current schema state
- Long migration chains increase downtime risk
- Rollback becomes complex

**Recommendation**:
- Document final schema version (create schema diagram)
- Keep only essential migrations in production
- Archive old migrations to separate directory

---

### 27. No Database Backup & Recovery Plan Documented
**Severity**: HIGH
**Issue**: No evidence of automated backups or disaster recovery plan.

**Recommendation**:
- Enable Supabase automated backups
- Test restore process quarterly
- Document RTO/RPO for each data type
- Create incident runbook for data loss scenarios

---

## COMPLIANCE & LEGAL

### 28. GDPR/HIPAA Data Handling Not Enforced in Code
**Severity**: HIGH
**Issue**: Medical data stored (medical_info table) but:
- No evidence of encryption at rest
- No data retention policies enforced
- No audit logs for data access

**Recommendation**:
- Implement end-to-end encryption for medical data
- Add audit logging (who accessed what, when)
- Document data retention periods by jurisdiction
- Add GDPR data deletion workflow (right to be forgotten)

---

### 29. 7-Year SOS Event Retention Not Automated
**Severity**: MEDIUM
**Issue**: CLAUDE.md mentions 7-year legal requirement but no automated deletion policy visible.

**Recommendation**:
- Implement automatic archival after 7 years
- Move archived data to cold storage
- Document compliance evidence for auditors

---

## SUMMARY TABLE

| # | Category | Severity | Status | Owner |
|---|----------|----------|--------|-------|
| 1 | Hardcoded Credentials | HIGH | Unfixed | Backend |
| 2 | CSP unsafe-inline | HIGH | Unfixed | Security |
| 3 | localStorage Auth | MEDIUM | Unfixed | Security |
| 4 | Permissions-Policy | MEDIUM | Unfixed | Security |
| 5 | Missing DB Indexes | MEDIUM | Partial | Database |
| 6 | RLS Gaps | MEDIUM | Unfixed | Database |
| 7 | Hard Deletes | MEDIUM | Unfixed | Database |
| 8 | Migration Cruft | LOW | Unfixed | DevOps |
| 9 | Bundle Size | MEDIUM | Unfixed | Frontend |
| 10 | Re-render Strategy | LOW | Unfixed | Frontend |
| 11 | Admin Dashboard Perf | MEDIUM | Unfixed | Frontend |
| 12 | Translation Gaps | MEDIUM | Unfixed | Frontend |
| 13 | Forgot Password | MEDIUM | Unfixed | Frontend |
| 14 | Large Components | LOW | Unfixed | Frontend |
| 15 | TypeScript Config | LOW | Unfixed | DevOps |
| 16 | Error Handling | MEDIUM | Unfixed | Backend |
| 17 | No Error Boundary SOS | HIGH | Unfixed | Frontend |
| 18 | Map Migration Testing | MEDIUM | Partial | Frontend |
| 19 | Data Normalization | MEDIUM | Unfixed | Database |
| 20 | Duplicate Analytics | LOW | Unfixed | Frontend |
| 21 | No Logging Strategy | MEDIUM | Unfixed | DevOps |
| 22 | No Deploy Checklist | MEDIUM | Unfixed | DevOps |
| 23 | Secret Rotation | MEDIUM | Unfixed | Security |
| 24 | Spain Copy | MEDIUM | Unfixed | Content |
| 25 | Pendant Copy | LOW | Unfixed | Content |
| 26 | High Migration Count | MEDIUM | Unfixed | Database |
| 27 | No Backup Plan | HIGH | Unfixed | DevOps |
| 28 | GDPR/HIPAA | HIGH | Unfixed | Compliance |
| 29 | 7-Year Retention | MEDIUM | Unfixed | Compliance |

---

## NEXT STEPS (PRIORITY ORDER)

### Week 1: Critical Security
1. Remove hardcoded credentials
2. Refine CSP to remove unsafe-inline
3. Implement error boundary on SOS page
4. Set up backup/recovery plan

### Week 2: Compliance
1. Audit medical data storage (encryption)
2. Implement 7-year auto-deletion for SOS events
3. Add audit logging for data access
4. Document GDPR procedures

### Week 3: Quality
1. Complete translation audit
2. Consolidate analytics components
3. Add error handling patterns
4. Profile bundle size

### Ongoing
1. Monitor RLS policies for gaps
2. Track performance metrics
3. Rotate secrets quarterly
4. Review error logs daily

---

*Maintainer: LeeSpain*
*Last Reviewed: 2026-03-14*
