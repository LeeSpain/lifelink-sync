import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        title: t('subscriptionCard.errorTitle'),
        description: t('subscriptionCard.loadBillingError'),
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
        title: t('subscriptionCard.successTitle'),
        description: t('subscriptionCard.invoiceDownloaded', { number: invoiceNumber })
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: t('subscriptionCard.errorTitle'),
        description: t('subscriptionCard.downloadError'),
        variant: "destructive"
      });
    }
  };

  const sendFamilyInvite = async () => {
    try {
      if (!inviteForm.email || !inviteForm.name) {
        toast({
          title: t('subscriptionCard.errorTitle'),
          description: t('subscriptionCard.fillRequired'),
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('family-invites', {
        body: inviteForm
      });
      if (error) throw error;

      toast({
        title: t('subscriptionCard.successTitle'),
        description: data.message
      });

      setInviteForm({ email: '', name: '', relationship: '' });
      setShowInviteForm(false);
      loadFamilyMembers();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: t('subscriptionCard.errorTitle'),
        description: t('subscriptionCard.inviteError'),
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
        title: t('subscriptionCard.errorTitle'),
        description: t('subscriptionCard.portalError'),
        variant: "destructive"
      });
    }
  };

  const getSubscriptionStatus = () => {
    if (subscription?.is_trialing) {
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
      const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
      return {
        status: t('subscriptionCard.trialDaysLeft', { count: daysLeft }),
        color: "bg-muted text-foreground",
        icon: <CheckCircle className="h-4 w-4" />,
        description: t('subscriptionCard.protectionActive')
      };
    }
    if (subscription?.subscribed) {
      return {
        status: t('subscriptionCard.statusActive'),
        color: "bg-muted text-foreground",
        icon: <CheckCircle className="h-4 w-4" />,
        description: t('subscriptionCard.protectionActive')
      };
    }
    return {
      status: t('subscriptionCard.statusInactive'),
      color: "bg-muted text-foreground",
      icon: <AlertCircle className="h-4 w-4" />,
      description: t('subscriptionCard.statusInactive')
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
      pending: 'bg-muted text-foreground',
      accepted: 'bg-muted text-foreground',
      declined: 'bg-muted text-foreground',
      expired: 'bg-muted text-foreground'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-muted text-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {t('subscriptionCard.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{t('subscriptionCard.overview')}</TabsTrigger>
            <TabsTrigger value="billing">{t('subscriptionCard.billingInvoices')}</TabsTrigger>
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
                {/* Trial Banner */}
                {subscription?.is_trialing && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{t('subscriptionCard.freeTrialActive')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('subscriptionCard.trialEnds', {
                            date: subscription.trial_end
                              ? new Date(subscription.trial_end).toLocaleDateString()
                              : t('subscriptionCard.trialEndsSoon')
                          })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        {t('subscriptionCard.subscribeNow')}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Active Add-ons */}
                {subscription?.active_addons && subscription.active_addons.length > 0 && (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">{t('subscriptionCard.activeAddOns')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {subscription.active_addons.map((slug: string) => (
                        <Badge key={slug} variant="secondary" className="capitalize">
                          {slug.replace('_', ' ')}
                        </Badge>
                      ))}
                      {subscription.clara_complete_unlocked && (
                        <Badge className="bg-primary text-primary-foreground">
                          CLARA Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-1">{t('subscriptionCard.currentPlan')}</h4>
                    <p className="text-lg font-bold text-foreground capitalize">
                      {subscription.subscription_tier?.replace('_', ' ') || t('subscriptionCard.basic')}
                    </p>
                    {subscription.subscription_tier?.toLowerCase().includes('annual') ? (
                      <Badge className="bg-green-100 text-green-700 text-xs mt-1">{t('subscriptionCard.billedAnnually', { defaultValue: 'Billed annually' })}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('subscriptionCard.billedMonthly', { defaultValue: 'Billed monthly' })}</span>
                    )}
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-1">{t('subscriptionCard.nextBilling')}</h4>
                    <p className="text-lg font-bold text-foreground">
                      {subscription.subscription_end
                        ? new Date(subscription.subscription_end).toLocaleDateString()
                        : t('subscriptionCard.unknown')
                      }
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-1">{t('subscriptionCard.paymentStatus')}</h4>
                    <p className="text-lg font-bold text-foreground">{t('subscriptionCard.statusActive')}</p>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{t('subscriptionCard.paymentSummary')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('subscriptionCard.currentStatus')}</span>
                      <span className="ml-2 font-semibold text-foreground">
                        {subscription.subscribed ? t('subscriptionCard.statusActive') : t('subscriptionCard.statusInactive')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('subscriptionCard.subscriptionEnd')}</span>
                      <span className="ml-2 font-semibold">
                        {subscription.subscription_end
                          ? new Date(subscription.subscription_end).toLocaleDateString()
                          : t('subscriptionCard.notAvailable')
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('subscriptionCard.planType')}</span>
                      <span className="ml-2 font-semibold capitalize">
                        {subscription.subscription_tier?.replace('_', ' ') || t('subscriptionCard.basic')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('subscriptionCard.billing')}</span>
                      <span className="ml-2 font-semibold">
                        {subscription.subscription_end ? t('subscriptionCard.autoRenewal') : t('subscriptionCard.manageViaStripe')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t('subscriptionCard.availableFeatures')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{t('subscriptionCard.emergencySosButton')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{t('subscriptionCard.emergencyContactMgmt')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{t('subscriptionCard.profileMedicalInfo')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{t('subscriptionCard.dashboardAccess')}</span>
                    </div>
                    {subscription.subscription_tier?.includes('spain') && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{t('subscriptionCard.spanishCallCenter')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{t('subscriptionCard.localEmergencyResponse')}</span>
                        </div>
                      </>
                    )}
                    {(subscription.subscription_tier?.includes('premium') || subscription.subscription_tier?.includes('family')) && (
                      <>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{t('subscriptionCard.familyConnectionFeatures')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{t('subscriptionCard.enhancedProtection')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">{t('subscriptionCard.quickActions')}</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleManageSubscription} variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      {t('subscriptionCard.manageSubscription')}
                    </Button>
                    <Button onClick={loadInvoices} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('subscriptionCard.downloadLatestInvoice')}
                    </Button>
                    <Button variant="outline" size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t('subscriptionCard.updatePaymentMethod')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">
                  {t('subscriptionCard.noSubscription')}
                </p>
                <Button onClick={() => window.location.href = '/register'}>
                  {t('subscriptionCard.completeSubscriptionBtn')}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Enhanced Billing & Invoices Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-semibold text-sm">{t('subscriptionCard.billingHistoryTitle')}</h4>
              <Button onClick={loadInvoices} variant="outline" size="sm" disabled={isLoadingInvoices} className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                {isLoadingInvoices ? t('subscriptionCard.loading') : t('subscriptionCard.refresh')}
              </Button>
            </div>

            {/* Billing Summary */}
            {subscription?.subscribed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h5 className="font-semibold text-foreground mb-1">{t('subscriptionCard.totalInvoices')}</h5>
                  <p className="text-lg font-bold text-foreground">{invoices.length}</p>
                  <p className="text-xs text-muted-foreground">{t('subscriptionCard.availableInvoices')}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h5 className="font-semibold text-foreground mb-1">{t('subscriptionCard.latestInvoice')}</h5>
                  <p className="text-lg font-bold text-foreground">
                    {invoices.length > 0 ? formatCurrency(invoices[0].amount_paid, invoices[0].currency) : '€0.00'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {invoices.length > 0 ? new Date(invoices[0].created * 1000).toLocaleDateString() : t('subscriptionCard.noInvoicesYet')}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <h5 className="font-semibold text-foreground mb-1">{t('subscriptionCard.status')}</h5>
                  <p className="text-lg font-bold text-foreground">
                    {subscription.subscribed ? t('subscriptionCard.statusActive') : t('subscriptionCard.statusInactive')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('subscriptionCard.subscriptionStatus')}</p>
                </div>
              </div>
            )}

            {/* Invoice List */}
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium mb-2">{t('subscriptionCard.noInvoicesYet')}</p>
                <p className="text-sm">{t('subscriptionCard.billingHistoryAppear')}</p>
                {!subscription?.subscribed && (
                  <Button onClick={() => window.location.href = '/register'} className="mt-4">
                    {t('subscriptionCard.startSubscription')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h5 className="font-medium">{t('subscriptionCard.recentInvoices')}</h5>
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">
                        {invoice.status.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-base sm:text-lg">{t('subscriptionCard.invoice', { number: invoice.number })}</span>
                      {invoice.paid && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      <span className="font-bold text-lg sm:text-xl ml-auto">
                        {formatCurrency(invoice.amount_paid || invoice.total, invoice.currency)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{new Date(invoice.created * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="truncate">
                        {invoice.description || t('subscriptionCard.monthlySubscription')}
                      </div>
                      {invoice.period_start && invoice.period_end && (
                        <div className="text-xs">
                          {new Date(invoice.period_start * 1000).toLocaleDateString()} - {new Date(invoice.period_end * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {invoice.invoice_pdf && (
                        <Button
                          onClick={() => window.open(invoice.invoice_pdf, '_blank')}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t('subscriptionCard.pdf')}
                        </Button>
                      )}
                      <Button
                        onClick={() => downloadInvoice(invoice.id, invoice.number)}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t('subscriptionCard.details')}
                      </Button>
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