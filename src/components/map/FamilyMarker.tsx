import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FamilyMarkerProps {
  id: string;
  name: string;
  avatar: string;
  status: 'live' | 'alert' | 'idle';
  className?: string;
}

const FamilyMarker: React.FC<FamilyMarkerProps> = ({ name, avatar, status, className = '' }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'live': return 'bg-green-500';
      case 'alert': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const showPulse = status === 'alert';

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Avatar with status indicator */}
      <div className="relative">
        <Avatar className="w-12 h-12 border-3 border-white shadow-lg">
          <AvatarImage src={avatar} alt={`${name} avatar`} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor()} ${showPulse ? 'animate-pulse' : ''}`}></div>
        
        {/* Alert animation for emergency */}
        {showPulse && (
          <>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
          </>
        )}
      </div>
      
      {/* Name label */}
      <div className={`mt-2 text-xs font-medium text-center px-2 py-1 rounded-md shadow-sm border max-w-[100px] truncate ${
        status === 'alert' 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : 'bg-white border-gray-200 text-gray-800'
      }`}>
        {status === 'alert' ? `${name} - Alert!` : name}
      </div>
    </div>
  );
};

export default FamilyMarker;