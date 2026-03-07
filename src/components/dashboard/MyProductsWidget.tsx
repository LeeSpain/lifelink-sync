import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package,
  CreditCard,
  ShoppingCart,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MyProductsWidgetProps {
  profile: any;
}

const MyProductsWidget = ({ profile }: MyProductsWidgetProps) => {
  const navigate = useNavigate();
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [regionalServices, setRegionalServices] = useState<any[]>([]);
  const [familyPlan, setFamilyPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadUserData();
    }, 30000);

    // Listen for page visibility changes to refresh when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadUserData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Set up real-time subscription to subscription_plans changes
  useEffect(() => {
    const channel = supabase
      .channel('subscription_plans_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_plans'
        },
        () => {
          console.log('Subscription plans updated, reloading...');
          loadUserData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Parallel loading for better performance
      const [
        subscriptionData,
        ordersData,
        productsData,
        servicesData,
        plansData
      ] = await Promise.all([
        checkSubscription(),
        loadOrders(user.id),
        loadAvailableProducts(),
        loadRegionalServices(),
        loadSubscriptionPlans()
      ]);

      setSubscription(subscriptionData);
      setUserProducts(ordersData);
      setAvailableProducts(productsData);
      setRegionalServices(servicesData);

      // Find family plan from admin-configured plans - prioritize exact matches
      const familyPlanFromAdmin = plansData.find(plan => 
        plan.name.toLowerCase().includes('family') && plan.name.toLowerCase().includes('connection')
      ) || plansData.find(plan => 
        plan.name.toLowerCase().includes('family') || 
        plan.name.toLowerCase().includes('connection')
      );
      
      console.log('Family plan loaded from admin:', familyPlanFromAdmin);
      setFamilyPlan(familyPlanFromAdmin);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { subscribed: false, subscription_tiers: [] };
    }
  };

  const loadOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(name, description, price, features, sku)
        `)
        .eq('user_id', userId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform orders to include product info
      return (data || []).map(order => ({
        id: order.id,
        name: order.product?.name || 'Unknown Product',
        description: order.product?.description || '',
        price: order.product?.price || 0,
        features: order.product?.features || [],
        sku: order.product?.sku || '',
        status: 'connected',
        purchase_date: order.created_at,
        order_id: order.id
      }));
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  };

  const loadAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading products:', error);
      return [];
    }
  };

  const loadRegionalServices = async () => {
    try {
      const { data, error } = await supabase
        .from('regional_services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading regional services:', error);
      return [];
    }
  };

  const loadSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      return [];
    }
  };

  const handlePurchaseProduct = async (product: any) => {
    try {
      setPurchaseLoading(product.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          productId: product.id,
          amount: Math.round(product.price * 100),
          currency: (product.currency || 'EUR').toLowerCase(),
          productName: product.name
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to payment",
          description: "Please complete your purchase in the new tab.",
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Payment Error",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handlePurchaseService = async (service: any) => {
    try {
      setPurchaseLoading(service.id);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          currency: service.currency || 'EUR'
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Please complete your subscription in the new tab.",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Checkout Error",
        description: "Unable to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleAddFamilyPlan = async () => {
    if (!familyPlan) return;
    try {
      setPurchaseLoading('family-plan');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planId: familyPlan.id,
          planName: familyPlan.name,
          price: familyPlan.price,
          currency: familyPlan.currency || 'EUR'
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ 
          title: 'Redirecting to checkout', 
          description: 'Complete your family plan purchase in the new tab.' 
        });
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      toast({ 
        title: 'Checkout Error', 
        description: 'Unable to start checkout. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Unable to open subscription management. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-emergency/10 text-emergency">Connected</Badge>;
      case 'disconnected': return <Badge variant="destructive">Disconnected</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Check family connection status by looking at actual family data
  const checkFamilyStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user is part of any family group (as owner or member)
      const [groupResponse, membershipResponse] = await Promise.all([
        supabase.from('family_groups').select('*').eq('owner_user_id', user.id),
        supabase.from('family_memberships').select('*').eq('user_id', user.id).eq('status', 'active')
      ]);

      return (groupResponse.data && groupResponse.data.length > 0) || 
             (membershipResponse.data && membershipResponse.data.length > 0);
    } catch (error) {
      console.error('Error checking family status:', error);
      return false;
    }
  };

  const [hasFamilyConnection, setHasFamilyConnection] = useState(false);

  useEffect(() => {
    checkFamilyStatus().then(setHasFamilyConnection);
  }, [subscription]);

  const hasPremiumActive = Boolean(
    subscription?.subscribed ||
    (subscription?.plans && Array.isArray(subscription.plans) && subscription.plans.length > 0) ||
    (Array.isArray(subscription?.subscription_tiers) && subscription.subscription_tiers.length > 0) ||
    (typeof subscription?.subscription_tier === 'string' && subscription.subscription_tier)
  );

  const hasSpainCallCentre = Boolean(profile?.has_spain_call_center);
  const hasFlicConnected = userProducts.some((p: any) =>
    (p.sku === 'ICE-PENDANT-001') ||
    /ice\s*sos|pendant|flic/i.test(p.name || '')
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          My Products & Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Products & Subscriptions */}
        <div className="space-y-2">
          <h4 className="font-medium">Connected Products & Subscriptions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Premium Protection</span>
              {getStatusBadge(hasPremiumActive ? 'connected' : 'disconnected')}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Family Connection</span>
              {getStatusBadge(hasFamilyConnection ? 'connected' : 'disconnected')}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Call Centre (Spain)</span>
              {getStatusBadge(hasSpainCallCentre ? 'connected' : 'disconnected')}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm">Flic 2 Devices</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(hasFlicConnected ? 'connected' : 'disconnected')}
                {!hasFlicConnected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.dispatchEvent(new Event('open-device-settings'))}
                  >
                    Add
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = '/member-dashboard/mobile-dashboard'}
                  >
                    Manage
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Overview */}
        {subscription?.subscribed ? (
          <div className="p-4 bg-emergency/5 rounded-lg border border-emergency/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {subscription.plans?.[0]?.name || subscription.subscription_tier || 'Active Plan'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscription.plans?.[0]?.price ? `€${subscription.plans[0].price} per ${subscription.plans[0].billing_interval}` : 'Active subscription'}
                </p>
              </div>
              <Badge className="bg-emergency text-black">
                ✓ Active
              </Badge>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">No Active Subscription</h3>
                <p className="text-sm text-muted-foreground">Subscribe to activate emergency protection</p>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/member-dashboard/subscription')}
                className="bg-emergency text-black hover:bg-emergency/90"
              >
                Subscribe
              </Button>
            </div>
          </div>
        )}

        {/* Family Connection Add-on - Only show if plan exists and user doesn't have family connection */}
        {familyPlan && familyPlan.price && !hasFamilyConnection && (
          <div className="p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mt-1">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-sm mb-1">Family Connection</h5>
                  <p className="text-xs text-muted-foreground mb-2">
                    Invite a trusted family member or carer to your dashboard for secure monitoring and support.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">
                      {familyPlan.currency || 'EUR'} {Number(familyPlan.price).toFixed(2)}/month
                    </span>
                    <span>• Add-on</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    • Secure dashboard access • Instant SOS alerts • Live protection status • View emergency profile
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddFamilyPlan}
                disabled={purchaseLoading === 'family-plan'}
                className="ml-3"
              >
                {purchaseLoading === 'family-plan' ? 'Processing...' : 'Add Family Member'}
              </Button>
            </div>
          </div>
        )}

        {/* Products Overview */}
        {userProducts.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium">Your Products</h4>
            {userProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Purchased {new Date(product.purchase_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(product.status)}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Available Products from Admin */}
            {availableProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Available Products</h4>
                  <Badge variant="outline" className="text-xs">
                    {availableProducts.length} products
                  </Badge>
                </div>
                {availableProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Package className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">{product.name}</h5>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {product.description || "Premium emergency device for enhanced personal safety and protection."}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">
                              {product.currency || 'EUR'} {Number(product.price || 0).toFixed(2)}
                            </span>
                            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                              <span>• {product.features.slice(0, 2).join(' • ')}</span>
                            )}
                          </div>
                          {product.inventory_count !== undefined && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {product.inventory_count > 0 ? (
                                <span className="text-green-600">✓ In Stock ({product.inventory_count} available)</span>
                              ) : (
                                <span className="text-orange-600">⚠ Out of Stock</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePurchaseProduct(product)}
                        disabled={purchaseLoading === product.id || product.inventory_count === 0}
                        className="ml-3"
                      >
                        {purchaseLoading === product.id ? 'Processing...' : 
                         product.inventory_count === 0 ? 'Out of Stock' : 'Purchase'}
                      </Button>
                    </div>
                  </div>
                ))}
                {availableProducts.length > 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = '/products'}
                  >
                    View All {availableProducts.length} Products
                  </Button>
                )}
              </div>
            )}

            {/* Regional Services from Admin */}
            {regionalServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Regional Services</h4>
                  <Badge variant="outline" className="text-xs">
                    {regionalServices.length} services
                  </Badge>
                </div>
                {regionalServices.slice(0, 2).map((service) => (
                  <div key={service.id} className="p-4 bg-muted/30 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">{service.name}</h5>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {service.description || "Regional emergency service for enhanced local protection."}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-semibold text-primary">
                              {service.currency || 'EUR'} {Number(service.price || 0).toFixed(2)}/month
                            </span>
                            <span>• {service.region}</span>
                          </div>
                          {service.features && Array.isArray(service.features) && service.features.length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              • {service.features.slice(0, 3).join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePurchaseService(service)}
                        disabled={purchaseLoading === service.id}
                        className="ml-3"
                      >
                        {purchaseLoading === service.id ? 'Processing...' : 'Subscribe'}
                      </Button>
                    </div>
                  </div>
                ))}
                {regionalServices.length > 2 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.location.href = '/services'}
                  >
                    View All Regional Services
                  </Button>
                )}
              </div>
            )}

            {availableProducts.length === 0 && regionalServices.length === 0 && (
              <div className="text-center py-4">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No products or services available</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          {subscription?.subscribed && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManageSubscription}
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Manage
            </Button>
          )}
          {(availableProducts.length > 0 || regionalServices.length > 0) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/member-dashboard/products'}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-1" />
              View All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyProductsWidget;