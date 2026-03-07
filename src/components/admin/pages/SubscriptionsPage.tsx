import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, CreditCard, DollarSign, Users, TrendingUp, Calendar, RefreshCw, Loader2, Euro, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import CustomerDetailsModal from '@/components/admin/CustomerDetailsModal';

interface Subscription {
  id: string;
  user_id?: string;
  email: string;
  stripe_customer_id?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  created_at: string;
  updated_at: string;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    loadRevenueData();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [searchTerm, tierFilter, statusFilter, subscriptions]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      
      // Use the new admin revenue function to get comprehensive data
      const { data, error } = await supabase.functions.invoke('get-admin-revenue');

      if (error) {
        console.error('Error loading revenue data:', error);
        toast.error('Failed to load revenue data');
        return;
      }

      console.log('Revenue data loaded:', data);
      setRevenueData(data);
      
      // Transform data to match Subscription interface
      const transformedData: Subscription[] = (data.subscribers || []).map((sub: any) => ({
        id: sub.id || sub.user_id || '',
        user_id: sub.user_id || '',
        email: sub.email || 'No email',
        stripe_customer_id: sub.stripe_customer_id,
        subscribed: sub.subscribed,
        subscription_tier: sub.subscription_tier || 'basic',
        subscription_end: sub.subscription_end,
        created_at: sub.created_at,
        updated_at: sub.updated_at
      }));

      setSubscriptions(transformedData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcileStripe = async () => {
    try {
      setReconciling(true);
      toast.info('Reconciling Stripe data...');
      
      const { data, error } = await supabase.functions.invoke('reconcile-stripe-data');
      
      if (error) {
        console.error('Reconciliation error:', error);
        toast.error('Failed to reconcile Stripe data');
        return;
      }
      
      toast.success('Stripe data reconciled successfully');
      // Reload data after reconciliation
      await loadRevenueData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchLower) ||
        sub.stripe_customer_id?.includes(searchTerm)
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_tier === tierFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(sub => sub.subscribed);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(sub => !sub.subscribed);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(sub => 
          sub.subscription_end && new Date(sub.subscription_end) < new Date()
        );
      }
    }

    setFilteredSubscriptions(filtered);
  };

  const getTierBadge = (tier?: string, subscribed?: boolean) => {
    if (!subscribed) {
      return <Badge variant="secondary">Free</Badge>;
    }
    
    switch (tier) {
      case 'basic':
        return <Badge variant="secondary">Basic</Badge>;
      case 'premium':
        return <Badge variant="default">Premium</Badge>;
      case 'call_centre':
        return <Badge variant="destructive">Call Centre</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    if (!subscription.subscribed) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (subscription.subscription_end) {
      const endDate = new Date(subscription.subscription_end);
      const now = new Date();
      
      if (endDate < now) {
        return <Badge variant="destructive">Expired</Badge>;
      } else if (endDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return <Badge variant="outline">Expiring Soon</Badge>;
      }
    }
    
    return <Badge className="bg-green-500">Active</Badge>;
  };

  const calculateRevenue = (tier?: string) => {
    switch (tier) {
      case 'basic': return 0;
      case 'premium': return 0.99;
      case 'call_centre': return 4.99;
      default: return 0;
    }
  };

  const handleViewCustomer = async (subscription: Subscription) => {
    try {
      // Fetch full customer profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', subscription.user_id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer profile:', error);
        toast.error('Failed to load customer details');
        return;
      }

      if (profile) {
        setSelectedCustomer({
          ...profile,
          email: subscription.email,
          subscription: {
            subscribed: subscription.subscribed,
            subscription_tier: subscription.subscription_tier,
            subscription_end: subscription.subscription_end
          }
        });
        setShowCustomerModal(true);
      } else {
        toast.error('Customer profile not found');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load customer details');
    }
  };

  const handleManageCustomer = (subscription: Subscription) => {
    if (subscription.stripe_customer_id) {
      // Open Stripe customer portal in new tab
      const stripePortalUrl = `https://dashboard.stripe.com/customers/${subscription.stripe_customer_id}`;
      window.open(stripePortalUrl, '_blank');
    } else {
      toast.error('No Stripe customer ID found for this subscription');
    }
  };

  // Use actual revenue data from the backend
  const totalRevenue = revenueData?.metrics?.totalRevenue || 0;
  const totalOrders = revenueData?.metrics?.totalOrders || 0;
  const totalCustomers = revenueData?.metrics?.totalCustomers || 0;
  const activeSubscriptions = revenueData?.metrics?.activeSubscriptions || 0;

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscribed).length,
    basic: subscriptions.filter(s => s.subscription_tier === 'basic' && s.subscribed).length,
    premium: subscriptions.filter(s => s.subscription_tier === 'premium' && s.subscribed).length,
    call_centre: subscriptions.filter(s => s.subscription_tier === 'call_centre' && s.subscribed).length,
    monthlyRevenue: subscriptions
      .filter(s => s.subscribed)
      .reduce((sum, s) => sum + calculateRevenue(s.subscription_tier), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Loading revenue data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Analytics</h1>
          <p className="text-muted-foreground">Real Stripe payment data and subscription metrics</p>
        </div>
        <Button 
          onClick={handleReconcileStripe}
          disabled={reconciling}
          variant="outline"
        >
          {reconciling ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync Stripe Data
        </Button>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All-time revenue from Stripe
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Completed payments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Premium: {stats.premium}, Call Centre: {stats.call_centre}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Unique paying customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      {revenueData?.rawData && (
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Orders in DB:</strong> {revenueData.rawData.allOrders?.length || 0}
              </div>
              <div>
                <strong>Subscribers in DB:</strong> {revenueData.rawData.allSubscribers?.length || 0}
              </div>
              <div>
                <strong>Completed Orders:</strong> {revenueData.orders?.length || 0}
              </div>
              <div>
                <strong>Active Subs:</strong> {revenueData.subscribers?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="call_centre">Call Centre</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions ({filteredSubscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Subscription End</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{subscription.email}</div>
                        {subscription.stripe_customer_id && (
                          <div className="text-sm text-muted-foreground">
                            Customer: {subscription.stripe_customer_id.substring(0, 15)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription)}
                    </TableCell>
                    <TableCell>
                      {getTierBadge(subscription.subscription_tier, subscription.subscribed)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        €{calculateRevenue(subscription.subscription_tier).toFixed(2)}/month
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscription.subscription_end ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {new Date(subscription.subscription_end).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(subscription.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewCustomer(subscription)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManageCustomer(subscription)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <CustomerDetailsModal
        customer={selectedCustomer}
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setSelectedCustomer(null);
        }}
        onUpdate={loadRevenueData}
      />
    </div>
  );
}