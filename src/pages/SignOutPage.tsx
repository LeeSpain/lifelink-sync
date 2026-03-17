import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function SignOutPage() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.signOut().then(() => {
      navigate('/', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-600">Signing out...</p>
      </div>
    </div>
  );
}
