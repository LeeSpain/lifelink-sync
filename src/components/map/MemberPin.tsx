import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Wifi, WifiOff, Battery, Clock, User } from "lucide-react";

interface Presence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

interface MemberPinProps {
  presence: Presence;
  onClick?: () => void;
}

export function MemberPin({ presence, onClick }: MemberPinProps) {
  const status = React.useMemo(() => {
    if (presence.is_paused) return "paused";
    if (!presence.last_seen) return "offline";
    const diff = Date.now() - new Date(presence.last_seen).getTime();
    if (diff < 2 * 60 * 1000) return "live";
    if (diff < 60 * 60 * 1000) return "idle";
    return "offline";
  }, [presence.last_seen, presence.is_paused]);

  const statusConfig = {
    live: {
      color: "bg-gradient-to-r from-emerald-400 to-emerald-600",
      ring: "ring-emerald-400",
      shadow: "shadow-emerald-500/50",
      icon: Wifi,
      pulse: true
    },
    idle: {
      color: "bg-gradient-to-r from-amber-400 to-amber-600", 
      ring: "ring-amber-400",
      shadow: "shadow-amber-500/50",
      icon: Clock,
      pulse: false
    },
    offline: {
      color: "bg-gradient-to-r from-slate-400 to-slate-600",
      ring: "ring-slate-400", 
      shadow: "shadow-slate-500/50",
      icon: WifiOff,
      pulse: false
    },
    paused: {
      color: "bg-gradient-to-r from-violet-400 to-violet-600",
      ring: "ring-violet-400",
      shadow: "shadow-violet-500/50",
      icon: User,
      pulse: false
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;
  
  // Generate initials from name
  const getInitials = () => {
    if (presence.first_name && presence.last_name) {
      return `${presence.first_name[0]}${presence.last_name[0]}`.toUpperCase();
    }
    return "U";
  };

  return (
    <div className="relative">
      <Button
        onClick={onClick}
        variant="ghost"
        size="sm"
        className={`
          relative p-0 h-16 w-16 rounded-full shadow-xl border-4 border-white
          ${config.color} ${config.shadow} hover:scale-110 transition-all duration-300
          ${config.pulse ? 'animate-pulse' : ''}
          backdrop-blur-sm
        `}
      >
        {/* Status Ring */}
        <div className={`absolute -inset-1 rounded-full ring-4 ${config.ring} ring-opacity-40 ${config.pulse ? 'animate-ping' : ''}`} />
        
        {/* Avatar or Status Icon */}
        <div className="relative w-full h-full rounded-full overflow-hidden">
          {presence.avatar_url ? (
            <Avatar className="w-full h-full">
              <AvatarImage src={presence.avatar_url} alt={`${presence.first_name} ${presence.last_name}`} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground text-white font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-white font-semibold text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Status overlay */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Icon className="w-3 h-3 text-foreground" />
          </div>
        </div>
        
        {/* Battery Indicator */}
        {presence.battery !== null && presence.battery !== undefined && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge 
              variant="secondary" 
              className="text-xs px-1.5 py-0.5 h-5 bg-background/90 backdrop-blur-sm border border-border/50 flex items-center gap-1"
            >
              <Battery className="w-2.5 h-2.5" />
              <span className="text-[10px] font-medium">{presence.battery}%</span>
            </Badge>
          </div>
        )}
        
        {/* Live pulse indicator */}
        {status === 'live' && (
          <div className="absolute -bottom-2 -right-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg animate-ping" />
          </div>
        )}
      </Button>
      
      {/* Name label below pin */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-md border border-border/50 shadow-lg">
        <span className="text-xs font-medium text-foreground whitespace-nowrap">
          {presence.first_name ? `${presence.first_name} ${presence.last_name || ''}`.trim() : 'Family Member'}
        </span>
      </div>
    </div>
  );
}