import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  blurDataURL?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  priority = false,
  sizes = '(min-width: 1024px) 50vw, 90vw',
  blurDataURL,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate WebP and responsive sizes from original PNG
  const generateSrcSet = (originalSrc: string) => {
    const base = originalSrc.replace(/\.[^/.]+$/, "");
    const ext = originalSrc.split('.').pop();
    
    // For now, we'll use the original images but add size hints
    // In production, you'd want to generate multiple sizes server-side
    return `${originalSrc} 1x, ${originalSrc} 2x`;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  useEffect(() => {
    // Intersection Observer for lazy loading
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
              }
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
  }, [priority]);

  if (hasError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
        {...props}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={priority ? src : undefined}
        data-src={priority ? undefined : src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
      
      {/* Loading placeholder */}
      {!isLoaded && !blurDataURL && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
};

export default OptimizedImage;