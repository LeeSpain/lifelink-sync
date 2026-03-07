import React from "react";
import { useUnifiedMap } from "@/hooks/useUnifiedMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Battery, MessageCircle, Phone, Navigation, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NavigationComponent from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PageSEO } from '@/components/PageSEO';

interface Presence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
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

  const statusColors = {
    live: "ring-emerald-500 bg-emerald-100",
    idle: "ring-amber-500 bg-amber-100",
    offline: "ring-slate-400 bg-slate-100",
    paused: "ring-slate-400 bg-slate-100"
  };

  return (
    <button 
      onClick={onClick} 
      className={`w-10 h-10 rounded-full ring-4 ${statusColors[status]} shadow-lg hover:scale-110 transition-transform duration-200 relative overflow-hidden`}
    >
      {/* Avatar placeholder */}
      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
        {presence.user_id.slice(0, 2).toUpperCase()}
      </div>
      
      {/* Battery indicator */}
      {presence.battery !== null && presence.battery !== undefined && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Battery className="w-2 h-2 text-slate-600" />
        </div>
      )}
      
      {/* Status dot */}
      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
        status === "live" ? "bg-emerald-500" : 
        status === "idle" ? "bg-amber-500" : 
        "bg-slate-400"
      }`} />
    </button>
  );
}

// Interactive Map Demo Component
export default function MapDemo() {
  const { MapView } = useUnifiedMap();
  const [selectedMember, setSelectedMember] = React.useState<Presence | null>(null);

  // Demo data - family members in different locations around London
  const demoPresences: Presence[] = [
    {
      user_id: "demo-user-1",
      lat: 51.5074,
      lng: -0.1278,
      last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
      battery: 85,
      is_paused: false
    },
    {
      user_id: "demo-user-2", 
      lat: 51.5155,
      lng: -0.0922,
      last_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
      battery: 42,
      is_paused: false
    },
    {
      user_id: "demo-user-3",
      lat: 51.4994,
      lng: -0.1245,
      last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      battery: null,
      is_paused: true
    }
  ];

  const handleMemberAction = (action: string, member: Presence) => {
    console.log(`${action} for member:`, member.user_id);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PageSEO pageType="map-demo" />
      <NavigationComponent />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Live Map Demo</h1>
        <p className="text-muted-foreground">
          Interactive family location tracking with Mapbox integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Family Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapView
                className="h-96 w-full"
                markers={demoPresences.map(p => ({
                  id: p.user_id,
                  lat: p.lat,
                  lng: p.lng,
                  render: () => (
                    <MemberPin
                      presence={p}
                      onClick={() => setSelectedMember(p)}
                    />
                  )
                }))}
                center={{ lat: 51.5074, lng: -0.1278 }}
                zoom={12}
              />
            </CardContent>
          </Card>
        </div>

        {/* Member Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Family Members
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {demoPresences.map((member) => {
                const status = member.is_paused ? "paused" : 
                  !member.last_seen ? "offline" :
                  Date.now() - new Date(member.last_seen).getTime() < 2 * 60 * 1000 ? "live" :
                  Date.now() - new Date(member.last_seen).getTime() < 60 * 60 * 1000 ? "idle" : "offline";

                return (
                  <div 
                    key={member.user_id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedMember?.user_id === member.user_id 
                        ? 'border-primary bg-accent' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MemberPin presence={member} />
                        <div>
                          <div className="font-medium">
                            Family Member {member.user_id.slice(-1)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.last_seen && formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      <Badge variant={status === "live" ? "default" : "secondary"}>
                        {status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Member Actions */}
          {selectedMember && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMemberAction("message", selectedMember)}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMemberAction("call", selectedMember)}
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMemberAction("navigate", selectedMember)}
                    className="flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleMemberAction("emergency", selectedMember)}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Emergency
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-sm space-y-1">
                    <div>📍 {selectedMember.lat.toFixed(6)}, {selectedMember.lng.toFixed(6)}</div>
                    {selectedMember.battery && (
                      <div className="flex items-center gap-1">
                        <Battery className="w-3 h-3" />
                        {selectedMember.battery}%
                      </div>
                    )}
                    {selectedMember.is_paused && (
                      <div className="text-amber-600 text-xs">
                        ⏸️ Location sharing paused
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </div>
    </div>
  );
}