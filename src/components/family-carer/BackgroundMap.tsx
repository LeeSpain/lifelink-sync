import React from 'react';

interface BackgroundMapProps {
  className?: string;
}

export const BackgroundMap: React.FC<BackgroundMapProps> = ({ className }) => {
  return (
    <div 
      className={`absolute inset-0 opacity-60 pointer-events-none ${className || ''}`}
      style={{ filter: 'blur(0.5px)' }}
    >
      {/* Simple CSS-based map background */}
      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-green-100 to-emerald-100">
        {/* Map-like grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
        
        {/* Simulated streets */}
        <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-white opacity-40"></div>
        <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-white opacity-30"></div>
        <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-white opacity-40"></div>
        <div className="absolute top-0 bottom-0 left-2/3 w-0.5 bg-white opacity-30"></div>
        
        {/* Green spaces */}
        <div className="absolute top-8 right-8 w-16 h-12 bg-green-200 rounded-lg opacity-60"></div>
        <div className="absolute bottom-12 left-12 w-12 h-12 bg-green-200 rounded-full opacity-60"></div>
        
        {/* Buildings */}
        <div className="absolute top-16 left-16 w-6 h-8 bg-gray-300 opacity-50"></div>
        <div className="absolute top-20 right-20 w-8 h-6 bg-gray-300 opacity-50"></div>
      </div>
      
      {/* Overlay gradient to blend with background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/20" />
    </div>
  );
};