import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, Check, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[];
  is_popular: boolean;
}

interface PlanStepProps {
  data: {
    selectedPlanId: string;
    isTrialSelected: boolean;
  };
  onChange: (field: string, value: any) => void;
}

const PlanStep: React.FC<PlanStepProps> = ({ data, onChange }) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const plansRes = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .eq('billing_interval', 'month')
          .order('sort_order');

        if (plansRes.data) {
          // Only show Individual-type plans — family/connection add-ons are post-join
          const individualPlans = plansRes.data.filter(p =>
            !p.name.toLowerCase().includes('family') &&
            !p.name.toLowerCase().includes('connection')
          );
          setPlans(individualPlans.map(p => ({
            id: p.id, name: p.name, description: p.description || '',
            price: parseFloat(p.price.toString()), currency: p.currency,
            billing_interval: p.billing_interval,
            features: Array.isArray(p.features) ? p.features.map(String) : [],
            is_popular: p.is_popular,
          })));
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectPlan = (planId: string) => {
    onChange('selectedPlanId', planId);
    onChange('isTrialSelected', false);
  };

  const handleSelectTrial = () => {
    onChange('selectedPlanId', '');
    onChange('isTrialSelected', true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">{t('registration.plan.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">{t('registration.plan.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('registration.plan.subtitle')}</p>
      </div>

      {/* Free Trial Option */}
      <Card
        className={`cursor-pointer transition-all border-2 ${
          data.isTrialSelected
            ? 'border-wellness bg-wellness/5 shadow-wellness'
            : 'border-border hover:border-wellness/50'
        }`}
        onClick={handleSelectTrial}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-wellness/10 flex items-center justify-center">
            <Clock className="h-6 w-6 text-wellness" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{t('registration.plan.freeTrialTitle')}</h3>
              <Badge className="bg-wellness/10 text-wellness border-wellness/20">{t('registration.plan.noCardRequired')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('registration.plan.freeTrialDesc')}
            </p>
          </div>
          <div className="flex-shrink-0">
            {data.isTrialSelected && (
              <div className="w-6 h-6 rounded-full bg-wellness flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paid Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all border-2 ${
              data.selectedPlanId === plan.id
                ? 'border-primary bg-primary/5 shadow-primary'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.is_popular && (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Star className="h-3 w-3 mr-1" /> {t('registration.plan.popular')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                {data.selectedPlanId === plan.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold text-foreground">
                {plan.currency === 'EUR' ? '\u20AC' : '$'}{plan.price}
                <span className="text-sm font-normal text-muted-foreground">/{t('registration.plan.month')}</span>
              </div>

              {plan.features.length > 0 && (
                <ul className="space-y-1.5">
                  {plan.features.slice(0, 5).map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 text-wellness mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default PlanStep;
