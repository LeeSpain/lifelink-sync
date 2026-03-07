import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifelinksync.app',
  appName: 'LifeLink Sync',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: process.env.NODE_ENV === 'development' ? {
    url: 'https://a856a70f-639b-4212-b411-d2cdb524d754.lovableproject.com?forceHideBadge=true',
    cleartext: true
  } : undefined,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#ef4444",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      useDialog: false
    },
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 30000,
      permissions: {
        android: [
          "android.permission.ACCESS_FINE_LOCATION"
        ],
        ios: [
          "NSLocationWhenInUseUsageDescription"
        ]
      }
    },
    App: {
      permissions: {
        android: [
          "android.permission.INTERNET",
          "android.permission.ACCESS_NETWORK_STATE",
          "android.permission.VIBRATE"
        ]
      }
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#ef4444"
    }
  }
};

export default config;