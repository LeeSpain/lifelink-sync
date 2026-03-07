import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus, Edit, Euro, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddonCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval_type: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  sort_order: number;
  features: any;
  icon: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function AddonManagementPage() {
  const [addons, setAddons] = useState<AddonCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddonCatalogItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    price: 2.99,
    currency: 'EUR',
    interval_type: 'month',
    features: [''],
    icon: '',
    category: 'wellness',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('addon_catalog')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setAddons((data || []) as unknown as AddonCatalogItem[]);
    } catch (error: any) {
      toast.error('Failed to load add-ons: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (addon: AddonCatalogItem) => {
    setEditingAddon(addon);
    const features = Array.isArray(addon.features)
      ? addon.features
      : [];
    setFormData({
      slug: addon.slug,
      name: addon.name,
      description: addon.description || '',
      price: addon.price,
      currency: addon.currency,
      interval_type: addon.interval_type,
      features: features.length > 0 ? features : [''],
      icon: addon.icon || '',
      category: addon.category || 'wellness',
      is_active: addon.is_active,
      sort_order: addon.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAddon(null);
    setFormData({
      slug: '',
      name: '',
      description: '',
      price: 2.99,
      currency: 'EUR',
      interval_type: 'month',
      features: [''],
      icon: '',
      category: 'wellness',
      is_active: true,
      sort_order: addons.length,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const features = formData.features.filter(f => f.trim() !== '');
      const payload = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        currency: formData.currency,
        interval_type: formData.interval_type,
        features: JSON.stringify(features),
        icon: formData.icon || null,
        category: formData.category,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingAddon) {
        const { error } = await supabase
          .from('addon_catalog')
          .update(payload)
          .eq('id', editingAddon.id);
        if (error) throw error;
        toast.success('Add-on updated successfully');
      } else {
        const { error } = await supabase
          .from('addon_catalog')
          .insert(payload);
        if (error) throw error;
        toast.success('Add-on created successfully');
      }

      setIsDialogOpen(false);
      loadAddons();
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (addon: AddonCatalogItem) => {
    try {
      const { error } = await supabase
        .from('addon_catalog')
        .update({ is_active: !addon.is_active })
        .eq('id', addon.id);
      if (error) throw error;
      toast.success(`${addon.name} ${!addon.is_active ? 'activated' : 'deactivated'}`);
      loadAddons();
    } catch (error: any) {
      toast.error('Failed to toggle: ' + error.message);
    }
  };

  const handleStripeSetup = async () => {
    try {
      setSetupLoading(true);
      const { data, error } = await supabase.functions.invoke('setup-addon-stripe-products');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Stripe products created: ${data.results?.length || 0} items`);
      loadAddons();
    } catch (error: any) {
      toast.error('Stripe setup failed: ' + error.message);
    } finally {
      setSetupLoading(false);
    }
  };

  const addFeature = () => setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  const removeFeature = (index: number) => setFormData(prev => ({
    ...prev,
    features: prev.features.filter((_, i) => i !== index)
  }));
  const updateFeature = (index: number, value: string) => setFormData(prev => ({
    ...prev,
    features: prev.features.map((f, i) => i === index ? value : f)
  }));

  // Count add-ons missing Stripe IDs
  const missingStripe = addons.filter(a => a.is_active && !a.stripe_price_id).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add-On Management</h1>
          <p className="text-muted-foreground">Manage subscription add-ons and pricing</p>
        </div>
        <div className="flex gap-2">
          {missingStripe > 0 && (
            <Button onClick={handleStripeSetup} variant="outline" disabled={setupLoading}>
              {setupLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Euro className="h-4 w-4 mr-2" />}
              Setup Stripe ({missingStripe})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Add-On
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAddon ? 'Edit Add-On' : 'Create Add-On'}</DialogTitle>
                <DialogDescription>
                  {editingAddon ? 'Update add-on details' : 'Create a new subscription add-on'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={formData.slug}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g. daily_wellbeing"
                      disabled={!!editingAddon}
                    />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={formData.currency}
                      onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={formData.category}
                      onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="wellness, family"
                    />
                  </div>
                </div>
                <div>
                  <Label>Icon (Lucide name)</Label>
                  <Input
                    value={formData.icon}
                    onChange={e => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Heart, Users, Pill"
                  />
                </div>
                <div>
                  <Label>Features</Label>
                  {formData.features.map((f, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input
                        value={f}
                        onChange={e => updateFeature(i, e.target.value)}
                        placeholder={`Feature ${i + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeFeature(i)}>X</Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="mt-2" onClick={addFeature}>
                    + Add Feature
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : editingAddon ? 'Update Add-On' : 'Create Add-On'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map(addon => (
            <Card key={addon.id} className={!addon.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    {addon.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant={addon.is_active ? 'default' : 'secondary'}>
                      {addon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {addon.stripe_price_id && (
                      <Badge variant="outline" className="text-xs">Stripe</Badge>
                    )}
                  </div>
                </div>
                <CardDescription>{addon.slug} | {addon.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{addon.description}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold">{addon.currency === 'EUR' ? '\u20AC' : addon.currency}{addon.price.toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">/{addon.interval_type}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(addon)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(addon)}
                  >
                    {addon.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
