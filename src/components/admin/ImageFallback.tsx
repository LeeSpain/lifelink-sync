import React, { useState } from 'react';
import { BookOpen, Image } from 'lucide-react';

interface ImageFallbackProps {
  src?: string | null;
  alt?: string | null;
  title?: string | null;
  className?: string;
  fallbackType?: 'placeholder' | 'gradient' | 'icon';
}

const ImageFallback: React.FC<ImageFallbackProps> = ({
  src,
  alt,
  title,
  className = "w-full h-auto",
  fallbackType = 'gradient'
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if we have a valid image URL (not base64 or empty)
  const hasValidImage = src && src.trim() && !src.includes('data:image/png;base64,') && !imageError;

  const renderFallback = () => {
    const fallbackClassName = `${className} bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg shadow-lg flex items-center justify-center`;
    
    switch (fallbackType) {
      case 'icon':
        return (
          <div className={fallbackClassName}>
            <div className="text-center text-muted-foreground p-8">
              <Image className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">Image Not Available</p>
            </div>
          </div>
        );
      case 'placeholder':
        return (
          <div className={fallbackClassName}>
            <div className="text-center text-muted-foreground p-8">
              <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-10 w-10" />
              </div>
              <p className="text-lg font-medium">{title || 'Blog Article'}</p>
              <p className="text-sm">Emergency Safety Content</p>
            </div>
          </div>
        );
      default: // gradient
        return (
          <div className={fallbackClassName}>
            <div className="text-center text-muted-foreground p-8">
              <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-medium">{title || 'Safety Article'}</p>
              <p className="text-sm">AI-Generated Content</p>
            </div>
          </div>
        );
    }
  };

  if (!hasValidImage) {
    return renderFallback();
  }

  return (
    <div className="relative">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
      )}
      <img
        src={src}
        alt={alt || title || 'Blog article image'}
        className={className}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true);
          setImageLoaded(true);
        }}
        style={{ display: imageError ? 'none' : 'block' }}
      />
      {imageError && renderFallback()}
    </div>
  );
};

export default ImageFallback;