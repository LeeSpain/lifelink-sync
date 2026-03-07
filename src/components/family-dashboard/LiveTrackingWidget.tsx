import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Users, 
  Navigation, 
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCircleRealtime } from '@/hooks/useCircleRealtime';
import { useFamilyRole } from '@/hooks/useFamilyRole';
import { supabase } from '@/integrations/supabase/client';

const LiveTrackingWidget = () => {
  const navigate = useNavigate();
  const { data: familyRole } = useFamilyRole();
  const [activeCircleId, setActiveCircleId] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  
  const { presences, circles, loadInitial } = useCircleRealtime(activeCircleId);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (circles.length > 0 && !activeCircleId) {
      setActiveCircleId(circles[0].id);
    }
  }, [circles, activeCircleId]);

  useEffect(() => {
    loadFamilyMembers();
  }, [presences, familyRole?.familyGroupId]);

  const loadFamilyMembers = async () => {
    if (!familyRole?.familyGroupId) return;

    try {
      const { data: memberships } = await supabase
        .from('family_memberships')
        .select('user_id')
        .eq('group_id', familyRole.familyGroupId)
        .eq('status', 'active')
        .limit(4); // Show max 4 members in widget

      if (memberships) {
        // Load profiles separately
        const memberProfiles = await Promise.all(
          memberships.map(async (m) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('user_id', m.user_id)
              .single();
            
            const presence = presences.find(p => p.user_id === m.user_id);
            return {
              user_id: m.user_id,
              name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Family Member',
              avatar_url: undefined,
              presence
            };
          })
        );
        setFamilyMembers(memberProfiles);
      }
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const getStatusInfo = (presence: any) => {
    if (!presence?.last_seen) return { status: 'offline', color: 'bg-gray-400', text: 'Offline' };
    
    const lastSeen = new Date(presence.last_seen);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    if (presence.is_paused) return { status: 'paused', color: 'bg-yellow-400', text: 'Paused' };
    if (diffMinutes < 5) return { status: 'live', color: 'bg-green-400', text: 'Live' };
    if (diffMinutes < 60) return { status: 'recent', color: 'bg-blue-400', text: `${Math.floor(diffMinutes)}m` };
    return { status: 'idle', color: 'bg-gray-400', text: 'Idle' };
  };

  const activeMembersCount = familyMembers.filter(m => {
    const status = getStatusInfo(m.presence);
    return status.status === 'live' || status.status === 'recent';
  }).length;

  if (!familyRole?.familyGroupId) return null;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Activity className="h-5 w-5" />
            Live Family Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              {activeMembersCount} Active
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(!isVisible)}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isVisible && (
        <CardContent className="space-y-4">
          {/* Family Members Grid */}
          <div className="grid grid-cols-2 gap-3">
            {familyMembers.slice(0, 4).map((member) => {
              const statusInfo = getStatusInfo(member.presence);
              return (
                <div key={member.user_id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${statusInfo.color} rounded-full border border-white`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-blue-600">{statusInfo.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-700">{familyMembers.length}</div>
              <div className="text-xs text-blue-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{activeMembersCount}</div>
              <div className="text-xs text-blue-600">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">{familyMembers.length - activeMembersCount}</div>
              <div className="text-xs text-blue-600">Offline</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => navigate('/family-dashboard/live-map')}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Open Live Map
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => navigate('/family-dashboard')}
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Family
            </Button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-blue-600 text-center pt-2 border-t border-blue-100">
            Real-time location sharing • Privacy protected • Family only
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default LiveTrackingWidget;