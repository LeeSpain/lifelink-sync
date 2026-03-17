import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Activating your account...');

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let unsubscribe: (() => void) | null = null;

    const handleCallback = async () => {
      try {
        // Wait briefly for Supabase to process the hash token
        await new Promise(r => setTimeout(r, 500));

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          await routeUser(session.user.id);
          return;
        }

        // No session yet — listen for auth state change
        setStatus('Confirming your email...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            subscription.unsubscribe();
            await routeUser(session.user.id);
          }
        });
        unsubscribe = () => subscription.unsubscribe();

        // Safety timeout — if nothing fires in 8s, go to /auth
        timeout = setTimeout(() => {
          subscription.unsubscribe();
          navigate('/auth', { replace: true });
        }, 8000);
      } catch (err) {
        console.error('Auth callback error:', err);
        navigate('/auth', { replace: true });
      }
    };

    const routeUser = async (userId: string) => {
      try {
        // Check if onboarding is done
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, first_name, role')
          .eq('user_id', userId)
          .maybeSingle();

        // Admin always goes to admin dashboard
        if (profile?.role === 'admin') {
          setStatus('Welcome back!');
          setTimeout(() => navigate('/admin-dashboard', { replace: true }), 300);
          return;
        }

        const isDone = profile?.onboarding_completed || (profile?.first_name && profile.first_name.length > 0);

        if (isDone) {
          // Mark complete if first_name exists but flag wasn't set
          if (!profile?.onboarding_completed && profile?.first_name) {
            await supabase.from('profiles').update({ onboarding_completed: true }).eq('user_id', userId).catch(() => {});
          }
          setStatus('Welcome back! Taking you to your dashboard...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 300);
        } else {
          setStatus("Welcome to LifeLink Sync! Let's get you set up...");
          setTimeout(() => navigate('/onboarding', { replace: true }), 500);
        }
      } catch {
        // On error, go to dashboard and let DashboardRedirect handle it
        navigate('/dashboard', { replace: true });
      }
    };

    handleCallback();

    return () => {
      if (timeout) clearTimeout(timeout);
      if (unsubscribe) unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4 text-white text-xl">
          🛡️
        </div>
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 font-medium">{status}</p>
      </div>
    </div>
  );
}
