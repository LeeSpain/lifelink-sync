import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

export function useNativeCapabilities() {
  const [isNative, setIsNative] = useState(false);
  const [capabilities, setCapabilities] = useState({
    camera: false,
    filesystem: false,
    preferences: false,
    share: false,
    clipboard: false,
  });

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    const native = typeof window !== 'undefined' && (window as any).Capacitor;
    setIsNative(!!native);
    
    if (native) {
      setCapabilities({
        camera: true,
        filesystem: true,
        preferences: true,
        share: true,
        clipboard: true,
      });
    }
  };

  const takePicture = async () => {
    if (!capabilities.camera) return null;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      return image;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  };

  const selectImage = async () => {
    if (!capabilities.camera) return null;
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });
      return image;
    } catch (error) {
      console.error('Image selection error:', error);
      throw error;
    }
  };

  const writeFile = async (filename: string, data: string, directory: Directory = Directory.Data) => {
    if (!capabilities.filesystem) throw new Error('Filesystem not available');
    
    try {
      await Filesystem.writeFile({
        path: filename,
        data: data,
        directory: directory,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error('File write error:', error);
      throw error;
    }
  };

  const readFile = async (filename: string, directory: Directory = Directory.Data) => {
    if (!capabilities.filesystem) throw new Error('Filesystem not available');
    
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: directory,
        encoding: Encoding.UTF8,
      });
      return result.data;
    } catch (error) {
      console.error('File read error:', error);
      throw error;
    }
  };

  const setPreference = async (key: string, value: string) => {
    if (!capabilities.preferences) {
      localStorage.setItem(key, value);
      return;
    }
    
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Preferences set error:', error);
      localStorage.setItem(key, value);
    }
  };

  const getPreference = async (key: string): Promise<string | null> => {
    if (!capabilities.preferences) {
      return localStorage.getItem(key);
    }
    
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error('Preferences get error:', error);
      return localStorage.getItem(key);
    }
  };

  const shareContent = async (title: string, text: string, url?: string) => {
    if (!capabilities.share) {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        throw new Error('Share not available');
      }
      return;
    }
    
    try {
      await Share.share({
        title,
        text,
        url,
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!capabilities.clipboard) {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard not available');
      }
      return;
    }
    
    try {
      await Clipboard.write({ string: text });
    } catch (error) {
      console.error('Clipboard error:', error);
      throw error;
    }
  };

  const readClipboard = async (): Promise<string> => {
    if (!capabilities.clipboard) {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      } else {
        throw new Error('Clipboard read not available');
      }
    }
    
    try {
      const result = await Clipboard.read();
      return result.value;
    } catch (error) {
      console.error('Clipboard read error:', error);
      throw error;
    }
  };

  return {
    isNative,
    capabilities,
    takePicture,
    selectImage,
    writeFile,
    readFile,
    setPreference,
    getPreference,
    shareContent,
    copyToClipboard,
    readClipboard,
  };
}