import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, Calendar, MapPin, User, Shield, Activity } from 'lucide-react';

interface Customer {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string;
  created_at: string;
  profile_completion_percentage?: number;
  subscription?: {
    subscribed: boolean;
    subscription_tier?: string;
    subscription_end?: string;
  };
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CustomerDetailsModal({ customer, isOpen, onClose, onUpdate }: CustomerDetailsModalProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        country: customer.country || '',
        date_of_birth: customer.date_of_birth || '',
        emergency_contact_name: customer.emergency_contact_name || '',
        emergency_contact_phone: customer.emergency_contact_phone || '',
        medical_conditions: customer.medical_conditions || '',
      });
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;

    setLoading(true);
    try {
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        country: formData.country,
        date_of_birth: formData.date_of_birth || null,
        medical_conditions: formData.medical_conditions ? [formData.medical_conditions] : []
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', customer.user_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Customer Updated",
        description: "Customer information has been updated successfully.",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Details - {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={formData.medical_conditions || ''}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    placeholder="Any medical conditions or allergies..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.phone || 'No phone'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant={customer.subscription?.subscribed ? "default" : "secondary"}>
                    {customer.subscription?.subscribed ? "Active" : "Free"}
                  </Badge>
                  {customer.subscription?.subscription_tier && (
                    <Badge variant="outline">
                      {customer.subscription.subscription_tier}
                    </Badge>
                  )}
                </div>
                {customer.subscription?.subscription_end && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Expires: {new Date(customer.subscription.subscription_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined: {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Profile completion: {customer.profile_completion_percentage || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}