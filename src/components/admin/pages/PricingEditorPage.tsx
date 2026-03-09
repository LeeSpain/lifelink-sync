import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Save, Loader2, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PricingRow {
  id: string;
  key: string;
  value: number;
  currency: string;
  label: string;
  description: string | null;
  is_active: boolean;
  updated_at: string;
}

export default function PricingEditorPage() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('pricing_config')
        .select('*')
        .order('key');

      if (error) throw error;
      const pricing = (data || []) as PricingRow[];
      setRows(pricing);
      // Initialize edit values
      const initial: Record<string, string> = {};
      pricing.forEach((r) => { initial[r.key] = String(r.value); });
      setEditValues(initial);
    } catch (error: any) {
      toast.error('Failed to load pricing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (row: PricingRow) => {
    const newValue = parseFloat(editValues[row.key]);
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setSaving(row.key);
      const { error } = await (supabase as any)
        .from('pricing_config')
        .update({ value: newValue })
        .eq('id', row.id);

      if (error) throw error;
      toast.success(`${row.label} updated to ${row.currency === 'EUR' ? '€' : row.currency}${newValue.toFixed(2)}`);
      await loadPricing();
    } catch (error: any) {
      toast.error('Failed to update: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const hasChanged = (key: string, original: number) => {
    const edited = parseFloat(editValues[key]);
    return !isNaN(edited) && edited !== original;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Configuration</h1>
          <p className="text-muted-foreground">
            Edit prices here — changes apply immediately across the entire site.
          </p>
        </div>
        <Button variant="outline" onClick={loadPricing} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pricing data found. Run the pricing_config migration first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <Card key={row.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{row.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {row.key}
                      </Badge>
                      {row.is_active ? (
                        <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    {row.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{row.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {row.currency === 'EUR' ? '€' : row.currency}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-24 text-right"
                      value={editValues[row.key] ?? ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [row.key]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(row)}
                      disabled={!hasChanged(row.key, row.value) || saving === row.key}
                    >
                      {saving === row.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : hasChanged(row.key, row.value) ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How it works</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>Prices are stored in the <code>pricing_config</code> Supabase table.</p>
          <p>The frontend <code>usePricing()</code> hook reads these values on load.</p>
          <p>If the table is unreachable, hardcoded fallback prices are used.</p>
          <p>Changes here take effect on next page load (no redeploy needed).</p>
        </CardContent>
      </Card>
    </div>
  );
}
