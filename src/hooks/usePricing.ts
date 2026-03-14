import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricingConfig {
  individual_monthly: number;
  individual_annual: number;
  family_link_monthly: number;
  addon_daily_wellbeing: number;
  addon_medication_reminder: number;
  trial_days: number;
  pendant_price: number;
}

const FALLBACK_PRICES: PricingConfig = {
  individual_monthly: 9.99,
  individual_annual: 99.90,
  family_link_monthly: 2.99,
  addon_daily_wellbeing: 2.99,
  addon_medication_reminder: 2.99,
  trial_days: 7,
  pendant_price: 59.99,
};

export function usePricing() {
  const [prices, setPrices] = useState<PricingConfig>(FALLBACK_PRICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        // Query pricing_config using .rpc or raw select
        // The table may not exist yet in generated types, so use type assertion
        const { data, error: fetchError } = await (supabase as any)
          .from('pricing_config')
          .select('key, value')
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        if (data && Array.isArray(data)) {
          const mapped = data.reduce((acc: Partial<PricingConfig>, row: { key: string; value: number }) => ({
            ...acc,
            [row.key]: Number(row.value),
          }), {});

          setPrices({ ...FALLBACK_PRICES, ...mapped });
        }
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
        setError('Using default prices');
        // Fallback prices already set
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, []);

  /** Format a price with currency symbol */
  const formatPrice = (amount: number, currency = '€') => `${currency}${amount.toFixed(2)}`;

  return { prices, loading, error, formatPrice };
}
