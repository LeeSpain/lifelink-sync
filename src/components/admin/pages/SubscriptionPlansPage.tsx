import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Plus, Edit, Trash2, Star, Euro, DollarSign, PoundSterling } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_interval: string;
  features: string[] | any;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  stripe_price_id?: string;
  region: string;
  created_at: string;
  updated_at: string;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'EUR',
    billing_interval: 'month',
    features: [''],
    is_active: true,
    is_popular: false,
    sort_order: 0,
    stripe_price_id: '',
    region: 'global'
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // Ensure features is always an array
      const processedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      }));
      
      setPlans(processedPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        features: Array.isArray(plan.features) ? plan.features : [],
        is_active: plan.is_active,
        is_popular: plan.is_popular,
        sort_order: plan.sort_order || 0,
        stripe_price_id: plan.stripe_price_id || '',
        region: plan.region || 'global'
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'EUR',
        billing_interval: 'month',
        features: [''],
        is_active: true,
        is_popular: false,
        sort_order: plans.length,
        stripe_price_id: '',
        region: 'global'
      });
    }
    setIsDialogOpen(true);
  };

  const savePlan = async () => {
    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }

    try {
      setSaving(true);
      const planData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        features: formData.features.filter(f => f.trim() !== ''),
        stripe_price_id: formData.stripe_price_id?.trim() || null,
        updated_at: new Date().toISOString()
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('Plan updated successfully');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            ...planData,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
        toast.success('Plan created successfully');
      }

      await loadPlans();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      await loadPlans();
      toast.success('Plan deleted successfully');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete plan');
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', planId);

      if (error) throw error;
      await loadPlans();
      toast.success(`Plan ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error('Failed to update plan status');
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'EUR': return <Euro className="h-4 w-4" />;
      case 'USD': return <DollarSign className="h-4 w-4" />;
      case 'GBP': return <PoundSterling className="h-4 w-4" />;
      default: return <Euro className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
              </DialogTitle>
              <DialogDescription>
                Configure the details for this subscription plan
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Premium Protection"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-price">Price</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="billing-interval">Billing Interval</Label>
                  <Select value={formData.billing_interval} onValueChange={(value) => setFormData({ ...formData, billing_interval: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Monthly</SelectItem>
                      <SelectItem value="year">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Input
                    id="sort-order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this plan..."
                />
              </div>

              <div>
                <Label htmlFor="stripe-price-id">Stripe Price ID (Optional)</Label>
                <Input
                  id="stripe-price-id"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_1234567890"
                />
              </div>

              <div>
                <Label>Features</Label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Feature description..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        disabled={formData.features.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                  />
                  <Label htmlFor="is-popular">Popular Plan</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={savePlan} disabled={saving}>
                  {saving ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {plan.name}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getCurrencyIcon(plan.currency)}
                <span className="text-2xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">/{plan.billing_interval}</span>
              </div>

              {plan.features && plan.features.length > 0 && (
                <div>
                  <p className="font-medium text-sm mb-2">Features:</p>
                  <ul className="text-sm space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Switch
                  checked={plan.is_active}
                  onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No subscription plans</h3>
            <p className="text-muted-foreground mb-4">Create your first subscription plan to get started</p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}