import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Battery, MessageCircle, Phone, Navigation, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NavigationComponent from '@/components/Navigation';
import Footer from '@/components/Footer';
import { PageSEO } from '@/components/PageSEO';
import MapLibreMap from '@/components/maplibre/MapLibreMap';
import { MapMemberLayer } from '@/components/maplibre/layers/MapMemberLayer';
import { MapEntity, getStatusFromPresence } from '@/types/map';

interface Presence {
  user_id: string;
  lat: number;
  lng: number;
  last_seen?: string;
  battery?: number | null;
  is_paused?: boolean;
}

// Demo-only sandbox: clearly not production data
export default function MapDemo() {
  const [selectedMember, setSelectedMember] = React.useState<Presence | null>(null);

  const demoPresences: Presence[] = [
    { user_id: "demo-user-1", lat: 51.5074, lng: -0.1278, last_seen: new Date(Date.now() - 1 * 60 * 1000).toISOString(), battery: 85, is_paused: false },
    { user_id: "demo-user-2", lat: 51.5155, lng: -0.0922, last_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), battery: 42, is_paused: false },
    { user_id: "demo-user-3", lat: 51.4994, lng: -0.1245, last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), battery: null, is_paused: true },
  ];

  const memberEntities: MapEntity[] = demoPresences.map(p => ({
    id: p.user_id,
    type: 'member',
    lat: p.lat,
    lng: p.lng,
    label: `Member ${p.user_id.slice(-1)}`,
    status: getStatusFromPresence(p.last_seen, p.is_paused),
    battery: p.battery,
    last_seen: p.last_seen,
    is_paused: p.is_paused,
  }));

  const handleMemberClick = React.useCallback((entity: MapEntity) => {
    const p = demoPresences.find(pr => pr.user_id === entity.id);
    if (p) setSelectedMember(p);
  }, [demoPresences]);

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
          <p className="text-muted-foreground">Interactive family location tracking with MapLibre (demo data)</p>
          <Badge variant="secondary" className="mt-2">Demo Only - Not Production Data</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Family Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full rounded-lg overflow-hidden border">
                  <MapLibreMap className="w-full h-full" center={{ lat: 51.5074, lng: -0.1278 }} zoom={12} interactive={true}>
                    <MapMemberLayer members={memberEntities} onMemberClick={handleMemberClick} selectedId={selectedMember?.user_id} />
                  </MapLibreMap>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Family Members</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {demoPresences.map(member => {
                  const status = getStatusFromPresence(member.last_seen, member.is_paused);
                  return (
                    <div key={member.user_id} className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedMember?.user_id === member.user_id ? 'border-primary bg-accent' : 'hover:bg-accent/50'}`} onClick={() => setSelectedMember(member)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${status === 'live' ? 'bg-emerald-500' : status === 'idle' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                            {member.user_id.slice(-1)}
                          </div>
                          <div>
                            <div className="font-medium">Family Member {member.user_id.slice(-1)}</div>
                            <div className="text-sm text-muted-foreground">{member.last_seen && formatDistanceToNow(new Date(member.last_seen), { addSuffix: true })}</div>
                          </div>
                        </div>
                        <Badge variant={status === "live" ? "default" : "secondary"}>{status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {selectedMember && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Member Actions</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleMemberAction("message", selectedMember)} className="flex items-center gap-2"><MessageCircle className="w-4 h-4" />Message</Button>
                    <Button variant="outline" size="sm" onClick={() => handleMemberAction("call", selectedMember)} className="flex items-center gap-2"><Phone className="w-4 h-4" />Call</Button>
                    <Button variant="outline" size="sm" onClick={() => handleMemberAction("navigate", selectedMember)} className="flex items-center gap-2"><Navigation className="w-4 h-4" />Navigate</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleMemberAction("emergency", selectedMember)} className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Emergency</Button>
                  </div>
                  <div className="pt-3 border-t text-sm space-y-1">
                    <div>{selectedMember.lat.toFixed(6)}, {selectedMember.lng.toFixed(6)}</div>
                    {selectedMember.battery && <div className="flex items-center gap-1"><Battery className="w-3 h-3" />{selectedMember.battery}%</div>}
                    {selectedMember.is_paused && <div className="text-amber-600 text-xs">Location sharing paused</div>}
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
