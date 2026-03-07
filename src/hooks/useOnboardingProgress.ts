import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingSteps {
  complete_profile: boolean;
  add_emergency_contacts: boolean;
  configure_sos_settings: boolean;
  invite_family: boolean;
  enable_notifications: boolean;
  run_sos_test: boolean;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  steps: OnboardingSteps;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_STEPS: OnboardingSteps = {
  complete_profile: false,
  add_emergency_contacts: false,
  configure_sos_settings: false,
  invite_family: false,
  enable_notifications: false,
  run_sos_test: false,
};

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProgress({
          ...data,
          steps: data.steps as unknown as OnboardingSteps,
        });
      } else {
        // Create initial progress record
        const { data: newData, error: insertError } = await supabase
          .from('onboarding_progress')
          .insert([{ user_id: user.id, steps: DEFAULT_STEPS as unknown as Record<string, boolean> }])
          .select()
          .single();

        if (insertError) throw insertError;
        setProgress({
          ...newData,
          steps: newData.steps as unknown as OnboardingSteps,
        });
      }
    } catch (err) {
      console.error('Error fetching onboarding progress:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateStep = async (stepKey: keyof OnboardingSteps, value: boolean) => {
    if (!progress) return;

    const newSteps = { ...progress.steps, [stepKey]: value };
    const allComplete = Object.values(newSteps).every(Boolean);

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({ 
          steps: newSteps as unknown as Record<string, boolean>,
          completed: allComplete,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', progress.user_id);

      if (error) throw error;

      setProgress({
        ...progress,
        steps: newSteps,
        completed: allComplete,
      });
    } catch (err) {
      console.error('Error updating onboarding step:', err);
    }
  };

  const markComplete = async () => {
    if (!progress) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({ 
          completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', progress.user_id);

      if (error) throw error;

      setProgress({ ...progress, completed: true });
    } catch (err) {
      console.error('Error marking onboarding complete:', err);
    }
  };

  const progressPercentage = progress
    ? Math.round((Object.values(progress.steps).filter(Boolean).length / 6) * 100)
    : 0;

  return {
    progress,
    loading,
    updateStep,
    markComplete,
    progressPercentage,
    refetch: fetchProgress,
  };
}
