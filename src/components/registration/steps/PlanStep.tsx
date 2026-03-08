import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  status: string;
}

interface RegionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  region: string;
  features: string[];
}

interface PlanStepProps {
  data: {
    selectedPlanId: string;
    isTrialSelected: boolean;
    selectedProducts: string[];
    selectedServices: string[];
  };
  onChange: (field: string, value: any) => void;
}

const PlanStep: React.FC<PlanStepProps> = ({ data, onChange }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<RegionalService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, productsRes, servicesRes] = await Promise.all([
          supabase.from('subscription_plans').select('*').eq('is_active', true).eq('billing_interval', 'month').order('sort_order'),
          supabase.from('products').select('*').in('status', ['active', 'coming_soon']).order('sort_order'),
          supabase.from('regional_services').select('*').eq('is_active', true).order('sort_order'),
        ]);

        if (plansRes.data) {
          setPlans(plansRes.data.map(p => ({
            id: p.id, name: p.name, description: p.description || '',
            price: parseFloat(p.price.toString()), currency: p.currency,
            billing_interval: p.billing_interval,
            features: Array.isArray(p.features) ? p.features.map(String) : [],
            is_popular: p.is_popular,
          })));
        }
        if (productsRes.data) {
          setProducts(productsRes.data.map(p => ({
            id: p.id, name: p.name, description: p.description || '',
            price: parseFloat(p.price.toString()), currency: p.currency,
            features: Array.isArray(p.features) ? p.features.map(String) : [],
            status: p.status || 'active',
          })));
        }
        if (servicesRes.data) {
          setServices(servicesRes.data.map(s => ({
            id: s.id, name: s.name, description: s.description || '',
            price: parseFloat(s.price.toString()), currency: s.currency,
            region: s.region,
            features: Array.isArray(s.features) ? s.features.map(String) : [],
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

  const handleProductToggle = (productId: string, checked: boolean) => {
    const current = data.selectedProducts || [];
    onChange('selectedProducts', checked ? [...current, productId] : current.filter(id => id !== productId));
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    const current = data.selectedServices || [];
    onChange('selectedServices', checked ? [...current, serviceId] : current.filter(id => id !== serviceId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">Choose Your Plan</h2>
        <p className="text-sm text-muted-foreground">Select the protection level that's right for you</p>
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
              <h3 className="font-semibold text-foreground">7-Day Free Trial</h3>
              <Badge className="bg-wellness/10 text-wellness border-wellness/20">No card required</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Try LifeLink Sync free for 7 days. Includes SOS, Clara AI, location sharing, 1 emergency contact, and 1 family link.
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
                        <Star className="h-3 w-3 mr-1" /> Popular
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
                <span className="text-sm font-normal text-muted-foreground">/month</span>
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

      {/* Products (Optional) */}
      {products.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Optional Safety Products</h3>
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`product-${product.id}`}
                  checked={data.selectedProducts?.includes(product.id)}
                  onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                  disabled={product.status === 'coming_soon'}
                />
                <Label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{product.name}</span>
                      {product.status === 'coming_soon' && (
                        <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                      )}
                    </div>
                    <span className="text-sm font-semibold">{product.currency === 'EUR' ? '\u20AC' : '$'}{product.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regional Services (Optional) */}
      {services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Regional Services</h3>
          <div className="space-y-2">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={data.selectedServices?.includes(service.id)}
                  onCheckedChange={(checked) => handleServiceToggle(service.id, checked as boolean)}
                />
                <Label htmlFor={`service-${service.id}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{service.region}</Badge>
                    </div>
                    <span className="text-sm font-semibold">{service.currency === 'EUR' ? '\u20AC' : '$'}{service.price}/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanStep;
