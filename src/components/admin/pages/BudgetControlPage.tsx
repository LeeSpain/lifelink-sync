import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { DollarSign, Lock, Unlock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Budget {
  id: string;
  budget_type: string;
  limit_amount: number;
  spent_amount: number;
  is_locked: boolean;
  alert_threshold: number;
  period_start: string;
  period_end: string;
}

function BudgetCard({ budget, onUpdate }: { budget: Budget; onUpdate: () => void }) {
  const [newLimit, setNewLimit] = useState(budget.limit_amount.toString());
  const [isSaving, setIsSaving] = useState(false);
  const pct = budget.limit_amount > 0 ? Math.round((budget.spent_amount / budget.limit_amount) * 100) : 0;

  const handleSaveLimit = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('clara_budget')
      .update({ limit_amount: parseFloat(newLimit), updated_at: new Date().toISOString() })
      .eq('id', budget.id);
    if (error) toast.error('Failed to update');
    else { toast.success(`${budget.budget_type} limit updated`); onUpdate(); }
    setIsSaving(false);
  };

  const handleToggleLock = async () => {
    const { error } = await supabase
      .from('clara_budget')
      .update({ is_locked: !budget.is_locked, updated_at: new Date().toISOString() })
      .eq('id', budget.id);
    if (error) toast.error('Failed');
    else { toast.success(budget.is_locked ? 'Unlocked' : 'Locked'); onUpdate(); }
  };

  const handleReset = async () => {
    const { error } = await supabase
      .from('clara_budget')
      .update({ spent_amount: 0, updated_at: new Date().toISOString() })
      .eq('id', budget.id);
    if (error) toast.error('Failed');
    else { toast.success('Spend reset to €0'); onUpdate(); }
  };

  return (
    <Card className={budget.is_locked ? 'border-red-500/30' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg capitalize">{budget.budget_type.replace(/_/g, ' ')}</CardTitle>
            {budget.is_locked && <Badge variant="destructive">Locked</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={handleToggleLock}>
            {budget.is_locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>€{budget.spent_amount.toFixed(2)} spent</span>
            <span>€{budget.limit_amount.toFixed(2)} limit</span>
          </div>
          <Progress value={Math.min(pct, 100)} className={pct >= 80 ? '[&>div]:bg-red-500' : pct >= 50 ? '[&>div]:bg-amber-500' : ''} />
          <p className="text-xs text-muted-foreground mt-1">{pct}% used</p>
        </div>

        <div className="flex gap-2">
          <Input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-32"
            step="10"
            min="0"
          />
          <Button size="sm" onClick={handleSaveLimit} disabled={isSaving || parseFloat(newLimit) === budget.limit_amount}>
            Set Limit
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BudgetControlPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBudgets = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('clara_budget')
      .select('*')
      .order('budget_type');
    setBudgets((data as unknown as Budget[]) || []);
    setIsLoading(false);
  };

  useEffect(() => { loadBudgets(); }, []);

  const handleLockAll = async () => {
    await supabase.from('clara_budget').update({ is_locked: true, updated_at: new Date().toISOString() }).neq('budget_type', '');
    toast.success('All budgets locked');
    loadBudgets();
  };

  const handleUnlockAll = async () => {
    await supabase.from('clara_budget').update({ is_locked: false, updated_at: new Date().toISOString() }).neq('budget_type', '');
    toast.success('All budgets unlocked');
    loadBudgets();
  };

  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent_amount || 0), 0);
  const totalBudget = budgets.find(b => b.budget_type === 'total_monthly')?.limit_amount || budgets.reduce((sum, b) => sum + b.limit_amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Budget Control</h1>
            <p className="text-muted-foreground mt-1">
              CLARA's spending limits. She checks these before any campaign or outreach.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleLockAll}>
            <Lock className="h-4 w-4 mr-1" /> Lock All
          </Button>
          <Button variant="outline" size="sm" onClick={handleUnlockAll}>
            <Unlock className="h-4 w-4 mr-1" /> Unlock All
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Monthly Spend</span>
            <span className="text-2xl font-bold">€{totalSpent.toFixed(2)} / €{totalBudget.toFixed(2)}</span>
          </div>
          <Progress value={totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0} className="mt-2" />
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Loading budgets...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => (
            <BudgetCard key={budget.id} budget={budget} onUpdate={loadBudgets} />
          ))}
        </div>
      )}
    </div>
  );
}
