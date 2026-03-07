import { trackCustomEvent } from '@/hooks/usePageTracking';

export interface ConversionStep {
  name: string;
  completed: boolean;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface ConversionFunnel {
  funnelId: string;
  userId?: string;
  sessionId: string;
  steps: ConversionStep[];
  currentStep: number;
  completed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

class ConversionTracker {
  private funnels = new Map<string, ConversionFunnel>();

  startFunnel(funnelId: string, steps: string[], userId?: string): string {
    const sessionId = sessionStorage.getItem('analytics_session_id') || crypto.randomUUID();
    
    const funnel: ConversionFunnel = {
      funnelId,
      userId,
      sessionId,
      steps: steps.map(name => ({ name, completed: false })),
      currentStep: 0,
      completed: false,
      startedAt: new Date()
    };

    this.funnels.set(sessionId + '_' + funnelId, funnel);
    
    // Track funnel start
    trackCustomEvent('conversion_funnel_started', {
      funnel_id: funnelId,
      steps: steps,
      user_id: userId,
      session_id: sessionId
    });

    return sessionId + '_' + funnelId;
  }

  completeStep(funnelKey: string, stepName: string, metadata?: Record<string, any>): void {
    const funnel = this.funnels.get(funnelKey);
    if (!funnel) return;

    const stepIndex = funnel.steps.findIndex(step => step.name === stepName);
    if (stepIndex === -1) return;

    // Mark step as completed
    funnel.steps[stepIndex].completed = true;
    funnel.steps[stepIndex].timestamp = new Date();
    funnel.steps[stepIndex].metadata = metadata;

    // Update current step
    funnel.currentStep = Math.max(funnel.currentStep, stepIndex + 1);

    // Check if funnel is completed
    const allCompleted = funnel.steps.every(step => step.completed);
    if (allCompleted && !funnel.completed) {
      funnel.completed = true;
      funnel.completedAt = new Date();
      
      trackCustomEvent('conversion_funnel_completed', {
        funnel_id: funnel.funnelId,
        user_id: funnel.userId,
        session_id: funnel.sessionId,
        duration_ms: funnel.completedAt.getTime() - funnel.startedAt.getTime(),
        steps_completed: funnel.steps.length
      });
    }

    // Track individual step completion
    trackCustomEvent('conversion_step_completed', {
      funnel_id: funnel.funnelId,
      step_name: stepName,
      step_index: stepIndex,
      user_id: funnel.userId,
      session_id: funnel.sessionId,
      metadata
    });

    this.funnels.set(funnelKey, funnel);
  }

  getFunnel(funnelKey: string): ConversionFunnel | undefined {
    return this.funnels.get(funnelKey);
  }

  getAllFunnels(): ConversionFunnel[] {
    return Array.from(this.funnels.values());
  }

  abandonFunnel(funnelKey: string, reason?: string): void {
    const funnel = this.funnels.get(funnelKey);
    if (!funnel || funnel.completed) return;

    trackCustomEvent('conversion_funnel_abandoned', {
      funnel_id: funnel.funnelId,
      user_id: funnel.userId,
      session_id: funnel.sessionId,
      last_step: funnel.currentStep,
      total_steps: funnel.steps.length,
      reason,
      duration_ms: new Date().getTime() - funnel.startedAt.getTime()
    });

    this.funnels.delete(funnelKey);
  }
}

// Global instance
export const conversionTracker = new ConversionTracker();

// Predefined funnels for LifeLink Sync
export const FUNNELS = {
  TRIAL_SIGNUP: 'trial_signup',
  FULL_REGISTRATION: 'full_registration',
  FAMILY_SETUP: 'family_setup',
  SOS_ACTIVATION: 'sos_activation'
};

export const FUNNEL_STEPS = {
  [FUNNELS.TRIAL_SIGNUP]: [
    'popup_shown',
    'form_started',
    'form_completed',
    'email_confirmed'
  ],
  [FUNNELS.FULL_REGISTRATION]: [
    'registration_started',
    'basic_info_completed',
    'emergency_contacts_added',
    'payment_completed',
    'account_activated'
  ],
  [FUNNELS.FAMILY_SETUP]: [
    'family_plan_selected',
    'family_members_invited',
    'first_member_joined',
    'all_members_joined'
  ],
  [FUNNELS.SOS_ACTIVATION]: [
    'sos_button_pressed',
    'location_captured',
    'contacts_notified',
    'emergency_resolved'
  ]
};

// Convenience functions
export function startTrialFunnel(userId?: string): string {
  return conversionTracker.startFunnel(
    FUNNELS.TRIAL_SIGNUP, 
    FUNNEL_STEPS[FUNNELS.TRIAL_SIGNUP], 
    userId
  );
}

export function completeTrialStep(funnelKey: string, step: string, metadata?: Record<string, any>): void {
  conversionTracker.completeStep(funnelKey, step, metadata);
}

export function startRegistrationFunnel(userId?: string): string {
  return conversionTracker.startFunnel(
    FUNNELS.FULL_REGISTRATION, 
    FUNNEL_STEPS[FUNNELS.FULL_REGISTRATION], 
    userId
  );
}

export function completeRegistrationStep(funnelKey: string, step: string, metadata?: Record<string, any>): void {
  conversionTracker.completeStep(funnelKey, step, metadata);
}