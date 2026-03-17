import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, Users, CreditCard,
  RefreshCw, ArrowUpRight, ArrowDownRight, Package,
  Zap, Target, AlertCircle, CheckCircle, BarChart2, ExternalLink, Loader2,
} from 'lucide-react';

interface RevenueData {
  mrr: number; arr: number; arpu: number;
  base_mrr: number; addon_mrr: number;
  paid_subscribers: number; trialing: number; active_addons: number;
  churn_rate: number; churn_count_30d: number;
  trial_conversion_rate: number; total_trials: number;
  monthly_trend: Array<{ key: string; month: string; new_subs: number; new_trials: number; mrr: number }>;
  stripe_balance: number;
  recent_payments: Array<{ id: string; amount: number; currency: string; description: string; created: number; status: string }>;
  addon_breakdown: Array<{ name: string; count: number; revenue: number }>;
  generated_at: string;
}

const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
const fmtShort = (n: number) => n >= 1000 ? `\u20AC${(n / 1000).toFixed(1)}k` : `\u20AC${n.toFixed(2)}`;
const timeAgo = (unix: number) => { const s = Math.floor(Date.now() / 1000 - unix); if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.name.includes('MRR') ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  );
};

const ADDON_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const RevenueAnalyticsPage: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'mrr' | 'subs' | 'trials'>('mrr');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase.functions.invoke('get-revenue-data');
      if (err) throw err;
      if (result?.error) throw new Error(result.error);
      setData(result);
    } catch (e: any) {
      console.error('Revenue load:', e);
      setError(e.message);
      toast({ title: 'Failed to load revenue data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const mrrSplit = data ? [
    { name: 'Base plan', value: data.base_mrr, color: '#ef4444' },
    { name: 'Add-ons', value: data.addon_mrr, color: '#3b82f6' },
  ] : [];

  return (
    <div className="px-8 py-6 w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Real subscription data
            {data?.generated_at && <span className="ml-2">· Updated {new Date(data.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            <ExternalLink className="w-4 h-4" /> Stripe
          </a>
          <Button onClick={load} variant="outline" className="flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Failed to load revenue data</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <Button onClick={load} variant="outline" className="ml-auto text-xs border-red-200 text-red-700 hover:bg-red-50">Try again</Button>
        </div>
      )}

      {/* Row 1: 6 metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'MRR', value: data ? fmtShort(data.mrr) : '—', sub: 'Monthly recurring', Icon: DollarSign, color: 'green' },
          { label: 'ARR', value: data ? fmtShort(data.arr) : '—', sub: 'Annual run rate', Icon: TrendingUp, color: 'blue' },
          { label: 'ARPU', value: data ? fmt(data.arpu) : '—', sub: 'Avg revenue/user', Icon: Target, color: 'purple' },
          { label: 'Paid subs', value: data?.paid_subscribers ?? '—', sub: `${data?.trialing || 0} on trial`, Icon: Users, color: 'red' },
          { label: 'Churn rate', value: data ? `${data.churn_rate}%` : '—', sub: `${data?.churn_count_30d || 0} cancelled`, Icon: data && data.churn_rate > 5 ? TrendingDown : TrendingUp, color: data && data.churn_rate > 5 ? 'red' : 'green' },
          { label: 'Trial conv.', value: data ? `${data.trial_conversion_rate}%` : '—', sub: `${data?.total_trials || 0} trials`, Icon: Zap, color: 'amber' },
        ].map(m => (
          <Card key={m.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{m.label}</span>
                <div className={`w-9 h-9 rounded-xl bg-${m.color}-50 flex items-center justify-center`}>
                  <m.Icon className={`w-4 h-4 text-${m.color}-500`} />
                </div>
              </div>
              {loading ? <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-24 mb-1" />
                : <p className="text-2xl font-bold text-gray-900 mb-1">{m.value}</p>}
              <p className="text-xs text-gray-400">{m.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stripe balance banner */}
      {data && data.stripe_balance > 0 && (
        <div className="flex items-center gap-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">Stripe balance: {fmt(data.stripe_balance)}</p>
            <p className="text-xs text-green-600 mt-0.5">Available for payout</p>
          </div>
          <a href="https://dashboard.stripe.com/balance" target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
            View <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Row 2: Chart + MRR split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700">Growth trend</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
              </div>
              <div className="flex gap-1">
                {([{ key: 'mrr', label: 'MRR' }, { key: 'subs', label: 'Subscribers' }, { key: 'trials', label: 'Trials' }] as const).map(t => (
                  <button key={t.key} onClick={() => setChartType(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${chartType === t.key ? 'bg-red-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
            ) : data.monthly_trend.length === 0 ? (
              <div className="h-52 flex items-center justify-center bg-gray-50 rounded-xl">
                <div className="text-center">
                  <BarChart2 className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Chart appears after 30+ days of data</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                {chartType === 'mrr' ? (
                  <LineChart data={data.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `\u20AC${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="mrr" name="MRR \u20AC" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: '#ef4444', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                ) : (
                  <BarChart data={data.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey={chartType === 'subs' ? 'new_subs' : 'new_trials'} name={chartType === 'subs' ? 'New subscribers' : 'New trials'} fill={chartType === 'subs' ? '#ef4444' : '#f59e0b'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">MRR breakdown</CardTitle>
            <p className="text-xs text-gray-400">Base vs add-ons</p>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <PieChart width={160} height={160}>
                    <Pie data={mrrSplit} cx={75} cy={75} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {mrrSplit.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-2">
                  {mrrSplit.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{fmt(item.value)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Total MRR</span>
                    <span className="text-sm font-bold text-gray-900">{fmt(data.mrr)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Addons + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700">Add-on revenue</CardTitle>
                <p className="text-xs text-gray-400">Active add-ons by type</p>
              </div>
              <span className="text-lg font-bold text-blue-600">{data ? fmt(data.addon_mrr) : '—'}/mo</span>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : data.addon_breakdown.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No add-ons active yet</p>
            ) : (
              <div className="space-y-3">
                {data.addon_breakdown.map((addon, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ADDON_COLORS[i % ADDON_COLORS.length] }} />
                      <span className="text-sm text-gray-700">{addon.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{addon.count} active</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(addon.revenue)}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700">Recent payments</CardTitle>
                <p className="text-xs text-gray-400">Live from Stripe</p>
              </div>
              <a href="https://dashboard.stripe.com/payments" target="_blank" rel="noopener noreferrer"
                className="text-xs text-red-600 font-medium hover:text-red-800 flex items-center gap-1">
                View all <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}</div>
            ) : data.recent_payments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No Stripe payments found. Check STRIPE_SECRET_KEY is configured.</p>
            ) : (
              <div className="space-y-2">
                {data.recent_payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800">{(payment.description || 'Subscription').slice(0, 35)}</p>
                        <p className="text-xs text-gray-400">{timeAgo(payment.created)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{fmt(payment.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Health indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue health', check: data && data.churn_rate < 5, good: 'Churn below 5%', bad: `Churn at ${data?.churn_rate}% — investigate` },
          { label: 'Trial pipeline', check: data && data.trialing > 0, good: `${data?.trialing} active trials`, bad: 'No active trials' },
          { label: 'Add-on adoption', check: data && data.active_addons > 0, good: `${data?.active_addons} active add-ons`, bad: 'No add-ons active' },
          { label: 'Stripe connected', check: data && data.recent_payments.length > 0, good: 'Payments flowing', bad: 'Check Stripe config' },
        ].map(ind => (
          <div key={ind.label} className={`border rounded-2xl p-4 ${loading ? 'border-gray-200' : ind.check ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {loading ? <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse" />
                : ind.check ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="text-xs font-semibold text-gray-700">{ind.label}</span>
            </div>
            <p className={`text-xs ${loading ? 'text-gray-400' : ind.check ? 'text-green-700' : 'text-red-700'}`}>
              {loading ? 'Checking...' : ind.check ? ind.good : ind.bad}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueAnalyticsPage;
