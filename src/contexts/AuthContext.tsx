import * as React from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from '@/utils/security';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Dev bypass mock user for testing without authentication
const DEV_MOCK_USER = {
  id: 'dev-test-user-00000000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dev@lifelink-sync.com',
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { first_name: 'Dev', last_name: 'Tester' },
  identities: [],
  factors: [],
} as unknown as User;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Check for dev bypass mode — also activate from ?dev=1 URL parameter
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      localStorage.setItem('dev_bypass', '1');
    }
  }
  const devBypass = typeof window !== 'undefined' && localStorage.getItem('dev_bypass') === '1';

  // Dev bypass effect: activate mock user when devBypass changes (e.g. navigating with ?dev=1)
  React.useEffect(() => {
    if (devBypass) {
      console.log('🔧 Dev bypass active: using mock user');
      setUser(DEV_MOCK_USER);
      setSession(null);
      setLoading(false);
    }
  }, [devBypass]);

  React.useEffect(() => {
    // Dev bypass: skip real auth entirely
    if (devBypass) {
      return;
    }

    let mounted = true;
    let initialSessionLoaded = false;

    // Get initial session first with proper error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          // Force token refresh on authentication error
          if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('JWT')) {
            await supabase.auth.signOut();
            return;
          }
        }

        if (mounted && !initialSessionLoaded) {
          initialSessionLoaded = true;
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          console.log('✅ Initial session loaded:', session?.user?.id || 'no user');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted && !initialSessionLoaded) {
          initialSessionLoaded = true;
          setLoading(false);
        }
      }
    };

    // Set up auth state listener with proper guards
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.id || 'no user');

        // Skip INITIAL_SESSION to avoid double-setting from getInitialSession
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // Only update state if we have a meaningful change
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);

          // Log authentication events for security monitoring
          setTimeout(() => {
            if (event === 'SIGNED_IN' && session?.user) {
              logSecurityEvent('user_signin', {
                user_id: session.user.id,
                email: session.user.email,
                timestamp: new Date().toISOString(),
                ip_address: 'client_side',
                source: 'auth_context'
              });
            } else if (event === 'SIGNED_OUT') {
              logSecurityEvent('user_signout', {
                timestamp: new Date().toISOString(),
                source: 'auth_context'
              });
            } else if (event === 'TOKEN_REFRESHED') {
              logSecurityEvent('token_refresh', {
                user_id: session?.user?.id,
                timestamp: new Date().toISOString(),
                source: 'auth_context'
              });
            }
          }, 0);

          // Handle email confirmation status
          if (session?.user && !session.user.email_confirmed_at) {
            console.log('⚠️ User email not confirmed:', session.user.email);
            setTimeout(() => {
              logSecurityEvent('unconfirmed_email_access', {
                user_id: session.user.id,
                email: session.user.email,
                timestamp: new Date().toISOString()
              });
            }, 0);
          }
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [devBypass]);

  const signOut = async () => {
    try {
      const currentUserId = user?.id;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Log successful signout
      if (currentUserId) {
        setTimeout(() => {
          logSecurityEvent('user_signout_initiated', {
            user_id: currentUserId,
            timestamp: new Date().toISOString(),
            source: 'manual_signout'
          });
        }, 0);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      // Log failed signout attempt
      setTimeout(() => {
        logSecurityEvent('signout_failure', {
          user_id: user?.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }, 0);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};