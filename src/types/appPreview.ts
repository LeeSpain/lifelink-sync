
export interface AppPreviewCard {
  icon: string;
  title: string;
  status: string;
  description: string;
}

export interface AppPreviewConfig {
  appName: string;
  tagline: string;
  primaryColor?: string;
  sosColor?: string;
  voiceLabel: string;
  sosLabel: string;
  sosSubLabel: string;
  cards: AppPreviewCard[];
  // Realtime card toggles
  showSettingsIcon?: boolean;
  enableBatteryCard?: boolean;
  enableHeartRateCard?: boolean;
  enableAiCard?: boolean;
  enableRemindersCard?: boolean;
}

export const getDefaultAppPreview = (): AppPreviewConfig => ({
  appName: "LifeLink Sync",
  tagline: "Tap once for immediate help",
  primaryColor: "#ef4444",
  sosColor: "#22c55e",
  voiceLabel: "Voice OFF",
  sosLabel: "Emergency SOS",
  sosSubLabel: "Tap for immediate help",
  cards: [
    { icon: "battery", title: "Device Battery", status: "88%", description: "Bluetooth device status" },
  ],
  showSettingsIcon: true,
  enableBatteryCard: true,
  enableHeartRateCard: false,
  enableAiCard: false,
  enableRemindersCard: false,
});
