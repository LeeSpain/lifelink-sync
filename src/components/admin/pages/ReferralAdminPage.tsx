import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gift, Star, Users, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
  id: string;
  referrer_id: string;
  referred_email: string;
  status: string;
  star_level: number;
  reward_amount: number;
  created_at: string;
  referrer_name?: string;
  referrer_email?: string;
}

export default function ReferralAdminPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch referrer profiles
      const referrerIds = [...new Set((data || []).map((r: any) => r.referrer_id).filter(Boolean))];
      let profiles: Record<string, { full_name: string; email: string }> = {};
      if (referrerIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', referrerIds);
        if (profileData) {
          profiles = Object.fromEntries(profileData.map(p => [p.id, { full_name: p.full_name || '', email: p.email || '' }]));
        }
      }

      setReferrals((data || []).map((r: any) => ({
        ...r,
        star_level: r.star_level || 0,
        reward_amount: r.reward_amount || 0,
        referrer_name: profiles[r.referrer_id]?.full_name || 'Unknown',
        referrer_email: profiles[r.referrer_id]?.email || '',
      })));
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await (supabase as any)
        .from('referrals')
        .update({ status: newStatus })
        .eq('id', id);
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const filtered = filter === 'all' ? referrals : referrals.filter(r => r.status === filter);
  const totalReferrals = referrals.length;
  const activeStars = referrals.reduce((sum, r) => sum + (r.star_level || 0), 0);
  const rewardsPaid = referrals.filter(r => r.status === 'rewarded').reduce((sum, r) => sum + (r.reward_amount || 0), 0);
  const conversionRate = totalReferrals > 0
    ? Math.round((referrals.filter(r => r.status === 'active' || r.status === 'rewarded').length / totalReferrals) * 100)
    : 0;

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'rewarded': return 'bg-blue-500/10 text-blue-500';
      case 'lapsed': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Referral Management</h1>
        <p className="text-muted-foreground">View and manage all referrals across the platform</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{activeStars}</p>
                <p className="text-xs text-muted-foreground">Total Stars Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">&euro;{rewardsPaid.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Rewards Paid Out</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Referrals</CardTitle>
              <CardDescription>Filter and manage individual referrals</CardDescription>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="rewarded">Rewarded</SelectItem>
                <SelectItem value="lapsed">Lapsed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No referrals found</p>
              <p className="text-sm">Referrals will appear here once members start sharing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Referrer</th>
                    <th className="pb-3 font-medium">Referred Email</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Stars</th>
                    <th className="pb-3 font-medium">Reward</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3">
                        <p className="font-medium">{r.referrer_name}</p>
                        <p className="text-xs text-muted-foreground">{r.referrer_email}</p>
                      </td>
                      <td className="py-3">{r.referred_email}</td>
                      <td className="py-3">
                        <Badge className={statusColor(r.status)} variant="secondary">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`h-3.5 w-3.5 ${i <= r.star_level ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="py-3">{r.reward_amount > 0 ? `€${r.reward_amount}` : '—'}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="rewarded">Rewarded</SelectItem>
                            <SelectItem value="lapsed">Lapsed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
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
