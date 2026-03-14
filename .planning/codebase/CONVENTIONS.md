# LifeLink Sync Coding Conventions

Document current coding standards, patterns, and best practices used throughout the LifeLink Sync codebase.

Last Updated: March 14, 2026

---

## 1. Import Patterns

### Using @ Alias (Required)
Always use the `@` alias for imports from the `src` directory. Never use relative paths.

```typescript
// ✅ Correct
import { supabase } from '@/integrations/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ❌ Wrong - never use relative paths
import { supabase } from '../../../integrations/supabase/client'
import Button from '../../components/ui/button'
```

### Named Exports
Components and hooks use named exports. Import them as named imports.

```typescript
// ✅ Correct - named export
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card' }) => { ... }
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// Default exports are acceptable for page components
export default function Dashboard() { ... }
```

### Supabase Client
Always import the Supabase client from the canonical location:

```typescript
import { supabase } from '@/integrations/supabase/client'
```

### React Hooks
Use the `react-i18next` hook for translations:

```typescript
import { useTranslation } from 'react-i18next'
```

---

## 2. Component Patterns

### Functional Components with TypeScript
All components are functional components using React.FC pattern with TypeScript interfaces.

```typescript
import React from 'react'

interface MyComponentProps {
  title: string
  count?: number
  className?: string
  onSubmit: (data: FormData) => void
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  count = 0,
  className = '',
  onSubmit,
}) => {
  return <div className={className}>{title}</div>
}

export default MyComponent
```

### Props Interface Pattern
- Define a `Props` or `{ComponentName}Props` interface
- Place it immediately before the component
- Mark optional props with `?`
- Provide default values in destructuring where applicable

```typescript
interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'list' | 'dashboard' | 'analytics' | 'form'
  count?: number
  className?: string
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 1,
  className = ''
}) => { ... }
```

### Callback Patterns
Use `useCallback` for event handlers and callbacks to prevent unnecessary re-renders:

```typescript
const handleLoad = useCallback(() => {
  setIsLoaded(true)
  setHasError(false)
}, [])

const handleError = useCallback(() => {
  setHasError(true)
  setCurrentSrc(placeholder)
}, [placeholder]) // Include dependencies that change
```

### useState Pattern
Use TypeScript to type state:

```typescript
const [isLoaded, setIsLoaded] = useState<boolean>(false)
const [locations, setLocations] = useState<LiveLocationData[]>([])
const [error, setError] = useState<string | null>(null)
```

### useRef for Persistent Values
Use refs for values that don't trigger re-renders:

```typescript
const watchId = useRef<number | null>(null)
const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
const lastLocationRef = useRef<GeolocationPosition | null>(null)
```

---

## 3. Styling Patterns

### Tailwind CSS Only
Use Tailwind CSS classes exclusively. No inline styles or CSS modules.

```typescript
// ✅ Correct
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
  {children}
</div>

// ❌ Wrong
<div style={{ backgroundColor: '#f5f5f5', padding: '24px' }}>
  {children}
</div>
```

### Using cn() Helper
Use the `cn()` utility from `@/lib/utils` for conditional class merging:

```typescript
import { cn } from '@/lib/utils'

const Component: React.FC<ComponentProps> = ({ disabled, className }) => {
  return (
    <button
      className={cn(
        'bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      Click me
    </button>
  )
}
```

### Common Tailwind Patterns
Consistent pattern usage across the codebase:

```typescript
// Cards
<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">

// Buttons/CTAs
className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg"

// Input fields
className="bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"

// Text variants
className="text-white" // primary
className="text-gray-400" // muted
className="text-gray-600" // subtle
```

### Responsive Design
Use Tailwind's responsive prefixes consistently:

```typescript
<div className="p-3 sm:p-6">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="w-full sm:w-1/2 md:w-1/3">
```

---

## 4. Translation Patterns

### Using useTranslation Hook
Use `react-i18next` hook for all user-facing text:

```typescript
import { useTranslation } from 'react-i18next'

export const MyComponent: React.FC = () => {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('section.keyName')}</h1>
      <p>{t('section.description')}</p>
      <button>{t('button.submit')}</button>
    </div>
  )
}
```

### Key Naming Convention
Use hierarchical dot-notation for translation keys:

```
auth.login
auth.register
auth.forgotPassword
nav.home
nav.features
clara.greeting
clara.placeholder
hero.title
dashboard.tabProfile
```

### Translation Files Location
Translation resources are stored in JSON files:
- `src/locales/en/common.json` (English)
- `src/locales/es/common.json` (Spanish)
- `src/locales/nl/common.json` (Dutch)

### i18n Initialization
Initialize i18next in `src/i18n/index.ts`:

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '@/locales/en/common.json'
import nl from '@/locales/nl/common.json'
import es from '@/locales/es/common.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
      es: { translation: es },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
```

### RULE: No Hardcoded English Strings
All user-visible strings must be translatable:

```typescript
// ✅ Correct
<button>{t('button.submit')}</button>

// ❌ Wrong - hardcoded English
<button>Submit</button>
```

---

## 5. Supabase Query Patterns

### Always Use Canonical Client
Import from the canonical location:

```typescript
import { supabase } from '@/integrations/supabase/client'
```

### Error Handling Pattern
Always destructure `data` and `error` and check for errors:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('first_name, last_name')
  .eq('user_id', user.id)
  .single()

if (error) throw error
if (!data) throw new Error('Profile not found')
```

### RLS and User Context
Rely on Row Level Security policies. Do not manually pass user IDs for filtering:

```typescript
// ✅ Correct - RLS policies handle filtering
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .single()

// ❌ Wrong - redundant, RLS already enforces this
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id) // Don't do this - let RLS handle it
  .single()
```

### Upsert Pattern
Use `.upsert()` for insert-or-update operations:

```typescript
const { error } = await supabase
  .from('live_locations')
  .upsert({
    user_id: user.id,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    updated_at: new Date().toISOString()
  })

if (error) throw error
```

### Realtime Subscriptions
Subscribe to table changes:

```typescript
const subscription = supabase
  .channel(`public:table_name:user_id=eq.${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'table_name',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      // Handle changes
    }
  )
  .subscribe()

// Cleanup
return () => {
  subscription.unsubscribe()
}
```

### TypeScript Types
Use auto-generated Supabase types from `src/integrations/supabase/types.ts`:

```typescript
import type { Database } from '@/integrations/supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']
type InsertProfile = Database['public']['Tables']['profiles']['Insert']
```

---

## 6. Error Handling Patterns

### Try-Catch with Error Throwing
Use try-catch for async operations and throw errors for upstream handling:

```typescript
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  if (!data) throw new Error('Profile not found')

  return data
} catch (error) {
  console.error('Profile fetch failed:', error)
  throw error
}
```

### State-based Error Management
Store error state for UI display:

```typescript
const [error, setError] = useState<string | null>(null)

const handleAction = async () => {
  setError(null)
  try {
    // Do something
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    setError(message)
  }
}
```

### Toast Notifications for Errors
Use the `useToast` hook for user feedback:

```typescript
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// In error handler
toast({
  title: 'Error',
  description: 'Failed to update profile',
  variant: 'destructive',
})
```

### Network Error Handler
Use provided network error handling utilities:

```typescript
import { withNetworkErrorHandling } from '@/utils/networkErrorHandler'

const result = await withNetworkErrorHandling(async () => {
  return await supabase.from('table').select('*')
})
```

### Console Logging Rules
Console methods are removed in production via esbuild config:

```typescript
// These will be stripped in production builds
console.log('debug info') // Removed
console.debug('info') // Removed
console.info('notice') // Removed
console.warn('warning') // Removed

// For production logging, use proper error tracking (e.g., Sentry)
```

---

## 7. File Naming Conventions

### Component Files
PascalCase for component filenames:

```
LoadingSkeleton.tsx
OptimizedImage.tsx
SEO.tsx
DashboardSidebar.tsx
MyComponent.tsx
```

### Hook Files
camelCase with `use` prefix:

```
useDebounce.ts
useEmergencySOS.ts
useLiveLocation.ts
useTranslation.ts (from react-i18next)
use-toast.ts (from shadcn/ui)
```

### Utility Files
camelCase:

```
networkErrorHandler.ts
appPreviewTranslations.ts
utils.ts
helpers.ts
```

### Type Definition Files
filename.types.ts or types.ts:

```
map.types.ts
types.ts
```

### Directory Structure
Organized by function:

```
src/
  components/          # Reusable UI components
    ui/                # shadcn/ui base components
    dashboard/         # Dashboard-specific components
    maplibre/          # Map-related components
    admin/             # Admin panel components
    mobile/            # Mobile-specific components
  pages/               # Route-level page components
  contexts/            # React contexts
  hooks/               # Custom React hooks
  lib/                 # Utilities and helpers
  utils/               # Helper functions
  integrations/        # External service integrations
    supabase/          # Supabase client and types
  i18n/                # i18n configuration
  locales/             # Translation files
    en/common.json
    es/common.json
    nl/common.json
```

---

## 8. Type Safety

### TypeScript Strict Mode Enabled
The project uses TypeScript strict mode. Avoid `any` types:

```typescript
// ✅ Correct
const data: ProfileData = await fetchProfile()
const items: string[] = []
const config: Record<string, string> = {}

// ❌ Wrong - avoid any
const data: any = await fetchProfile()
const items: any[] = []
```

### Interface vs Type
Use `interface` for object shapes, `type` for unions and complex types:

```typescript
// Interfaces
interface UserProfile {
  id: string
  firstName: string
  lastName: string
}

// Types for unions
type Status = 'online' | 'idle' | 'offline'
type Result<T> = { success: true; data: T } | { success: false; error: Error }
```

### Generic Constraints
Use type constraints for generic components/hooks:

```typescript
function useDebounce<T>(value: T, delay: number): T {
  // Implementation
}

interface ApiResponse<T extends Record<string, any>> {
  data: T
  status: number
}
```

---

## 9. Async/Await Patterns

### useEffect with Async Functions
Define async functions inside useEffect or use a wrapper:

```typescript
// ✅ Correct - wrapper function
useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await supabase.from('table').select('*')
      setData(result.data)
    } catch (err) {
      setError(err)
    }
  }

  fetchData()
}, [])

// ✅ Also correct - IIFE
useEffect(() => {
  (async () => {
    const result = await supabase.from('table').select('*')
    setData(result.data)
  })()
}, [])
```

### Promise Cleanup
Always cleanup subscriptions and timers:

```typescript
useEffect(() => {
  let timeout: NodeJS.Timeout | null = null

  const fetchData = async () => {
    // fetch
  }

  timeout = setTimeout(fetchData, 1000)

  return () => {
    if (timeout) clearTimeout(timeout)
  }
}, [])
```

---

## 10. Comments and Documentation

### Code Comments
Write comments for complex logic, not obvious code:

```typescript
// ✅ Good comment
// Calculate success rate after each update to show real-time metrics
const successRate = Math.round((successes / attempts) * 100)

// ❌ Bad comment - obvious
// Set the user name
setUserName(name)
```

### JSDoc for Exports
Use JSDoc for exported functions and components:

```typescript
/**
 * Loads skeleton UI based on the specified type
 * @param type - The skeleton layout type (card, table, list, etc.)
 * @param count - Number of skeleton items to render
 * @returns Rendered skeleton component
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count }) => {
  // Implementation
}
```

### TODO Comments
Use consistent format for TODOs:

```typescript
// TODO: Replace mock data with real data (Jira: TASK-123)
// FIXME: Handle edge case when location is unavailable
```

---

## 11. Performance Patterns

### Lazy Loading Images
Use OptimizedImage component for lazy-loaded images:

```typescript
import OptimizedImage from '@/components/OptimizedImage'

<OptimizedImage
  src="/image.jpg"
  alt="Description"
  priority={false}
  className="w-full h-auto"
/>
```

### React Query (TanStack Query)
For data fetching and caching:

```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['profiles', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  }
})
```

### Code Splitting
Dynamic imports for route-based code splitting:

```typescript
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const ProfileSettings = lazy(() => import('@/components/ProfileSettings'))

// Use with Suspense
<Suspense fallback={<LoadingSkeleton />}>
  <AdminDashboard />
</Suspense>
```

---

## 12. Testing (Current Status)

**No formal testing framework is configured in the project.**

The project uses:
- TypeScript strict mode for type safety
- ESLint for code quality
- Component-level validation through TypeScript

Recommendations for future testing:
- Consider adding Jest + React Testing Library
- Test critical paths: authentication, SOS activation, location updates
- Test hooks in isolation
- Integration tests for Supabase operations

See TESTING.md for detailed testing analysis.

---

## Summary of Key Rules

1. **Always use @ alias** for src imports
2. **Named exports for components**, default exports for pages
3. **Tailwind CSS only**, no inline styles
4. **useTranslation hook** for all user text
5. **TypeScript types required**, minimize `any` usage
6. **Error handling** with try-catch and proper messaging
7. **Functional components** with React.FC pattern
8. **No hardcoded English strings** - always translatable
9. **Supabase queries** check for errors always
10. **Callbacks** memoized with useCallback for performance

---

*Last Reviewed: March 14, 2026*
*Updated by: Claude Code Analysis*
