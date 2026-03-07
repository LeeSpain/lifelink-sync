import React from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedSOSButtonProps {
  onTrigger: () => void;
  isTriggering: boolean;
}

export const EnhancedSOSButton: React.FC<EnhancedSOSButtonProps> = ({
  onTrigger,
  isTriggering
}) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-orange-500 opacity-20 animate-pulse"></div>
      
      {/* Pulse animation rings */}
      <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></div>
      <div className="absolute inset-0 rounded-full bg-red-600/20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
      
      {/* Main button */}
      <Button
        onClick={onTrigger}
        disabled={isTriggering}
        className={`
          relative z-10 w-32 h-32 rounded-full
          bg-gradient-to-br from-red-500 via-red-600 to-red-700
          hover:from-red-600 hover:via-red-700 hover:to-red-800
          border-4 border-white shadow-2xl
          transition-all duration-300 ease-out
          ${isTriggering ? 'scale-95 animate-pulse' : 'hover:scale-105 active:scale-95'}
          emergency-pulse
        `}
        style={{
          boxShadow: `
            0 0 0 4px rgba(255, 255, 255, 1),
            0 0 0 8px rgba(239, 68, 68, 0.3),
            0 20px 40px -10px rgba(239, 68, 68, 0.4),
            inset 0 2px 4px rgba(255, 255, 255, 0.3)
          `
        }}
        aria-label="Emergency SOS Button"
      >
        {isTriggering ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-white">CALLING</span>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-1">
            <Phone className="h-10 w-10 text-white drop-shadow-lg" />
            <span className="text-sm font-bold text-white tracking-wide drop-shadow-lg">
              SOS
            </span>
          </div>
        )}
        
        {/* Inner highlight */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
      </Button>
      
      {/* Status text */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-lg font-bold text-red-700 tracking-wide">
          {isTriggering ? 'ACTIVATING EMERGENCY...' : 'EMERGENCY SOS'}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Tap to alert emergency contacts
        </p>
      </div>
    </div>
  );
};