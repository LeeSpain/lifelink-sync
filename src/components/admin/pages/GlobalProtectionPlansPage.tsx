import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Users, 
  Star, 
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: string;
  stripe_price_id: string | null;
  features: any; // Will be cast as string[] when used
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const GlobalProtectionPlansPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'EUR',
    billing_interval: 'month',
    stripe_price_id: '',
    features: '',
    is_active: true,
    is_popular: false,
    sort_order: 0
  });

  useEffect(() => {
    loadPlans();
    
    // Defensive cleanup for modal states
    return () => {
      setShowCreateDialog(false);
      setShowEditDialog(false);
      setEditingPlan(null);
    };
  }, []);

  // Force close all dialogs when component mounts (defensive cleanup)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateDialog(false);
        setShowEditDialog(false);
        setEditingPlan(null);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans((data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : []
      })));
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'EUR',
      billing_interval: 'month',
      stripe_price_id: '',
      features: '',
      is_active: true,
      is_popular: false,
      sort_order: 0
    });
  };

  const handleCreate = () => {
    resetForm();
    setFormData(prev => ({ ...prev, sort_order: plans.length + 1 }));
    setShowCreateDialog(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      currency: plan.currency,
      billing_interval: plan.billing_interval,
      stripe_price_id: plan.stripe_price_id || '',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      sort_order: plan.sort_order
    });
    setShowEditDialog(true);
  };

  const handleSubmit = async (isEdit: boolean = false) => {
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Plan name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      toast({
        title: "Validation Error", 
        description: "Valid price is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const featuresArray = formData.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const planData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billing_interval: formData.billing_interval,
        stripe_price_id: formData.stripe_price_id?.trim() || null,
        features: featuresArray,
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        sort_order: formData.sort_order,
        updated_at: new Date().toISOString()
      };

      let error;
      if (isEdit && editingPlan) {
        ({ error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan.id));
      } else {
        ({ error } = await supabase
          .from('subscription_plans')
          .insert([planData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Plan ${isEdit ? 'updated' : 'created'} successfully`
      });

      setShowCreateDialog(false);
      setShowEditDialog(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEdit ? 'update' : 'create'} plan`,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Plan deleted successfully"
      });
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete plan",
        variant: "destructive"
      });
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Plan ${!currentStatus ? 'activated' : 'deactivated'}`
      });
      loadPlans();
    } catch (error) {
      console.error('Error updating plan status:', error);
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number, currency: string, interval: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
    return `${formatted}/${interval}`;
  };

  const PlanForm = ({ isEdit }: { isEdit: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Basic Protection"
          />
        </div>
        <div>
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            value={formData.sort_order}
            onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of the plan"
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
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="9.99"
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="billing_interval">Billing Interval</Label>
          <Select value={formData.billing_interval} onValueChange={(value) => setFormData(prev => ({ ...prev, billing_interval: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="stripe_price_id">Stripe Price ID (Optional)</Label>
        <Input
          id="stripe_price_id"
          value={formData.stripe_price_id}
          onChange={(e) => setFormData(prev => ({ ...prev, stripe_price_id: e.target.value }))}
          placeholder="price_1234567890"
        />
      </div>

      <div>
        <Label htmlFor="features">Features (one per line)</Label>
        <Textarea
          id="features"
          value={formData.features}
          onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
          placeholder="24/7 Emergency Response&#10;GPS Location Tracking&#10;Emergency Contacts"
          rows={6}
        />
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
          />
          <Label htmlFor="is_active">Active</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_popular"
            checked={formData.is_popular}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
          />
          <Label htmlFor="is_popular">Popular/Featured</Label>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Global Protection Plans</h1>
          <p className="text-muted-foreground">Manage subscription pricing and plan features</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl z-[70]">
            <DialogHeader>
              <DialogTitle>Create New Protection Plan</DialogTitle>
              <DialogDescription>
                Add a new subscription plan with pricing and features
              </DialogDescription>
            </DialogHeader>
            <PlanForm isEdit={false} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSubmit(false)}>
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{plans.length}</p>
                <p className="text-sm text-muted-foreground">Total Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emergency" />
              <div>
                <p className="text-2xl font-bold">{plans.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-wellness" />
              <div>
                <p className="text-2xl font-bold">{plans.filter(p => p.is_popular).length}</p>
                <p className="text-sm text-muted-foreground">Featured Plans</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Manage all protection plan pricing and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        {plan.description && (
                          <div className="text-sm text-muted-foreground">{plan.description}</div>
                        )}
                      </div>
                      {plan.is_popular && (
                        <Badge className="bg-wellness/10 text-wellness">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(plan.price, plan.currency, plan.billing_interval)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {plan.billing_interval}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {Array.isArray(plan.features) ? plan.features.length : 0} features
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                      >
                        {plan.is_active ? (
                          <>
                            <Eye className="h-4 w-4 mr-1 text-emergency" />
                            <span className="text-emergency">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-muted-foreground">Inactive</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog open={showEditDialog && editingPlan?.id === plan.id} onOpenChange={setShowEditDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl z-[70]">
                          <DialogHeader>
                            <DialogTitle>Edit Protection Plan</DialogTitle>
                            <DialogDescription>
                              Update plan details, pricing, and features
                            </DialogDescription>
                          </DialogHeader>
                          <PlanForm isEdit={true} />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={() => handleSubmit(true)}>
                              Update Plan
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{plan.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(plan.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalProtectionPlansPage;