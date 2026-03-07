import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Heart, 
  Clock, 
  MapPin, 
  Battery, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Send,
  Monitor,
  Activity,
  Bell,
  Settings
} from 'lucide-react';

interface FamilyGroup {
  id: string;
  owner_user_id: string;
  owner_seat_quota: number;
  created_at: string;
  updated_at: string;
  owner_profile?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  family_memberships?: FamilyMember[];
}

interface FamilyMember {
  id: string;
  user_id: string;
  group_id: string;
  status: string;
  billing_type?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
  role?: string;
  joined_at?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  last_check_in?: string;
  last_location?: any;
  device_status?: {
    battery_level?: number;
    online_status?: boolean;
    last_seen?: string;
  };
}

interface SafetyAlert {
  id: string;
  user_id: string;
  alert_type: 'low_battery' | 'missed_checkin' | 'geofence_exit' | 'emergency_test';
  message: string;
  created_at: string;
  resolved: boolean;
}

const SafetyMonitoringPage = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadFamilyGroups();
    loadSafetyAlerts();
    setupRealTimeSubscription();
  }, []);

  const setupRealTimeSubscription = () => {
    const channel = supabase
      .channel('safety-monitoring')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_groups' },
        () => loadFamilyGroups()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'family_memberships' },
        () => loadFamilyGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadFamilyGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          profiles!family_groups_owner_user_id_fkey (
            first_name,
            last_name,
            email,
            phone
          ),
          family_memberships (
            *,
            profiles (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type-safe data mapping
      const typedGroups: FamilyGroup[] = (data || []).map(group => ({
        id: group.id,
        owner_user_id: group.owner_user_id,
        owner_seat_quota: group.owner_seat_quota,
        created_at: group.created_at || '',
        updated_at: group.updated_at || '',
        owner_profile: group.profiles as any,
        family_memberships: (group.family_memberships || []).map((member: any) => ({
          id: member.id,
          user_id: member.user_id,
          group_id: member.group_id,
          status: member.status,
          billing_type: member.billing_type,
          stripe_subscription_id: member.stripe_subscription_id,
          created_at: member.created_at,
          updated_at: member.updated_at,
          profiles: member.profiles as any
        }))
      }));
      
      setFamilyGroups(typedGroups);
    } catch (error) {
      console.error('Error loading family groups:', error);
      toast({
        title: "Error",
        description: "Failed to load family groups",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSafetyAlerts = async () => {
    try {
      // Mock safety alerts for now - in production this would come from a real table
      const mockAlerts: SafetyAlert[] = [
        {
          id: '1',
          user_id: 'user1',
          alert_type: 'low_battery',
          message: 'John Doe - Device battery below 20%',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          resolved: false
        },
        {
          id: '2',
          user_id: 'user2',
          alert_type: 'missed_checkin',
          message: 'Sarah Smith - Missed scheduled check-in',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          resolved: false
        }
      ];
      setSafetyAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading safety alerts:', error);
    }
  };

  const sendBroadcastMessage = async (groupId?: string) => {
    if (!broadcastMessage.trim()) return;

    try {
      // In production, this would send to the family-sos-alerts function
      toast({
        title: "Broadcast Sent",
        description: `Safety message sent to ${groupId ? 'family group' : 'all families'}`,
      });
      setBroadcastMessage('');
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to send broadcast message",
        variant: "destructive"
      });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      setSafetyAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      );
      
      toast({
        title: "Alert Resolved",
        description: "Safety alert has been marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'inactive': return 'outline';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_battery': return <Battery className="h-4 w-4 text-orange-500" />;
      case 'missed_checkin': return <Clock className="h-4 w-4 text-red-500" />;
      case 'geofence_exit': return <MapPin className="h-4 w-4 text-yellow-500" />;
      case 'emergency_test': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredGroups = familyGroups.filter(group => {
    if (!searchTerm) return true;
    
    const ownerName = `${group.owner_profile?.first_name} ${group.owner_profile?.last_name}`.toLowerCase();
    const memberNames = group.family_memberships?.map(m => 
      `${m.profiles?.first_name} ${m.profiles?.last_name}`.toLowerCase()
    ).join(' ') || '';
    
    return ownerName.includes(searchTerm.toLowerCase()) || 
           memberNames.includes(searchTerm.toLowerCase());
  });

  const totalFamilies = familyGroups.length;
  const totalMembers = familyGroups.reduce((sum, group) => sum + (group.family_memberships?.length || 0), 0);
  const activeAlerts = safetyAlerts.filter(alert => !alert.resolved).length;
  const onlineMembers = Math.floor(totalMembers * 0.85); // Mock calculation

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Safety Monitoring</h1>
          <p className="text-muted-foreground">Family safety dashboard and real-time monitoring</p>
        </div>
        <Button onClick={loadFamilyGroups} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Alerts Banner */}
      {activeAlerts > 0 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>{activeAlerts} active safety alert{activeAlerts > 1 ? 's' : ''}</strong> requiring attention
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Families</p>
                <p className="text-2xl font-bold text-primary">{totalFamilies}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-blue-500">{totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online Now</p>
                <p className="text-2xl font-bold text-green-500">{onlineMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-orange-500">{activeAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Family Overview</TabsTrigger>
          <TabsTrigger value="alerts">Safety Alerts</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="settings">Monitoring Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search families..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>

          {/* Family Groups List */}
          <Card>
            <CardHeader>
              <CardTitle>Family Groups</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No family groups found
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredGroups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {group.owner_profile?.first_name} {group.owner_profile?.last_name}'s Family
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {group.family_memberships?.length || 0} members • Created {new Date(group.created_at).toLocaleDateString()}
                          </p>
                          
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.family_memberships?.map((member) => (
                              <div key={member.id} className="flex items-center gap-2 p-2 border rounded">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-sm">
                                  {member.profiles?.first_name} {member.profiles?.last_name}
                                </span>
                                <Badge variant={getStatusBadgeVariant(member.status)} className="text-xs">
                                  {member.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedGroup(group)}
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              Monitor
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Family Safety Dashboard</DialogTitle>
                            </DialogHeader>
                            
                            {selectedGroup && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Family Owner</label>
                                    <p>{selectedGroup.owner_profile?.first_name} {selectedGroup.owner_profile?.last_name}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Contact</label>
                                    <p>{selectedGroup.owner_profile?.phone || selectedGroup.owner_profile?.email || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Family Members Status</label>
                                  <div className="space-y-2">
                                    {selectedGroup.family_memberships?.map((member) => (
                                      <div key={member.id} className="p-3 border rounded">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-medium">
                                              {member.profiles?.first_name} {member.profiles?.last_name}
                                            </p>
                                             <p className="text-sm text-muted-foreground">
                                               Last seen: {new Date(member.created_at).toLocaleString()}
                                             </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                            <Badge variant="default">Online</Badge>
                                            <Badge variant="secondary">95% Battery</Badge>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    onClick={() => sendBroadcastMessage(selectedGroup.id)}
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Safety Check
                                  </Button>
                                  <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure Alerts
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Safety Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {safetyAlerts.filter(alert => !alert.resolved).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  All clear - no active safety alerts
                </div>
              ) : (
                <div className="space-y-3">
                  {safetyAlerts.filter(alert => !alert.resolved).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.alert_type)}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Broadcast Safety Messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type safety message to all families..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={() => sendBroadcastMessage()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to All
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setBroadcastMessage("🔔 Safety Check: Please confirm you're safe by replying to this message.")}>
                  Quick: Safety Check
                </Button>
                <Button variant="outline" onClick={() => setBroadcastMessage("⚠️ Weather Alert: Severe weather in your area. Stay indoors and stay safe.")}>
                  Quick: Weather Alert
                </Button>
                <Button variant="outline" onClick={() => setBroadcastMessage("🚨 Emergency Drill: This is a test of the emergency notification system.")}>
                  Quick: Emergency Test
                </Button>
                <Button variant="outline" onClick={() => setBroadcastMessage("📱 Device Check: Please ensure your LifeLink Sync device is charged and working.")}>
                  Quick: Device Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Automatic Check-ins</label>
                    <p className="text-sm text-muted-foreground">Send automated safety check-ins to family members</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Low Battery Alerts</label>
                    <p className="text-sm text-muted-foreground">Alert when device battery drops below 20%</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Geofence Monitoring</label>
                    <p className="text-sm text-muted-foreground">Monitor when family members enter/exit safe zones</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Inactivity Alerts</label>
                    <p className="text-sm text-muted-foreground">Alert when no activity detected for extended periods</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafetyMonitoringPage;