import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Settings, CreditCard, AlertCircle, Download, Plus, Users, FileText, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionCardProps {
  subscription: any;
}

const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', relationship: '' });
  // Temporary simple toast function to avoid useToast dependency
  const toast = ({ title, description, variant }: any) => {
    console.log(`Toast: ${title} - ${description} (${variant || 'default'})`);
    alert(`${title}: ${description}`);
  };

  useEffect(() => {
    if (subscription?.subscribed) {
      loadInvoices();
      loadFamilyMembers();
      
      // Auto-refresh every 60 seconds
      const interval = setInterval(() => {
        loadInvoices();
        loadFamilyMembers();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [subscription]);

  const loadInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const { data, error } = await supabase.functions.invoke('billing-invoices');
      if (error) throw error;
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load billing history.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      setIsLoadingFamily(true);
      const { data, error } = await supabase.functions.invoke('family-invites');
      if (error) throw error;
      setFamilyMembers(data.familyMembers || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setIsLoadingFamily(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('billing-invoices', {
        body: new URLSearchParams({ action: 'download', invoiceId })
      });
      if (error) throw error;
      
      // Open PDF in new tab
      window.open(data.downloadUrl, '_blank');
      toast({
        title: "Success",
        description: `Invoice ${invoiceNumber} opened for download.`
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice.",
        variant: "destructive"
      });
    }
  };

  const sendFamilyInvite = async () => {
    try {
      if (!inviteForm.email || !inviteForm.name) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('family-invites', {
        body: inviteForm
      });
      if (error) throw error;

      toast({
        title: "Success",
        description: data.message
      });

      setInviteForm({ email: '', name: '', relationship: '' });
      setShowInviteForm(false);
      loadFamilyMembers();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive"
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Unable to open subscription management.",
        variant: "destructive"
      });
    }
  };

  const getSubscriptionStatus = () => {
    if (subscription?.subscribed) {
      return {
        status: "Active",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-4 w-4" />,
        description: "Your emergency protection is active"
      };
    }
    return {
      status: "Inactive",
      color: "bg-red-100 text-red-800",
      icon: <AlertCircle className="h-4 w-4" />,
      description: "Complete your subscription to activate protection"
    };
  };

  const status = getSubscriptionStatus();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-500" />
          Subscription & Billing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="billing">Billing & Invoices</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {status.icon}
                <div>
                  <Badge className={status.color}>
                    {status.status}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status.description}
                  </p>
                </div>
              </div>
            </div>

            {subscription?.subscribed ? (
              <div className="space-y-6">
                {/* Payment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">Current Plan</h4>
                    <p className="text-lg font-bold text-green-900 capitalize">
                      {subscription.subscription_tier?.replace('_', ' ') || 'Basic'}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1">Next Billing</h4>
                    <p className="text-lg font-bold text-blue-900">
                      {subscription.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString()
                        : 'Unknown'
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-1">Payment Status</h4>
                    <p className="text-lg font-bold text-purple-900">Active</p>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Payment Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Status:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {subscription.subscribed ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subscription End:</span>
                      <span className="ml-2 font-semibold">
                        {subscription.subscription_end 
                          ? new Date(subscription.subscription_end).toLocaleDateString()
                          : 'Not available'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Plan Type:</span>
                      <span className="ml-2 font-semibold capitalize">
                        {subscription.subscription_tier?.replace('_', ' ') || 'Basic'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Billing:</span>
                      <span className="ml-2 font-semibold">
                        {subscription.subscription_end ? 'Auto-Renewal Active' : 'Manage via Stripe'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Available Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Emergency SOS Button</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Emergency Contact Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Profile & Medical Info</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Dashboard Access</span>
                    </div>
                    {subscription.subscription_tier?.includes('spain') && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Spanish Call Center (€24.99/month)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Local Emergency Response</span>
                        </div>
                      </>
                    )}
                    {(subscription.subscription_tier?.includes('premium') || subscription.subscription_tier?.includes('family')) && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Family Connection Features</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">Enhanced Protection</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Quick Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleManageSubscription} variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                    <Button onClick={loadInvoices} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Latest Invoice
                    </Button>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Update Payment Method
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">
                  No active subscription found. Complete your subscription to access all emergency protection features.
                </p>
                <Button onClick={() => window.location.href = '/register'}>
                  Complete Subscription
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Enhanced Billing & Invoices Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xl">Billing History & Invoices</h4>
              <Button onClick={loadInvoices} variant="outline" size="sm" disabled={isLoadingInvoices}>
                <FileText className="h-4 w-4 mr-2" />
                {isLoadingInvoices ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            {/* Billing Summary */}
            {subscription?.subscribed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-semibold text-green-800 mb-1">Total Invoices</h5>
                  <p className="text-2xl font-bold text-green-900">{invoices.length}</p>
                  <p className="text-xs text-green-600">Available invoices</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-semibold text-blue-800 mb-1">Latest Invoice</h5>
                  <p className="text-2xl font-bold text-blue-900">
                    {invoices.length > 0 ? formatCurrency(invoices[0].amount_paid, invoices[0].currency) : '€0.00'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {invoices.length > 0 ? new Date(invoices[0].created * 1000).toLocaleDateString() : 'No invoices yet'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-semibold text-purple-800 mb-1">Status</h5>
                  <p className="text-lg font-bold text-purple-900">
                    {subscription.subscribed ? 'Active' : 'Inactive'}
                  </p>
                  <p className="text-xs text-purple-600">Subscription status</p>
                </div>
              </div>
            )}

            {/* Invoice List */}
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">No invoices found</p>
                <p className="text-sm">Your billing history will appear here once you have active subscriptions</p>
                {!subscription?.subscribed && (
                  <Button onClick={() => window.location.href = '/register'} className="mt-4">
                    Start Subscription
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h5 className="font-medium">Recent Invoices</h5>
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          {invoice.status.toUpperCase()}
                        </Badge>
                        <span className="font-semibold text-lg">Invoice #{invoice.number}</span>
                        {invoice.paid && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Date: {new Date(invoice.created * 1000).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span>Description: {invoice.description || 'Monthly Subscription'}</span>
                        </div>
                        {invoice.period_start && invoice.period_end && (
                          <div>
                            <span>Period: {new Date(invoice.period_start * 1000).toLocaleDateString()} - {new Date(invoice.period_end * 1000).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-xl">
                          {formatCurrency(invoice.amount_paid || invoice.total, invoice.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.currency.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        {invoice.invoice_pdf && (
                          <Button
                            onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        )}
                        <Button
                          onClick={() => downloadInvoice(invoice.id, invoice.number)}
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SubscriptionCard;