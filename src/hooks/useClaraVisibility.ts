import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisibilityRule {
  route_pattern: string;
  is_visible: boolean;
}

// Fallback rules matching previous hardcoded behavior
const FALLBACK_RULES: VisibilityRule[] = [
  { route_pattern: '/admin-dashboard', is_visible: false },
  { route_pattern: '/member-dashboard', is_visible: false },
  { route_pattern: '/family-app', is_visible: false },
  { route_pattern: '/sos-app', is_visible: false },
];

export function useClaraVisibility() {
  const [rules, setRules] = useState<VisibilityRule[]>(FALLBACK_RULES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const { data, error } = await supabase
          .from('clara_visibility_rules')
          .select('route_pattern, is_visible');

        if (!error && data && data.length > 0) {
          setRules(data);
        }
      } catch {
        // Keep fallback rules on error
      } finally {
        setLoaded(true);
      }
    };

    loadRules();
  }, []);

  const isVisibleOnRoute = useCallback((pathname: string): boolean => {
    for (const rule of rules) {
      // Match exact path or prefix (e.g. '/admin-dashboard' matches '/admin-dashboard/settings')
      if (pathname === rule.route_pattern || pathname.startsWith(rule.route_pattern + '/')) {
        return rule.is_visible;
      }
    }
    // Default: visible on routes not covered by any rule
    return true;
  }, [rules]);

  return { isVisibleOnRoute, loaded };
}
