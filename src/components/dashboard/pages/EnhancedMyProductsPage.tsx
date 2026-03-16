import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package,
  CreditCard,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Bluetooth,
  ExternalLink,
  Smartphone,
  Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import DeviceManagerButton from "@/components/devices/DeviceManagerButton";

interface FlicButton {
  id: string;
  flic_uuid: string | null;
  name?: string | null;
  last_voltage?: number | null;
  updated_at?: string | null;
  created_at?: string | null;
}

interface FlicEvent {
  id: string;
  event: string;
  ts: string;
}

const EnhancedMyProductsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [regionalServices, setRegionalServices] = useState<any[]>([]);
  const [familyPlan, setFamilyPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Flic states
  const [flicButtons, setFlicButtons] = useState<FlicButton[]>([]);
  const [flicEvents, setFlicEvents] = useState<FlicEvent[]>([]);
  const [flicLoading, setFlicLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    loadFlicData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadAllData();
      loadFlicData();
    }, 30000);

    // Listen for URL parameters to open device manager
    const handleURLParams = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('open') === 'connect') {
        window.dispatchEvent(new Event('open-device-settings'));
      }
    };
    handleURLParams();

    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

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

      // Find family plan
      const familyPlanFromAdmin = plansData.find(plan => 
        plan.name.toLowerCase().includes('family') && plan.name.toLowerCase().includes('connection')
      ) || plansData.find(plan => 
        plan.name.toLowerCase().includes('family') || 
        plan.name.toLowerCase().includes('connection')
      );
      setFamilyPlan(familyPlanFromAdmin);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFlicData = async () => {
    setFlicLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load Flic buttons for current user
      const { data: buttons, error: btnError } = await supabase
        .from("devices_flic_buttons")
        .select("id, flic_uuid, name, last_voltage, updated_at, created_at")
        .eq("owner_user", user.id)
        .order("updated_at", { ascending: false });

      if (btnError) throw btnError;
      setFlicButtons(buttons || []);

      // Load recent events for the primary button
      if (buttons && buttons.length > 0) {
        const primaryButtonId = buttons[0].id;
        const { data: events, error: evError } = await supabase
          .from("devices_flic_events")
          .select("id, event, ts")
          .eq("button_id", primaryButtonId)
          .order("ts", { ascending: false })
          .limit(10);

        if (evError) throw evError;
        setFlicEvents(events || []);
      }
    } catch (error) {
      console.error('Error loading Flic data:', error);
    } finally {
      setFlicLoading(false);
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
          title: t('products.redirectingToPayment'),
          description: t('products.completePurchaseInNewTab'),
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: t('products.paymentError'),
        description: t('products.unableToProcessPayment'),
        variant: "destructive",
      });
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-primary/10 text-primary">{t('products.connected')}</Badge>;
      case 'disconnected': return <Badge variant="destructive">{t('products.disconnected')}</Badge>;
      default: return <Badge variant="secondary">{t('products.unknown')}</Badge>;
    }
  };

  const hasPremiumActive = Boolean(
    subscription?.subscribed ||
    (subscription?.plans && Array.isArray(subscription.plans) && subscription.plans.length > 0)
  );

  const primaryButton = flicButtons.length > 0 ? flicButtons[0] : null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('products.title')}</h1>
        <p className="text-muted-foreground">{t('products.subtitle')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="overview">{t('products.overview')}</TabsTrigger>
          <TabsTrigger value="devices">{t('products.connectedDevices')}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t('products.subscriptions')}</TabsTrigger>
          <TabsTrigger value="available">{t('products.availableProducts')}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('products.premiumProtection')}</p>
                    <p className="text-lg font-semibold">{hasPremiumActive ? t('products.active') : t('products.inactive')}</p>
                  </div>
                  <Shield className={`h-5 w-5 ${hasPremiumActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('products.flicDevices')}</p>
                    <p className="text-lg font-semibold">{flicButtons.length}</p>
                  </div>
                  <Bluetooth className={`h-5 w-5 ${flicButtons.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('products.productsOwned')}</p>
                    <p className="text-lg font-semibold">{userProducts.length}</p>
                  </div>
                  <Package className={`h-5 w-5 ${userProducts.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('products.regionalServices')}</p>
                    <p className="text-lg font-semibold">{profile?.has_spain_call_center ? t('products.active') : t('products.none')}</p>
                  </div>
                  <Smartphone className={`h-5 w-5 ${profile?.has_spain_call_center ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('products.quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => window.dispatchEvent(new Event('open-device-settings'))}
                >
                  <Bluetooth className="mr-2 h-4 w-4" />
                  {t('products.connectFlicDevice')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => navigate('/member-dashboard/subscription')}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t('products.manageSubscription')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  asChild
                >
                  <span className="inline-flex items-center opacity-50 cursor-not-allowed">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Coming Soon
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connected Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          {/* Flic Devices Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bluetooth className="h-5 w-5" />
                {t('products.flic2EmergencyButtons')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {flicLoading ? (
                <p className="text-sm text-muted-foreground">{t('products.loadingFlicDevices')}</p>
              ) : flicButtons.length === 0 ? (
                <div className="text-center py-8">
                  <Bluetooth className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('products.noFlicDevices')}</h3>
                  <p className="text-muted-foreground mb-4">{t('products.connectFlicToEnable')}</p>
                  <DeviceManagerButton />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Connected Devices</h4>
                    <DeviceManagerButton />
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device Name</TableHead>
                        <TableHead>UUID</TableHead>
                        <TableHead>Battery</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flicButtons.map((button) => (
                        <TableRow key={button.id}>
                          <TableCell>{button.name || 'Unnamed Device'}</TableCell>
                          <TableCell className="font-mono text-xs">{button.flic_uuid || '—'}</TableCell>
                          <TableCell>
                            {button.last_voltage ? `${button.last_voltage.toFixed(2)}V` : '—'}
                          </TableCell>
                          <TableCell>
                            {button.updated_at ? new Date(button.updated_at).toLocaleString() : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={button.last_voltage && button.last_voltage > 2.5 ? "default" : "destructive"}>
                              {button.last_voltage && button.last_voltage > 2.5 ? 'Active' : 'Low Battery'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Recent Events */}
                  {flicEvents.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Recent Button Events</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event Type</TableHead>
                            <TableHead>Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {flicEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="capitalize">{event.event}</TableCell>
                              <TableCell>{new Date(event.ts).toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        }
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Connected Products */}
          {userProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Other Connected Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProducts.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{product.name}</h4>
                            <p className="text-xs text-muted-foreground">{product.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(product.status)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.subscribed ? (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {subscription.plans?.[0]?.name || subscription.subscription_tier || 'Active Plan'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plans?.[0]?.price ? `€${subscription.plans[0].price} per ${subscription.plans[0].billing_interval}` : 'Active subscription'}
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      ✓ Active
                    </Badge>
                  </div>
                </div>
              ) : (
              <div className="p-4 bg-muted/50 rounded-lg border text-center">
                  <h3 className="font-semibold text-lg mb-2">No Active Subscription</h3>
                  <p className="text-sm text-muted-foreground mb-4">Subscribe to activate emergency protection</p>
                  <Button onClick={() => navigate('/member-dashboard/subscription')}>
                    Subscribe Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Available Products Tab */}
        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <Card key={product.id}>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm mb-2">{product.name}</h4>
                      <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">€{product.price}</span>
                        <Button
                          size="sm"
                          onClick={() => handlePurchaseProduct(product)}
                          disabled={purchaseLoading === product.id}
                        >
                          {purchaseLoading === product.id ? 'Processing...' : 'Purchase'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedMyProductsPage;
