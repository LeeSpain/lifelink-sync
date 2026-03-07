import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedUserRole } from './useOptimizedData';
import { useMemo } from 'react';

export function useOptimizedAuth() {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { data: role, isLoading: roleLoading } = useOptimizedUserRole();

  console.log('🔧 useOptimizedAuth Debug:', {
    userId: user?.id,
    userEmail: user?.email,
    fetchedRole: role,
    roleLoading,
    authLoading,
    timestamp: new Date().toISOString()
  });

  const isAdmin = useMemo(() => {
    const adminStatus = role === 'admin';
    console.log('🔧 useOptimizedAuth: isAdmin calculation:', { role, adminStatus });
    return adminStatus;
  }, [role]);
  
  const isUser = useMemo(() => role === 'user', [role]);
  
  // Wait for both auth and role; avoid defaulting to 'user' while role is loading
  const loading = authLoading || roleLoading;

  const finalRole = role || 'user'; // Default to 'user' to prevent undefined states
  
  console.log('🔧 useOptimizedAuth Final Values:', {
    role: finalRole,
    isAdmin,
    loading,
    userHasId: !!user?.id
  });

  return {
    user,
    session,
    role: finalRole,
    isAdmin,
    isUser,
    loading,
    signOut,
  };
}