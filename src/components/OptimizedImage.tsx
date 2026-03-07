import React, { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setCurrentSrc(placeholder);
  }, [placeholder]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && currentSrc === placeholder) {
      setCurrentSrc(src);
    }
  }, [src, currentSrc, placeholder]);

  React.useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '50px',
    });

    const imageElement = document.querySelector(`img[alt="${alt}"]`);
    if (imageElement) {
      observer.observe(imageElement);
    }

    return () => observer.disconnect();
  }, [handleIntersection, alt, priority]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-70'} transition-opacity duration-300`}
      width={width}
      height={height}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};

export default OptimizedImage;