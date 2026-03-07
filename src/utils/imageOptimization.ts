// Image optimization utilities for LifeLink Sync

export interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

export const CRITICAL_IMAGES = [
  '/lovable-uploads/141f77cc-c074-48dc-95f1-f886baacd2da.png', // Hero image (main)
  '/lovable-uploads/0365334e-7587-4cf4-96a6-5744399b84b2.png', // Family hero image
  '/lovable-uploads/7ad599e6-d1cd-4a1b-84f4-9b6b1e4242e1.png', // App icon
];

export const generateResponsiveSizes = (breakpoints: Record<string, string>): string => {
  return Object.entries(breakpoints)
    .map(([bp, size]) => `(min-width: ${bp}) ${size}`)
    .join(', ');
};

export const getImageSizes = (context: 'hero' | 'card' | 'thumbnail' | 'icon'): string => {
  switch (context) {
    case 'hero':
      return generateResponsiveSizes({
        '1024px': '50vw',
        '768px': '70vw',
        '0px': '90vw'
      });
    case 'card':
      return generateResponsiveSizes({
        '1024px': '25vw',
        '768px': '50vw',
        '0px': '90vw'
      });
    case 'thumbnail':
      return generateResponsiveSizes({
        '768px': '150px',
        '0px': '120px'
      });
    case 'icon':
      return generateResponsiveSizes({
        '0px': '64px'
      });
    default:
      return '90vw';
  }
};

export const generateSrcSet = (baseSrc: string, sizes: number[] = [320, 640, 1024, 1440]): string => {
  // For now, return the original image at different densities
  // In production, you'd have multiple sized versions
  return sizes.map(size => `${baseSrc} ${size}w`).join(', ');
};

export const generateBlurPlaceholder = (width: number = 10, height: number = 10): string => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>
  `)}`;
};

export const preloadCriticalImages = (): void => {
  if (typeof window === 'undefined') return;

  CRITICAL_IMAGES.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  });
};

export const createImagePerformanceObserver = (): PerformanceObserver | null => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return null;
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.entryType === 'largest-contentful-paint') {
        console.log('LCP:', entry.startTime);
      }
      if (entry.entryType === 'resource' && entry.name.includes('.png')) {
        const resourceEntry = entry as PerformanceResourceTiming;
        console.log('Image loading:', entry.name, resourceEntry.duration);
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint', 'element'] });
    return observer;
  } catch (error) {
    console.warn('Performance observer not supported:', error);
    return null;
  }
};