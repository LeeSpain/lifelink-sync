import { useEffect, useState } from 'react';

interface ImageOptimizationConfig {
  enableWebP: boolean;
  enableLazyLoading: boolean;
  enablePreloading: boolean;
  compressionQuality: number;
}

const DEFAULT_CONFIG: ImageOptimizationConfig = {
  enableWebP: true,
  enableLazyLoading: true,
  enablePreloading: true,
  compressionQuality: 80,
};

export const useImageOptimization = (config: Partial<ImageOptimizationConfig> = {}) => {
  const [optimizationConfig] = useState<ImageOptimizationConfig>({
    ...DEFAULT_CONFIG,
    ...config,
  });

  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  useEffect(() => {
    // Check WebP support
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 1, 1);
      setSupportsWebP(canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
    } else {
      setSupportsWebP(false);
    }
  }, []);

  const getOptimizedSrc = (originalSrc: string, width?: number): string => {
    if (!optimizationConfig.enableWebP || supportsWebP === false) {
      return originalSrc;
    }

    // For now, return original src. In production, you'd implement
    // server-side image optimization or use a service like Cloudinary
    return originalSrc;
  };

  const generateBlurDataURL = (src: string): string => {
    // Generate a tiny base64 image for blur placeholder
    // In production, this would be generated server-side
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `)}`;
  };

  const preloadImage = (src: string, priority: boolean = false): Promise<void> => {
    if (!optimizationConfig.enablePreloading && !priority) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  };

  return {
    optimizationConfig,
    supportsWebP,
    getOptimizedSrc,
    generateBlurDataURL,
    preloadImage,
  };
};