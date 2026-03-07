import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Phone, Navigation, AlertTriangle, Clock, Battery } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Presence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
}

interface MemberSheetProps {
  presence: Presence | null;
  onClose: () => void;
}

export function MemberSheet({ presence, onClose }: MemberSheetProps) {
  if (!presence) return null;

  const status = React.useMemo(() => {
    if (presence.is_paused) return "paused";
    if (!presence.last_seen) return "offline";
    const diff = Date.now() - new Date(presence.last_seen).getTime();
    if (diff < 2 * 60 * 1000) return "live";
    if (diff < 60 * 60 * 1000) return "idle";
    return "offline";
  }, [presence.last_seen, presence.is_paused]);

  const statusColors = {
    live: "bg-emerald-500",
    idle: "bg-amber-500",
    offline: "bg-slate-500",
    paused: "bg-slate-400"
  };

  const statusLabels = {
    live: "Online",
    idle: "Away",
    offline: "Offline", 
    paused: "Sharing Paused"
  };

  const handleMessage = () => {
    // TODO: Open messaging interface
    console.log("Open message for user:", presence.user_id);
  };

  const handleCall = () => {
    // TODO: Initiate call
    console.log("Call user:", presence.user_id);
  };

  const handleNavigate = () => {
    // TODO: Open navigation to user's location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${presence.lat},${presence.lng}`;
    window.open(url, '_blank');
  };

  const handleEmergencyHelp = () => {
    // TODO: Trigger SOS for this family member
    console.log("Emergency help for user:", presence.user_id);
  };

  return (
    <Sheet open={!!presence} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[60vh]">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg font-medium">
                {presence.user_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <SheetTitle className="text-left">Family Member</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                <span className="text-sm text-muted-foreground">{statusLabels[status]}</span>
              </div>
            </div>
            
            {presence.battery !== null && presence.battery !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Battery className="w-3 h-3" />
                {presence.battery}%
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Location Info */}
        <div className="space-y-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="text-sm font-medium text-muted-foreground mb-1">Current Location</div>
            <div className="text-sm font-mono">
              {presence.lat.toFixed(6)}, {presence.lng.toFixed(6)}
            </div>
          </div>
          
          {presence.last_seen && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Last updated {formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handleMessage}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCall}
            className="flex items-center gap-2"
          >
            <Phone className="w-4 h-4" />
            Call
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleNavigate}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Navigate
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={handleEmergencyHelp}
            className="flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Help
          </Button>
        </div>

        {presence.is_paused && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-800 dark:text-amber-200">
              This family member has paused location sharing. Location shown may not be current.
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}