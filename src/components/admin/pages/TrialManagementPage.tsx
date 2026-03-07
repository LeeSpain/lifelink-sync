import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Users, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TrialRecord {
  id: string;
  user_id: string;
  trial_start: string;
  trial_end: string;
  status: string;
  converted_at: string | null;
  plan_after_trial: string | null;
  reminder_sent_at: string | null;
  created_at: string;
}

export default function TrialManagementPage() {
  const [trials, setTrials] = useState<TrialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringLoading, setExpiringLoading] = useState(false);

  useEffect(() => {
    loadTrials();
  }, []);

  const loadTrials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trial_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrials((data || []) as unknown as TrialRecord[]);
    } catch (error: any) {
      toast.error('Failed to load trials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpireTrials = async () => {
    try {
      setExpiringLoading(true);
      const { data, error } = await supabase.functions.invoke('expire-trials');
      if (error) throw error;
      toast.success(`Expired ${data?.expired_count || 0} trials`);
      loadTrials();
    } catch (error: any) {
      toast.error('Failed to expire trials: ' + error.message);
    } finally {
      setExpiringLoading(false);
    }
  };

  const activeTrials = trials.filter(t => t.status === 'active');
  const convertedTrials = trials.filter(t => t.status === 'converted');
  const expiredTrials = trials.filter(t => t.status === 'expired');
  const conversionRate = trials.length > 0
    ? ((convertedTrials.length / trials.length) * 100).toFixed(1)
    : '0';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'converted':
        return <Badge className="bg-green-100 text-green-800">Converted</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Management</h1>
          <p className="text-muted-foreground">Monitor free trial usage and conversions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExpireTrials} variant="outline" disabled={expiringLoading}>
            {expiringLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Run Expiry Check
          </Button>
          <Button onClick={loadTrials} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeTrials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Converted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{convertedTrials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Trials Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Trials</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : trials.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No trials found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">User ID</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Trial Start</th>
                    <th className="text-left py-3 px-2 font-medium">Trial End</th>
                    <th className="text-left py-3 px-2 font-medium">Converted</th>
                    <th className="text-left py-3 px-2 font-medium">Plan After</th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map(trial => (
                    <tr key={trial.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 font-mono text-xs">{trial.user_id.slice(0, 8)}...</td>
                      <td className="py-3 px-2">{getStatusBadge(trial.status)}</td>
                      <td className="py-3 px-2">{new Date(trial.trial_start).toLocaleDateString()}</td>
                      <td className="py-3 px-2">{new Date(trial.trial_end).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        {trial.converted_at
                          ? new Date(trial.converted_at).toLocaleDateString()
                          : '-'}
                      </td>
                      <td className="py-3 px-2">{trial.plan_after_trial || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
