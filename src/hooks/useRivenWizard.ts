import { useState, useCallback, useMemo } from "react";

export type CampaignGoal =
  | "brand_awareness"
  | "lead_generation"
  | "product_promotion"
  | "event_announcement"
  | "educational_content"
  | "customer_retention";

export type AudienceSegment =
  | "adult_children"
  | "active_seniors"
  | "health_families"
  | "businesses"
  | "general_public";

export type ToneOption =
  | "warm_reassuring"
  | "professional_authoritative"
  | "urgent_action"
  | "friendly_conversational"
  | "educational_informative";

export interface PlatformConfig {
  enabled: boolean;
  posts_per_day: number;
  times: string[];
  days: "all" | "weekdays" | "weekends";
}

export interface WeekTheme {
  week: number;
  title: string;
  description: string;
  pillars: string[];
}

export interface WizardState {
  step: number;
  goal: CampaignGoal | null;
  audiences: AudienceSegment[];
  tone: ToneOption | null;
  platforms: Record<string, PlatformConfig>;
  duration: number;
  weeklyThemes: WeekTheme[];
  startDate: string;
  campaignTitle: string;
  previewApproved: boolean;
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  enabled: false,
  posts_per_day: 1,
  times: ["12:00"],
  days: "all",
};

const ALL_PLATFORMS = [
  "twitter",
  "tiktok",
  "facebook",
  "linkedin",
  "instagram",
  "blog",
  "email",
] as const;

const DEFAULT_THEMES: WeekTheme[] = [
  {
    week: 1,
    title: "Awareness",
    description: "Introduce LifeLink to new audiences",
    pillars: ["brand story", "problem awareness", "emotional hook"],
  },
  {
    week: 2,
    title: "Social Proof",
    description: "Real stories, testimonials, trust signals",
    pillars: ["customer stories", "statistics", "expert endorsements"],
  },
  {
    week: 3,
    title: "Education",
    description: "How it works, features, benefits deep-dive",
    pillars: ["product features", "how-to guides", "comparisons"],
  },
  {
    week: 4,
    title: "Urgency & CTA",
    description: "Limited offer, sign up now, act today",
    pillars: ["special offers", "countdown", "direct CTA"],
  },
];

function getInitialState(): WizardState {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    step: 1,
    goal: null,
    audiences: [],
    tone: null,
    platforms: Object.fromEntries(
      ALL_PLATFORMS.map((p) => [p, { ...DEFAULT_PLATFORM_CONFIG }])
    ),
    duration: 30,
    weeklyThemes: DEFAULT_THEMES,
    startDate: tomorrow.toISOString().split("T")[0],
    campaignTitle: "",
    previewApproved: false,
  };
}

export function useRivenWizard() {
  const [state, setState] = useState<WizardState>(getInitialState);

  const totalSteps = 7;

  const setStep = useCallback((step: number) => {
    setState((s) => ({ ...s, step: Math.max(1, Math.min(totalSteps, step)) }));
  }, []);

  const nextStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.min(totalSteps, s.step + 1) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((s) => ({ ...s, step: Math.max(1, s.step - 1) }));
  }, []);

  const setGoal = useCallback((goal: CampaignGoal) => {
    setState((s) => ({ ...s, goal }));
  }, []);

  const toggleAudience = useCallback((segment: AudienceSegment) => {
    setState((s) => ({
      ...s,
      audiences: s.audiences.includes(segment)
        ? s.audiences.filter((a) => a !== segment)
        : [...s.audiences, segment],
    }));
  }, []);

  const setTone = useCallback((tone: ToneOption) => {
    setState((s) => ({ ...s, tone }));
  }, []);

  const togglePlatform = useCallback((platform: string) => {
    setState((s) => ({
      ...s,
      platforms: {
        ...s.platforms,
        [platform]: {
          ...s.platforms[platform],
          enabled: !s.platforms[platform]?.enabled,
        },
      },
    }));
  }, []);

  const selectAllPlatforms = useCallback(() => {
    setState((s) => ({
      ...s,
      platforms: Object.fromEntries(
        Object.entries(s.platforms).map(([key, val]) => [
          key,
          { ...val, enabled: true },
        ])
      ),
    }));
  }, []);

  const updatePlatformConfig = useCallback(
    (platform: string, config: Partial<PlatformConfig>) => {
      setState((s) => ({
        ...s,
        platforms: {
          ...s.platforms,
          [platform]: { ...s.platforms[platform], ...config },
        },
      }));
    },
    []
  );

  const setDuration = useCallback((duration: number) => {
    setState((s) => ({ ...s, duration }));
  }, []);

  const setWeeklyThemes = useCallback((themes: WeekTheme[]) => {
    setState((s) => ({ ...s, weeklyThemes: themes }));
  }, []);

  const updateTheme = useCallback((weekIndex: number, updates: Partial<WeekTheme>) => {
    setState((s) => ({
      ...s,
      weeklyThemes: s.weeklyThemes.map((t, i) =>
        i === weekIndex ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const addTheme = useCallback(() => {
    setState((s) => ({
      ...s,
      weeklyThemes: [
        ...s.weeklyThemes,
        {
          week: s.weeklyThemes.length + 1,
          title: "New Theme",
          description: "Describe this week's focus",
          pillars: [],
        },
      ],
    }));
  }, []);

  const removeTheme = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      weeklyThemes: s.weeklyThemes
        .filter((_, i) => i !== index)
        .map((t, i) => ({ ...t, week: i + 1 })),
    }));
  }, []);

  const setStartDate = useCallback((date: string) => {
    setState((s) => ({ ...s, startDate: date }));
  }, []);

  const setCampaignTitle = useCallback((title: string) => {
    setState((s) => ({ ...s, campaignTitle: title }));
  }, []);

  const setPreviewApproved = useCallback((approved: boolean) => {
    setState((s) => ({ ...s, previewApproved: approved }));
  }, []);

  const reset = useCallback(() => {
    setState(getInitialState());
  }, []);

  // Derived state
  const enabledPlatforms = useMemo(
    () =>
      Object.entries(state.platforms)
        .filter(([, cfg]) => cfg.enabled)
        .map(([name]) => name),
    [state.platforms]
  );

  const totalPosts = useMemo(() => {
    let total = 0;
    for (const [, config] of Object.entries(state.platforms)) {
      if (!config.enabled) continue;
      let activeDays = state.duration;
      if (config.days === "weekdays") activeDays = Math.floor(state.duration * (5 / 7));
      if (config.days === "weekends") activeDays = Math.floor(state.duration * (2 / 7));
      total += config.posts_per_day * activeDays;
    }
    return total;
  }, [state.platforms, state.duration]);

  const canProceed = useMemo(() => {
    switch (state.step) {
      case 1:
        return state.goal !== null;
      case 2:
        return state.audiences.length > 0 && state.tone !== null;
      case 3:
        return enabledPlatforms.length > 0;
      case 4:
        return state.duration > 0 && totalPosts > 0;
      case 5:
        return state.weeklyThemes.length > 0;
      case 6:
        return state.previewApproved;
      case 7:
        return true;
      default:
        return false;
    }
  }, [state, enabledPlatforms, totalPosts]);

  // Build the payload for the edge function
  const buildPayload = useCallback(() => {
    const platformSchedules: Record<string, { posts_per_day: number; times: string[]; days: string }> = {};
    for (const [name, config] of Object.entries(state.platforms)) {
      if (!config.enabled) continue;
      platformSchedules[name] = {
        posts_per_day: config.posts_per_day,
        times: config.times,
        days: config.days,
      };
    }

    return {
      goal: state.goal!,
      tone: state.tone!,
      audiences: state.audiences,
      platforms: platformSchedules,
      duration_days: state.duration,
      weekly_themes: state.weeklyThemes,
      start_date: state.startDate,
      title: state.campaignTitle || `${state.goal} Campaign`,
    };
  }, [state]);

  return {
    state,
    totalSteps,
    enabledPlatforms,
    totalPosts,
    canProceed,
    setStep,
    nextStep,
    prevStep,
    setGoal,
    toggleAudience,
    setTone,
    togglePlatform,
    selectAllPlatforms,
    updatePlatformConfig,
    setDuration,
    setWeeklyThemes,
    updateTheme,
    addTheme,
    removeTheme,
    setStartDate,
    setCampaignTitle,
    setPreviewApproved,
    reset,
    buildPayload,
  };
}
