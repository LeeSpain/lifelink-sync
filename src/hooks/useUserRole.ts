import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'user' | 'admin';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchUserRole = async () => {
      if (!user) {
        console.log('👤 useUserRole: No user found');
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      console.log('👤 useUserRole: Fetching role for user:', user.id);
      
      // Keep loading true until we have a definitive result
      if (mounted) {
        setLoading(true);
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (error) {
          console.error('❌ useUserRole: Error fetching user role:', error);
          setRole('user'); // Default to user role on error
        } else if (!data) {
          console.warn('⚠️ useUserRole: No profile found for user, defaulting to user role');
          setRole('user');
        } else {
          const userRole = (data?.role as UserRole) || 'user';
          console.log('✅ useUserRole: Found role:', userRole, 'isAdmin:', userRole === 'admin');
          setRole(userRole);
        }
      } catch (error) {
        console.error('❌ useUserRole: Unexpected error:', error);
        if (mounted) {
          setRole('user'); // Default to user role on error
        }
      } finally {
        if (mounted) {
          console.log('👤 useUserRole: Setting loading to false');
          setLoading(false);
        }
      }
    };

    // Reset loading state when user changes
    if (user) {
      setLoading(true);
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isUser: role === 'user'
  };
};