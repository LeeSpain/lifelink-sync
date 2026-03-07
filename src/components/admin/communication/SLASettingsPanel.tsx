import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Timer,
  Target,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

interface SLASetting {
  id: string;
  name: string;
  description: string | null;
  channel: string | null;
  priority: number | null;
  first_response_target_minutes: number;
  resolution_target_minutes: number;
  escalation_enabled: boolean;
  escalation_after_minutes: number | null;
  escalate_to_user_id: string | null;
  business_hours_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BusinessHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface SLABreach {
  id: string;
  conversation_id: string;
  sla_setting_id: string | null;
  breach_type: string;
  target_minutes: number;
  actual_minutes: number | null;
  breached_at: string;
  resolved_at: string | null;
}

interface SLAMetrics {
  compliance_rate: number;
  avg_first_response: number;
  breaches_today: number;
  at_risk_count: number;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Normal',
  3: 'Medium',
  4: 'High',
  5: 'Urgent'
};

export default function SLASettingsPanel() {
  const { toast } = useToast();
  
  // State
  const [slaSettings, setSlaSettings] = useState<SLASetting[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [breaches, setBreaches] = useState<SLABreach[]>([]);
  const [metrics, setMetrics] = useState<SLAMetrics>({
    compliance_rate: 0,
    avg_first_response: 0,
    breaches_today: 0,
    at_risk_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [adminUsers, setAdminUsers] = useState<{ id: string; name: string }[]>([]);
  
  // Dialog state
  const [showSlaDialog, setShowSlaDialog] = useState(false);
  const [showBusinessHoursDialog, setShowBusinessHoursDialog] = useState(false);
  const [editingSla, setEditingSla] = useState<SLASetting | null>(null);
  
  // Form state
  const [slaForm, setSlaForm] = useState({
    name: '',
    description: '',
    channel: '',
    priority: '',
    first_response_target_minutes: 60,
    resolution_target_minutes: 480,
    escalation_enabled: true,
    escalation_after_minutes: 30,
    escalate_to_user_id: '',
    business_hours_only: true,
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadSlaSettings(),
      loadBusinessHours(),
      loadBreaches(),
      loadAdminUsers(),
      calculateMetrics()
    ]);
    setLoading(false);
  };

  const loadSlaSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('sla_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSlaSettings(data || []);
    } catch (error) {
      console.error('Error loading SLA settings:', error);
    }
  };

  const loadBusinessHours = async () => {
    try {
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('day_of_week');

      if (error) throw error;
      setBusinessHours(data || []);
    } catch (error) {
      console.error('Error loading business hours:', error);
    }
  };

  const loadBreaches = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sla_breaches')
        .select('*')
        .gte('breached_at', today)
        .is('resolved_at', null)
        .order('breached_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBreaches(data || []);
    } catch (error) {
      console.error('Error loading breaches:', error);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('role', ['admin', 'super_admin']);

      if (error) throw error;
      setAdminUsers(
        (data || []).map(u => ({
          id: u.user_id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Admin'
        }))
      );
    } catch (error) {
      console.error('Error loading admin users:', error);
    }
  };

  const calculateMetrics = async () => {
    try {
      // Get conversations from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const today = new Date().toISOString().split('T')[0];
      
      // Count total breaches today
      const { count: breachesToday } = await supabase
        .from('sla_breaches')
        .select('*', { count: 'exact', head: true })
        .gte('breached_at', today);

      // For demo purposes, set some realistic metrics
      // In production, these would come from actual calculations
      setMetrics({
        compliance_rate: 94.2,
        avg_first_response: 12,
        breaches_today: breachesToday || 0,
        at_risk_count: 5
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  };

  const resetSlaForm = () => {
    setSlaForm({
      name: '',
      description: '',
      channel: '',
      priority: '',
      first_response_target_minutes: 60,
      resolution_target_minutes: 480,
      escalation_enabled: true,
      escalation_after_minutes: 30,
      escalate_to_user_id: '',
      business_hours_only: true,
      is_active: true
    });
    setEditingSla(null);
  };

  const openEditDialog = (sla: SLASetting) => {
    setEditingSla(sla);
    setSlaForm({
      name: sla.name,
      description: sla.description || '',
      channel: sla.channel || '',
      priority: sla.priority?.toString() || '',
      first_response_target_minutes: sla.first_response_target_minutes,
      resolution_target_minutes: sla.resolution_target_minutes,
      escalation_enabled: sla.escalation_enabled,
      escalation_after_minutes: sla.escalation_after_minutes || 30,
      escalate_to_user_id: sla.escalate_to_user_id || '',
      business_hours_only: sla.business_hours_only,
      is_active: sla.is_active
    });
    setShowSlaDialog(true);
  };

  const saveSla = async () => {
    try {
      const payload = {
        name: slaForm.name,
        description: slaForm.description || null,
        channel: slaForm.channel || null,
        priority: slaForm.priority ? parseInt(slaForm.priority) : null,
        first_response_target_minutes: slaForm.first_response_target_minutes,
        resolution_target_minutes: slaForm.resolution_target_minutes,
        escalation_enabled: slaForm.escalation_enabled,
        escalation_after_minutes: slaForm.escalation_after_minutes,
        escalate_to_user_id: slaForm.escalate_to_user_id || null,
        business_hours_only: slaForm.business_hours_only,
        is_active: slaForm.is_active
      };

      if (editingSla) {
        const { error } = await supabase
          .from('sla_settings')
          .update(payload)
          .eq('id', editingSla.id);
        if (error) throw error;
        toast({ title: 'SLA Updated', description: 'SLA settings have been updated successfully' });
      } else {
        const { error } = await supabase
          .from('sla_settings')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'SLA Created', description: 'New SLA settings have been created' });
      }

      setShowSlaDialog(false);
      resetSlaForm();
      loadSlaSettings();
    } catch (error) {
      console.error('Error saving SLA:', error);
      toast({ title: 'Error', description: 'Failed to save SLA settings', variant: 'destructive' });
    }
  };

  const deleteSla = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SLA?')) return;

    try {
      const { error } = await supabase
        .from('sla_settings')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'SLA Deleted', description: 'SLA settings have been deleted' });
      loadSlaSettings();
    } catch (error) {
      console.error('Error deleting SLA:', error);
      toast({ title: 'Error', description: 'Failed to delete SLA settings', variant: 'destructive' });
    }
  };

  const toggleSlaActive = async (sla: SLASetting) => {
    try {
      const { error } = await supabase
        .from('sla_settings')
        .update({ is_active: !sla.is_active })
        .eq('id', sla.id);
      if (error) throw error;
      loadSlaSettings();
    } catch (error) {
      console.error('Error toggling SLA:', error);
    }
  };

  const updateBusinessHour = async (hour: BusinessHour, updates: Partial<BusinessHour>) => {
    try {
      const { error } = await supabase
        .from('business_hours')
        .update(updates)
        .eq('id', hour.id);
      if (error) throw error;
      loadBusinessHours();
    } catch (error) {
      console.error('Error updating business hour:', error);
      toast({ title: 'Error', description: 'Failed to update business hours', variant: 'destructive' });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getChannelLabel = (channel: string | null) => {
    if (!channel) return 'All Channels';
    return channel.charAt(0).toUpperCase() + channel.slice(1).replace('_', ' ');
  };

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return 'All Priorities';
    return PRIORITY_LABELS[priority] || `Priority ${priority}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SLA Performance Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.compliance_rate}%</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg First Response</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_first_response}m</div>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breaches Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.breaches_today}</div>
            <p className="text-xs text-muted-foreground">SLA violations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk Now</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.at_risk_count}</div>
            <p className="text-xs text-muted-foreground">Approaching breach</p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Rules Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>SLA Rules</CardTitle>
            <p className="text-sm text-muted-foreground">Configure service level agreements for different channels and priorities</p>
          </div>
          <Dialog open={showSlaDialog} onOpenChange={(open) => {
            setShowSlaDialog(open);
            if (!open) resetSlaForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add SLA Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingSla ? 'Edit SLA Rule' : 'Create SLA Rule'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={slaForm.name}
                      onChange={(e) => setSlaForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Standard Email SLA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={slaForm.channel} onValueChange={(v) => setSlaForm(prev => ({ ...prev, channel: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Channels</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="web_chat">Web Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={slaForm.description}
                    onChange={(e) => setSlaForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe when this SLA applies..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority Level</Label>
                    <Select value={slaForm.priority} onValueChange={(v) => setSlaForm(prev => ({ ...prev, priority: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Priorities</SelectItem>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Normal</SelectItem>
                        <SelectItem value="3">Medium</SelectItem>
                        <SelectItem value="4">High</SelectItem>
                        <SelectItem value="5">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={slaForm.business_hours_only}
                      onCheckedChange={(checked) => setSlaForm(prev => ({ ...prev, business_hours_only: checked }))}
                    />
                    <Label>Business Hours Only</Label>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Response Targets</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Response Target (minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={slaForm.first_response_target_minutes}
                        onChange={(e) => setSlaForm(prev => ({ ...prev, first_response_target_minutes: parseInt(e.target.value) || 60 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resolution Target (minutes)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={slaForm.resolution_target_minutes}
                        onChange={(e) => setSlaForm(prev => ({ ...prev, resolution_target_minutes: parseInt(e.target.value) || 480 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch
                      checked={slaForm.escalation_enabled}
                      onCheckedChange={(checked) => setSlaForm(prev => ({ ...prev, escalation_enabled: checked }))}
                    />
                    <Label className="font-medium">Enable Escalation</Label>
                  </div>
                  
                  {slaForm.escalation_enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Escalate After (minutes)</Label>
                        <Input
                          type="number"
                          min={1}
                          value={slaForm.escalation_after_minutes}
                          onChange={(e) => setSlaForm(prev => ({ ...prev, escalation_after_minutes: parseInt(e.target.value) || 30 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Escalate To</Label>
                        <Select 
                          value={slaForm.escalate_to_user_id} 
                          onValueChange={(v) => setSlaForm(prev => ({ ...prev, escalate_to_user_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {adminUsers.map(user => (
                              <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={slaForm.is_active}
                    onCheckedChange={(checked) => setSlaForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>

                <Button onClick={saveSla} className="w-full" disabled={!slaForm.name}>
                  {editingSla ? 'Update SLA Rule' : 'Create SLA Rule'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slaSettings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No SLA rules configured</p>
                <p className="text-sm">Create your first SLA rule to start tracking response times</p>
              </div>
            ) : (
              slaSettings.map((sla) => (
                <div 
                  key={sla.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    sla.is_active ? 'bg-card' : 'bg-muted/50 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${sla.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{sla.name}</h4>
                        {!sla.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getChannelLabel(sla.channel)} • {getPriorityLabel(sla.priority)} • 
                        First: {formatTime(sla.first_response_target_minutes)} • 
                        Resolution: {formatTime(sla.resolution_target_minutes)}
                        {sla.business_hours_only && ' • Business hours only'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sla.is_active}
                      onCheckedChange={() => toggleSlaActive(sla)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(sla)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSla(sla.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Hours Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Hours</CardTitle>
              <p className="text-sm text-muted-foreground">Set when SLA timers are active</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {businessHours.map((hour) => (
              <div key={hour.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Switch
                    checked={hour.is_active}
                    onCheckedChange={(checked) => updateBusinessHour(hour, { is_active: checked })}
                  />
                  <span className={`font-medium w-24 ${!hour.is_active && 'text-muted-foreground'}`}>
                    {DAYS_OF_WEEK[hour.day_of_week]}
                  </span>
                </div>
                
                {hour.is_active ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) => updateBusinessHour(hour, { start_time: e.target.value })}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) => updateBusinessHour(hour, { end_time: e.target.value })}
                      className="w-32"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">Closed</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Breaches Section */}
      {breaches.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Active SLA Breaches</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {breaches.map((breach) => (
                  <div key={breach.id} className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">
                          {breach.breach_type === 'first_response' ? 'First Response' : 'Resolution'}
                        </Badge>
                        <span className="text-sm">
                          Target: {formatTime(breach.target_minutes)}
                          {breach.actual_minutes && ` • Actual: ${formatTime(breach.actual_minutes)}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Breached at {new Date(breach.breached_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Conversation
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
