import { useState, useEffect } from 'react';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export interface DeviceInfo {
  platform: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  model: string;
  isVirtual: boolean;
  webViewVersion?: string;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface AppState {
  isActive: boolean;
  urlOpen?: string;
  restoredResult?: any;
}

export function useNativeMobile() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [appState, setAppState] = useState<AppState>({ isActive: true });
  const [isNative, setIsNative] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeDevice();
    setupAppListeners();
    
    return () => {
      // Cleanup listeners
    };
  }, []);

  const initializeDevice = async () => {
    try {
      const info = await Device.getInfo();
      const batteryInfo = await Device.getBatteryInfo();
      
      setDeviceInfo({
        platform: info.platform,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        model: info.model,
        isVirtual: info.isVirtual,
        webViewVersion: info.webViewVersion,
        batteryLevel: batteryInfo.batteryLevel,
        isCharging: batteryInfo.isCharging,
      });
      
      setIsNative(info.platform !== 'web');
    } catch (error) {
      console.warn('Device info not available:', error);
      setIsNative(false);
    } finally {
      setLoading(false);
    }
  };

  const setupAppListeners = () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      App.addListener('appStateChange', ({ isActive }) => {
        setAppState(prev => ({ ...prev, isActive }));
      });

      App.addListener('appUrlOpen', (event) => {
        setAppState(prev => ({ ...prev, urlOpen: event.url }));
      });

      App.addListener('appRestoredResult', (result) => {
        setAppState(prev => ({ ...prev, restoredResult: result }));
      });
    }
  };

  const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (isNative) {
      try {
        await Haptics.impact({ style });
      } catch (error) {
        console.warn('Haptics not available:', error);
      }
    }
  };

  const hideStatusBar = async () => {
    if (isNative) {
      try {
        await StatusBar.hide();
      } catch (error) {
        console.warn('StatusBar not available:', error);
      }
    }
  };

  const showStatusBar = async () => {
    if (isNative) {
      try {
        await StatusBar.show();
      } catch (error) {
        console.warn('StatusBar not available:', error);
      }
    }
  };

  const hideSplashScreen = async () => {
    if (isNative) {
      try {
        await SplashScreen.hide();
      } catch (error) {
        console.warn('SplashScreen not available:', error);
      }
    }
  };

  const exitApp = async () => {
    if (isNative) {
      try {
        await App.exitApp();
      } catch (error) {
        console.warn('App exit not available:', error);
      }
    }
  };

  const minimizeApp = async () => {
    if (isNative) {
      try {
        await App.minimizeApp();
      } catch (error) {
        console.warn('App minimize not available:', error);
      }
    }
  };

  return {
    deviceInfo,
    appState,
    isNative,
    loading,
    triggerHaptic,
    hideStatusBar,
    showStatusBar,
    hideSplashScreen,
    exitApp,
    minimizeApp,
  };
}