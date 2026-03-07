import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User, Shield, Activity, Save, Loader2, Heart, Users, TrendingUp, Trash2, Plus, Edit2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityTimeline } from '@/components/admin/ActivityTimeline';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';
import { CustomerProductsTab } from '@/components/admin/CustomerProductsTab';
import { CustomerServicesTab } from '@/components/admin/CustomerServicesTab';
import { AccountStatusControl } from '@/components/admin/AccountStatusControl';
import { RoleManagementControl } from '@/components/admin/RoleManagementControl';
import { EmailManagementControl } from '@/components/admin/EmailManagementControl';
import { AuditLogTab } from '@/components/admin/AuditLogTab';
import { EditableHealthProfile } from '@/components/admin/EditableHealthProfile';
import { RegionalSettingsControl } from '@/components/admin/RegionalSettingsControl';
import { StripeManagementControl } from '@/components/admin/StripeManagementControl';
import { BulkActionsControl } from '@/components/admin/BulkActionsControl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import { useSubscriptionManagement } from '@/hooks/useSubscriptionManagement';
import { useEmergencyContactManagement } from '@/hooks/useEmergencyContactManagement';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const CustomerProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customer, isLoading } = useCustomerProfile(userId);
  const { manageSubscription, isManaging } = useSubscriptionManagement();
  const emergencyContactMgmt = useEmergencyContactManagement(userId || '');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  
  // Subscription management state
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState<'extend' | 'upgrade' | 'downgrade' | 'cancel' | 'activate' | null>(null);
  const [subscriptionFormData, setSubscriptionFormData] = useState({ tier: '', days: '', reason: '' });
  
  // Emergency contact state
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactFormData, setContactFormData] = useState({ name: '', phone: '', email: '', relationship: '', priority: 1, type: 'standard' });
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/admin-dashboard/customers');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      phone: customer?.phone || '',
      country: customer?.country || '',
      address: customer?.address || '',
      date_of_birth: customer?.date_of_birth || '',
      language_preference: customer?.language_preference || 'en'
    });
  };

  const handleSave = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editedData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Customer profile updated successfully'
      });

      // Refetch the customer data
      queryClient.invalidateQueries({ queryKey: ['customer-profile', userId] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  // Subscription management handlers
  const handleSubscriptionAction = (action: 'extend' | 'upgrade' | 'downgrade' | 'cancel' | 'activate') => {
    setSubscriptionAction(action);
    setSubscriptionFormData({ tier: '', days: '', reason: '' });
    setShowSubscriptionDialog(true);
  };

  const handleSubscriptionSubmit = () => {
    if (!userId || !subscriptionAction) return;

    const params: any = {
      userId,
      action: subscriptionAction,
      reason: subscriptionFormData.reason || undefined
    };

    if (subscriptionAction === 'extend' && subscriptionFormData.days) {
      params.extensionDays = parseInt(subscriptionFormData.days);
    }

    if ((subscriptionAction === 'upgrade' || subscriptionAction === 'downgrade') && subscriptionFormData.tier) {
      params.newTier = subscriptionFormData.tier;
    }

    manageSubscription(params);
    setShowSubscriptionDialog(false);
  };

  // Emergency contact handlers
  const handleAddContact = () => {
    setEditingContact(null);
    setContactFormData({ name: '', phone: '', email: '', relationship: '', priority: 1, type: 'standard' });
    setShowContactDialog(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setContactFormData({
      name: contact.name,
      phone: contact.phone,
      email: contact.email || '',
      relationship: contact.relationship || '',
      priority: contact.priority,
      type: contact.type
    });
    setShowContactDialog(true);
  };

  const handleContactSubmit = () => {
    if (editingContact) {
      emergencyContactMgmt.updateContact({
        id: editingContact.id,
        data: contactFormData
      });
    } else {
      emergencyContactMgmt.createContact(contactFormData);
    }
    setShowContactDialog(false);
  };

  const handleDeleteContact = (id: string) => {
    setDeleteContactId(id);
  };

  const confirmDeleteContact = () => {
    if (deleteContactId) {
      emergencyContactMgmt.deleteContact(deleteContactId);
      setDeleteContactId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button onClick={handleBack} variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Customer not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unnamed Customer';
  const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`.toUpperCase() || 'UC';
  const subscriptionStatus = customer.subscriber?.subscribed ? 'Active' : 'Inactive';
  const subscriptionTier = customer.subscriber?.subscription_tier || 'Free';
  const profileCompletion = customer.profile_completion_percentage || 0;

  // Calculate days remaining for subscription
  const daysRemaining = customer.subscriber?.subscription_end 
    ? Math.ceil((new Date(customer.subscriber.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
            <p className="text-muted-foreground">Customer ID: {customer.user_id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={subscriptionStatus === 'Active' ? 'default' : 'secondary'}>
            {subscriptionStatus}
          </Badge>
          {!isEditing ? (
            <Button onClick={handleEdit}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline" disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{fullName}</h3>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
              </div>
              <Separator />
              <div className="space-y-2 text-left">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.country}</span>
                  </div>
                )}
                {customer.created_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Profile Completion</span>
                  <span className="font-semibold">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subscription</span>
                  <Badge variant="outline">{subscriptionTier}</Badge>
                </div>
                {customer.subscriber?.subscription_end && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Days Remaining</span>
                    <span className="font-semibold">{daysRemaining}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Emergency Contacts</span>
                  <span className="font-semibold">{customer.emergency_contacts?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-semibold">{customer.connections?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <QuickActionsPanel 
            customerId={customer.user_id}
            customerEmail={customer.email}
          />

          {/* Account Management */}
          <AccountStatusControl
            userId={customer.user_id}
            currentRole={customer.role || 'user'}
            isActive={true}
          />

          <RoleManagementControl
            userId={customer.user_id}
            currentRole={customer.role || 'user'}
            customerEmail={customer.email}
          />

          <EmailManagementControl
            userId={customer.user_id}
            currentEmail={customer.email}
          />

          <RegionalSettingsControl
            userId={customer.user_id}
            locationSharingEnabled={customer.location_sharing_enabled || false}
            subscriptionRegional={customer.subscription_regional || false}
            hasSpainCallCenter={customer.has_spain_call_center || false}
            country={customer.country}
            countryCode={customer.country_code}
          />

          <StripeManagementControl
            stripeCustomerId={customer.subscriber?.stripe_customer_id}
            userId={customer.user_id}
          />

          <BulkActionsControl
            userId={customer.user_id}
            customerName={fullName}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="overview" className="space-y-4">
            <div className="overflow-x-auto pb-2">
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 w-full min-w-max gap-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="subscription" className="text-xs sm:text-sm">Subscription</TabsTrigger>
                <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
                <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
                <TabsTrigger value="health" className="text-xs sm:text-sm">Health</TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs sm:text-sm">Contacts</TabsTrigger>
                <TabsTrigger value="connections" className="text-xs sm:text-sm">Network</TabsTrigger>
                <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
                <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit Log</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Summary</CardTitle>
                  <CardDescription>Key information and metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Profile Completion</p>
                      <p className="text-2xl font-bold">{profileCompletion}%</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Subscription</p>
                      <p className="text-2xl font-bold">{subscriptionTier}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Emergency Network</p>
                      <p className="text-2xl font-bold">{(customer.emergency_contacts?.length || 0) + (customer.connections?.length || 0)}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <p className="text-2xl font-bold">{customer.role || 'User'}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Account Information */}
                  <div>
                    <h3 className="font-semibold mb-4">Account Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">{new Date(customer.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">{new Date(customer.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location Sharing</p>
                        <Badge variant={customer.location_sharing_enabled ? 'default' : 'secondary'}>
                          {customer.location_sharing_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Regional Subscription</p>
                        <Badge variant={customer.subscription_regional ? 'default' : 'secondary'}>
                          {customer.subscription_regional ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Edit customer personal details' : 'View customer personal details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      {isEditing ? (
                        <Input
                          id="first_name"
                          value={editedData.first_name}
                          onChange={(e) => setEditedData({ ...editedData, first_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.first_name || '-'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      {isEditing ? (
                        <Input
                          id="last_name"
                          value={editedData.last_name}
                          onChange={(e) => setEditedData({ ...editedData, last_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.last_name || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editedData.phone}
                          onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.phone || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <p className="text-sm p-2 bg-muted rounded">{customer.email || '-'}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
                      {isEditing ? (
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={editedData.date_of_birth}
                          onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">
                          {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString() : '-'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      {isEditing ? (
                        <Input
                          id="country"
                          value={editedData.country}
                          onChange={(e) => setEditedData({ ...editedData, country: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.country || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={editedData.address}
                          onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.address || '-'}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      {isEditing ? (
                        <Input
                          id="language"
                          value={editedData.language_preference}
                          onChange={(e) => setEditedData({ ...editedData, language_preference: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm p-2 bg-muted rounded">{customer.language_preference || 'en'}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4">Regional Settings</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Country Code</p>
                        <p className="font-medium">{customer.country_code || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spain Call Center</p>
                        <Badge variant={customer.has_spain_call_center ? 'default' : 'secondary'}>
                          {customer.has_spain_call_center ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Details</CardTitle>
                  <CardDescription>Current subscription information and history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {customer.subscriber ? (
                    <>
                      <div className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-lg">Current Subscription</h3>
                          <Badge variant={customer.subscriber.subscribed ? 'default' : 'secondary'} className="text-sm">
                            {customer.subscriber.subscribed ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Tier</p>
                            <p className="font-medium">{customer.subscriber.subscription_tier || 'Free'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className="font-medium">{customer.subscriber.subscribed ? 'Active' : 'Inactive'}</p>
                          </div>
                          {customer.subscriber.subscription_end && (
                            <div>
                              <p className="text-sm text-muted-foreground">End Date</p>
                              <p className="font-medium">{new Date(customer.subscriber.subscription_end).toLocaleDateString()}</p>
                            </div>
                          )}
                          {customer.subscriber.stripe_customer_id && (
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Stripe Customer ID</p>
                              <p className="font-mono text-sm">{customer.subscriber.stripe_customer_id}</p>
                            </div>
                          )}
                        </div>

                        {customer.subscriber.subscription_end && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Subscription Progress</span>
                              <span className="font-semibold">{daysRemaining} days remaining</span>
                            </div>
                            <Progress 
                              value={Math.max(0, Math.min(100, (daysRemaining / 365) * 100))} 
                            />
                          </div>
                        )}
                        
                        {/* Subscription Actions */}
                        <Separator className="my-4" />
                        <div>
                          <h4 className="font-semibold mb-3">Subscription Actions</h4>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleSubscriptionAction('extend')}>
                              <Clock className="h-4 w-4 mr-1" />
                              Extend
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSubscriptionAction('upgrade')}>
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Upgrade
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleSubscriptionAction('downgrade')}>
                              Downgrade
                            </Button>
                            {customer.subscriber.subscribed ? (
                              <Button size="sm" variant="destructive" onClick={() => handleSubscriptionAction('cancel')}>
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            ) : (
                              <Button size="sm" variant="default" onClick={() => handleSubscriptionAction('activate')}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No subscription information available</p>
                      <Button className="mt-4" onClick={() => handleSubscriptionAction('activate')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate Subscription
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Health Profile Tab */}
            <TabsContent value="health" className="space-y-4">
              <EditableHealthProfile
                userId={customer.user_id}
                healthData={{
                  blood_type: customer.blood_type,
                  allergies: customer.allergies,
                  medications: customer.medications,
                  medical_conditions: customer.medical_conditions,
                }}
              />
            </TabsContent>

            {/* Emergency Contacts Tab */}
            <TabsContent value="contacts" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Emergency Contacts</CardTitle>
                      <CardDescription>Manage emergency contact list</CardDescription>
                    </div>
                    <Button onClick={handleAddContact}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {customer?.emergency_contacts && customer.emergency_contacts.length > 0 ? (
                    <div className="space-y-3">
                      {customer.emergency_contacts.map((contact) => (
                        <div key={contact.id} className="p-4 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{contact.name}</h4>
                                <Badge variant="outline">Priority {contact.priority}</Badge>
                                <Badge>{contact.type}</Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  <span>{contact.phone}</span>
                                </div>
                                {contact.email && (
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    <span>{contact.email}</span>
                                  </div>
                                )}
                                {contact.relationship && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    <span>{contact.relationship}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleEditContact(contact)}>
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteContact(contact.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No emergency contacts added yet</p>
                      <Button className="mt-4" onClick={handleAddContact}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Contact
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Network Tab */}
            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connections Network</CardTitle>
                  <CardDescription>Family circle and trusted contacts</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer?.connections && customer.connections.length > 0 ? (
                    <div className="space-y-4">
                      {customer.connections.map((connection) => (
                        <div key={connection.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{connection.invite_email || 'Unnamed'}</h4>
                                <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
                                  {connection.status}
                                </Badge>
                                <Badge variant="outline">{connection.type}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {connection.relationship && <p>Relationship: {connection.relationship}</p>}
                                {connection.escalation_priority && <p>Priority: {connection.escalation_priority}</p>}
                                {connection.invited_at && <p>Invited: {new Date(connection.invited_at).toLocaleDateString()}</p>}
                                {connection.accepted_at && <p>Accepted: {new Date(connection.accepted_at).toLocaleDateString()}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No connections in network</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <CustomerProductsTab userId={customer.user_id} />
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services">
              <CustomerServicesTab userId={customer.user_id} />
            </TabsContent>

            {/* Activity Timeline Tab */}
            <TabsContent value="activity">
              <ActivityTimeline customerId={customer.user_id} />
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit">
              <AuditLogTab userId={customer.user_id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Subscription Management Dialog */}
      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {subscriptionAction === 'extend' && 'Extend Subscription'}
              {subscriptionAction === 'upgrade' && 'Upgrade Subscription'}
              {subscriptionAction === 'downgrade' && 'Downgrade Subscription'}
              {subscriptionAction === 'cancel' && 'Cancel Subscription'}
              {subscriptionAction === 'activate' && 'Activate Subscription'}
            </DialogTitle>
            <DialogDescription>
              Make changes to customer subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {subscriptionAction === 'extend' && (
              <div className="space-y-2">
                <Label>Extension Days</Label>
                <Input
                  type="number"
                  placeholder="30"
                  value={subscriptionFormData.days}
                  onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, days: e.target.value })}
                />
              </div>
            )}
            {(subscriptionAction === 'upgrade' || subscriptionAction === 'downgrade') && (
              <div className="space-y-2">
                <Label>New Tier</Label>
                <Select value={subscriptionFormData.tier} onValueChange={(value) => setSubscriptionFormData({ ...subscriptionFormData, tier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="Premium Protection">Premium Protection</SelectItem>
                    <SelectItem value="Call Centre">Call Centre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Enter reason for this change..."
                value={subscriptionFormData.reason}
                onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>Cancel</Button>
            <Button onClick={handleSubscriptionSubmit} disabled={isManaging}>
              {isManaging ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit' : 'Add'} Emergency Contact</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update' : 'Create'} emergency contact information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={contactFormData.name}
                onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={contactFormData.phone}
                onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={contactFormData.email}
                onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input
                value={contactFormData.relationship}
                onChange={(e) => setContactFormData({ ...contactFormData, relationship: e.target.value })}
                placeholder="e.g., Father, Friend"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority *</Label>
                <Select value={contactFormData.priority.toString()} onValueChange={(value) => setContactFormData({ ...contactFormData, priority: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Highest)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 (Lowest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={contactFormData.type} onValueChange={(value) => setContactFormData({ ...contactFormData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="trusted">Trusted</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleContactSubmit}
              disabled={!contactFormData.name || !contactFormData.phone || emergencyContactMgmt.isCreating || emergencyContactMgmt.isUpdating}
            >
              {(emergencyContactMgmt.isCreating || emergencyContactMgmt.isUpdating) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingContact ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation */}
      <AlertDialog open={!!deleteContactId} onOpenChange={() => setDeleteContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Emergency Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this emergency contact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteContact} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerProfilePage;
