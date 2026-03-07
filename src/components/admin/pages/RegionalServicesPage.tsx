import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MapPin, Star, Save, X } from 'lucide-react';

interface RegionalPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  region: string;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

const RegionalServicesPage = () => {
  const [plans, setPlans] = useState<RegionalPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<RegionalPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const emptyPlan: Omit<RegionalPlan, 'id'> = {
    name: '',
    description: '',
    price: 0,
    currency: 'EUR',
    region: '',
    features: [],
    is_popular: false,
    is_active: true,
    sort_order: 0
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('regional_services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching regional plans:', error);
      toast.error('Failed to load regional services');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (planData: Omit<RegionalPlan, 'id'> & { id?: string }) => {
    try {
      if (planData.id) {
        // Update existing plan
        const { error } = await supabase
          .from('regional_services')
          .update({
            name: planData.name,
            description: planData.description,
            price: planData.price,
            currency: planData.currency,
            region: planData.region,
            features: planData.features,
            is_popular: planData.is_popular,
            is_active: planData.is_active,
            sort_order: planData.sort_order
          })
          .eq('id', planData.id);

        if (error) throw error;
        toast.success('Regional service updated successfully');
      } else {
        // Create new plan
        const { error } = await supabase
          .from('regional_services')
          .insert({
            name: planData.name,
            description: planData.description,
            price: planData.price,
            currency: planData.currency,
            region: planData.region,
            features: planData.features,
            is_popular: planData.is_popular,
            is_active: planData.is_active,
            sort_order: planData.sort_order
          });

        if (error) throw error;
        toast.success('Regional service created successfully');
      }

      setEditingPlan(null);
      setIsCreating(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Failed to save regional service');
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this regional service?')) return;

    try {
      const { error } = await supabase
        .from('regional_services')
        .delete()
        .eq('id', planId);

      if (error) throw error;
      toast.success('Regional service deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Failed to delete regional service');
    }
  };

  const PlanForm = ({ plan, onSave, onCancel }: {
    plan: RegionalPlan | (Omit<RegionalPlan, 'id'> & { id?: string });
    onSave: (plan: Omit<RegionalPlan, 'id'> & { id?: string }) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(plan);
    const [featuresText, setFeaturesText] = useState(plan.features.join('\n'));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        features: featuresText.split('\n').filter(f => f.trim())
      });
    };

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {plan.id ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {plan.id ? 'Edit Regional Service' : 'Create Regional Service'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., Spain, Germany, France"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={6}
                placeholder="24/7 Regional Call Center&#10;Local Emergency Response&#10;Regional Language Support"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="is_popular">Popular Service</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Service
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="p-6">Loading regional services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Regional Services Management</h1>
          <p className="text-muted-foreground">Manage specialized regional emergency services</p>
        </div>
        {!isCreating && !editingPlan && (
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Regional Service
          </Button>
        )}
      </div>

      {isCreating && (
        <PlanForm
          plan={emptyPlan}
          onSave={handleSave}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {editingPlan && (
        <PlanForm
          plan={editingPlan}
          onSave={handleSave}
          onCancel={() => setEditingPlan(null)}
        />
      )}

      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {plan.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    {plan.is_popular && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Popular
                      </Badge>
                    )}
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">
                      {plan.region}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingPlan(plan)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary">
                    {plan.price} {plan.currency}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per month • Sort: {plan.sort_order}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && !isCreating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Regional Services</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first regional service to offer specialized coverage for specific regions.
            </p>
            <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Regional Service
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegionalServicesPage;