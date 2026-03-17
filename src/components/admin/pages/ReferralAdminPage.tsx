import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2, Users, Gift, Award, TrendingUp, Copy, Check,
  Star, Loader2, RefreshCw, MessageSquare, Search, CheckCircle, Clock,
} from 'lucide-react';

// ─────────────────────────────────────
// Types matching existing DB schema
// ─────────────────────────────────────

interface ReferrerRow {
  user_id: string;
  full_name: string;
  email: string;
  referral_code: string;
  referral_reward_granted: string | null;
  created_at: string;
  stars: ReferralStar[];
  total_referrals: number;
  active_stars: number;
  pending_stars: number;
  reward_eligible: boolean;
}

interface ReferralStar {
  id: string;
  star_position: number;
  referred_email: string;
  referred_user_id: string | null;
  status: string;
  converted_at: string | null;
  created_at: string;
}

interface RewardLog {
  id: string;
  user_id: string;
  reward_type: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────

const timeAgo = (date: string | null) => {
  if (!date) return '—';
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

// ─────────────────────────────────────
// Referrer Card
// ─────────────────────────────────────

function ReferrerCard({ referrer, onViewStars, onContact }: {
  referrer: ReferrerRow;
  onViewStars: (r: ReferrerRow) => void;
  onContact: (r: ReferrerRow) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(referrer.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tier = referrer.active_stars >= 5 ? 'champion'
    : referrer.active_stars >= 3 ? 'rising'
    : referrer.total_referrals >= 1 ? 'starter' : 'new';

  const tierCfg: Record<string, { label: string; color: string; bg: string }> = {
    champion: { label: 'Champion', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    rising: { label: 'Rising star', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    starter: { label: 'Getting started', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    new: { label: 'New', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
  };
  const tc = tierCfg[tier];

  return (
    <div className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all ${
      referrer.reward_eligible && !referrer.referral_reward_granted ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-200'
    }`}>
      {referrer.reward_eligible && !referrer.referral_reward_granted && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs font-medium text-amber-700">
          <Gift className="w-3.5 h-3.5 flex-shrink-0" />
          Eligible for 12 months free!
        </div>
      )}
      {referrer.referral_reward_granted && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4 text-xs font-medium text-green-700">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          Reward granted {timeAgo(referrer.referral_reward_granted)}
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center font-bold text-red-600 text-sm">
            {getInitials(referrer.full_name || referrer.email)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{referrer.full_name || referrer.email}</p>
            <p className="text-xs text-gray-400">{referrer.email}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
      </div>

      {/* 5-Star Progress */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map(pos => {
          const star = referrer.stars.find(s => s.star_position === pos);
          const isActive = star?.status === 'active';
          const isPending = star?.status === 'pending';
          return (
            <Star key={pos} className={`w-7 h-7 transition-colors ${
              isActive ? 'text-amber-400 fill-amber-400' : isPending ? 'text-amber-200 fill-amber-100' : 'text-gray-200'
            }`} />
          );
        })}
      </div>

      {/* Referral code */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2 mb-4">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Referral code</p>
          <p className="font-mono font-bold text-gray-900 text-sm tracking-wider">{referrer.referral_code}</p>
        </div>
        <button onClick={copyCode} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total', value: referrer.total_referrals, color: 'text-gray-900' },
          { label: 'Active', value: referrer.active_stars, color: 'text-green-600' },
          { label: 'Pending', value: referrer.pending_stars, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="text-center bg-gray-50 rounded-xl py-2">
            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => onViewStars(referrer)} className="flex-1 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
          View stars
        </button>
        <button onClick={() => onContact(referrer)} className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors flex-shrink-0">
          <MessageSquare className="w-3.5 h-3.5 text-green-600" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Stars Detail Panel
// ─────────────────────────────────────

function StarsPanel({ referrer, onClose }: { referrer: ReferrerRow; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-40 flex flex-col">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900">{referrer.full_name || referrer.email}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Code: {referrer.referral_code} · {referrer.total_referrals} referrals</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">X</button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {[1, 2, 3, 4, 5].map(pos => {
          const star = referrer.stars.find(s => s.star_position === pos);
          return (
            <div key={pos} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Star className={`w-6 h-6 flex-shrink-0 ${
                star?.status === 'active' ? 'text-amber-400 fill-amber-400' : star?.status === 'pending' ? 'text-amber-200 fill-amber-100' : 'text-gray-200'
              }`} />
              <div className="flex-1">
                {star ? (
                  <>
                    <p className="text-sm font-medium text-gray-800">{star.referred_email}</p>
                    <p className="text-xs text-gray-400">
                      {star.status === 'active' ? `Converted ${timeAgo(star.converted_at)}` : star.status === 'pending' ? 'Pending conversion' : star.status}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic">Star {pos} — empty</p>
                )}
              </div>
              <Badge className={`text-xs ${
                star?.status === 'active' ? 'bg-green-100 text-green-700' : star?.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
              }`}>
                {star?.status || 'empty'}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// Main Page
// ─────────────────────────────────────

export default function ReferralAdminPage() {
  const { toast } = useToast();
  const [referrers, setReferrers] = useState<ReferrerRow[]>([]);
  const [rewards, setRewards] = useState<RewardLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'eligible' | 'rewarded' | 'active'>('all');
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerRow | null>(null);
  const [activeTab, setActiveTab] = useState<'referrers' | 'rewards' | 'rules'>('referrers');
  const [stats, setStats] = useState({ totalReferrers: 0, totalReferrals: 0, activeStars: 0, rewardsGranted: 0, eligible: 0, conversionRate: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get all profiles with referral codes
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, referral_code, referral_reward_granted, created_at')
        .not('referral_code', 'is', null)
        .order('created_at', { ascending: false });

      // Get all referrals (the star records)
      const { data: allReferrals } = await (supabase as any)
        .from('referrals')
        .select('id, referrer_id, referred_user_id, referred_email, star_position, status, converted_at, created_at')
        .order('star_position', { ascending: true });

      // Get subscriber emails for profiles
      const { data: subs } = await supabase
        .from('subscribers')
        .select('user_id, email');
      const emailMap: Record<string, string> = {};
      subs?.forEach(s => { if (s.user_id && s.email) emailMap[s.user_id] = s.email; });

      // Get rewards
      const { data: rewardData } = await (supabase as any)
        .from('referral_rewards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setRewards(rewardData || []);

      // Build referrer rows
      const refs = allReferrals || [];
      const rows: ReferrerRow[] = (profiles || []).map(p => {
        const myStars: ReferralStar[] = refs
          .filter((r: any) => r.referrer_id === p.user_id)
          .map((r: any) => ({
            id: r.id,
            star_position: r.star_position,
            referred_email: r.referred_email || '',
            referred_user_id: r.referred_user_id,
            status: r.status,
            converted_at: r.converted_at,
            created_at: r.created_at,
          }));

        const activeCount = myStars.filter(s => s.status === 'active').length;
        const pendingCount = myStars.filter(s => s.status === 'pending').length;

        return {
          user_id: p.user_id,
          full_name: p.full_name || '',
          email: emailMap[p.user_id] || '',
          referral_code: p.referral_code || '',
          referral_reward_granted: p.referral_reward_granted,
          created_at: p.created_at,
          stars: myStars,
          total_referrals: myStars.length,
          active_stars: activeCount,
          pending_stars: pendingCount,
          reward_eligible: activeCount >= 5,
        };
      });

      // Sort: eligible first, then by active stars
      rows.sort((a, b) => {
        if (a.reward_eligible && !a.referral_reward_granted && !(b.reward_eligible && !b.referral_reward_granted)) return -1;
        if (b.reward_eligible && !b.referral_reward_granted && !(a.reward_eligible && !a.referral_reward_granted)) return 1;
        return b.active_stars - a.active_stars;
      });

      setReferrers(rows);

      const totalReferrals = refs.length;
      const activeStars = refs.filter((r: any) => r.status === 'active').length;
      const rewarded = rows.filter(r => r.referral_reward_granted).length;
      const eligible = rows.filter(r => r.reward_eligible && !r.referral_reward_granted).length;
      const withRefs = rows.filter(r => r.total_referrals > 0).length;

      setStats({
        totalReferrers: withRefs,
        totalReferrals,
        activeStars,
        rewardsGranted: rewarded,
        eligible,
        conversionRate: totalReferrals > 0 ? Math.round((activeStars / totalReferrals) * 100) : 0,
      });
    } catch (err) {
      console.error('Failed to load referral data:', err);
      toast({ title: 'Failed to load referral data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleContact = (r: ReferrerRow) => {
    const msg = `Hi ${r.full_name || 'there'}, this is Lee from LifeLink Sync! Just wanted to say thank you for sharing our service — you've referred ${r.total_referrals} people so far and have ${r.active_stars}/5 active stars. You're amazing!`;
    navigator.clipboard.writeText(msg);
    toast({ title: 'Thank you message copied to clipboard' });
  };

  const filtered = referrers.filter(r => {
    if (filter === 'eligible') return r.reward_eligible && !r.referral_reward_granted;
    if (filter === 'rewarded') return !!r.referral_reward_granted;
    if (filter === 'active') return r.total_referrals > 0;
    return true;
  }).filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.full_name?.toLowerCase().includes(s) || r.email?.toLowerCase().includes(s) || r.referral_code?.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Programme</h1>
          <p className="text-gray-400 text-sm mt-0.5">5 active stars = 12 months free. Track, manage and reward referrers.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Eligible alert */}
      {stats.eligible > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3.5 mb-6">
          <Gift className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            <strong>{stats.eligible} {stats.eligible === 1 ? 'person is' : 'people are'}</strong> eligible for 12 months free — scroll down to review.
          </p>
          <button onClick={() => setFilter('eligible')} className="ml-auto text-xs font-semibold text-amber-700 hover:text-amber-900">View &rarr;</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Active referrers', value: stats.totalReferrers, Icon: Users, color: 'blue' },
          { label: 'Total referrals', value: stats.totalReferrals, Icon: Share2, color: 'purple' },
          { label: 'Active stars', value: stats.activeStars, Icon: Star, color: 'amber' },
          { label: 'Conversion rate', value: `${stats.conversionRate}%`, Icon: TrendingUp, color: 'green' },
          { label: 'Rewards granted', value: stats.rewardsGranted, Icon: Gift, color: 'indigo' },
          { label: 'Eligible now', value: stats.eligible, Icon: Award, color: 'red', highlight: stats.eligible > 0 },
        ].map(s => (
          <Card key={s.label} className={s.highlight ? 'border-amber-300 ring-1 ring-amber-200' : ''}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center`}>
                  <s.Icon className={`w-5 h-5 text-${s.color}-500`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'referrers', label: 'Referrers' },
          { key: 'rewards', label: 'Reward history' },
          { key: 'rules', label: 'Programme rules' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Referrers */}
      {activeTab === 'referrers' && (
        <>
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search referrers..."
                className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
            {(['all', 'eligible', 'rewarded', 'active'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize ${
                  filter === f ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {f === 'eligible' ? `🎁 ${f}` : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-gray-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Share2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">{search || filter !== 'all' ? 'No referrers match your filter' : 'No referrers yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(r => (
                <ReferrerCard key={r.user_id} referrer={r} onViewStars={setSelectedReferrer} onContact={handleContact} />
              ))}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <p className="text-xs text-gray-400 mt-4 text-center">Showing {filtered.length} referrers</p>
          )}
        </>
      )}

      {/* Tab: Reward history */}
      {activeTab === 'rewards' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Reward history</CardTitle>
            <p className="text-xs text-gray-400">All 12-month free rewards granted</p>
          </CardHeader>
          <CardContent>
            {rewards.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No rewards granted yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Referrer', 'Reward type', 'Status', 'Started', 'Expires', 'Date'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rewards.map(r => {
                      const ref = referrers.find(rr => rr.user_id === r.user_id);
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{ref?.full_name || ref?.email || r.user_id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{r.reward_type?.replace(/_/g, ' ') || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${r.status === 'active' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">{r.starts_at ? timeAgo(r.starts_at) : '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{r.ends_at ? timeAgo(r.ends_at) : '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{timeAgo(r.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Programme rules */}
      {activeTab === 'rules' && (
        <div className="max-w-xl space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                How the 5-Star programme works
              </h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Member gets a unique code', desc: 'Every member gets a CLARAXXXX code auto-generated on signup' },
                  { step: '2', title: 'They share it with friends', desc: 'Friends use the code when signing up at lifelink-sync.com' },
                  { step: '3', title: 'Each paying referral = 1 gold star', desc: 'When a referred person becomes a paying subscriber, their star turns gold' },
                  { step: '4', title: '5 gold stars = 12 months free', desc: 'Once all 5 stars are gold (5 active paying referrals), they earn 12 months free' },
                  { step: '5', title: 'Stars can dim', desc: 'If a referred person cancels, their star goes back to silver. Re-subscribing re-lights it.' },
                ].map(rule => (
                  <div key={rule.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{rule.step}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{rule.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Referral URL format</h3>
              <div className="bg-gray-50 rounded-xl px-3 py-2 font-mono text-xs text-gray-600">
                https://lifelink-sync.com/onboarding?ref=CLARAXXXX
              </div>
              <p className="text-xs text-gray-400 mt-2">Replace CLARAXXXX with the member's referral code.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stars detail panel */}
      {selectedReferrer && (
        <>
          <div className="fixed inset-0 bg-black/20 z-30" onClick={() => setSelectedReferrer(null)} />
          <StarsPanel referrer={selectedReferrer} onClose={() => setSelectedReferrer(null)} />
        </>
      )}
    </div>
  );
}
