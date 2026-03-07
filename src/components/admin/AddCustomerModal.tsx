import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Mail, Phone } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

interface NewCustomerData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  date_of_birth: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
}

export default function AddCustomerModal({ isOpen, onClose, onAdd }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<NewCustomerData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    date_of_birth: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData.email || !formData.password || !formData.first_name) {
      toast({
        title: "Validation Error",
        description: "Email, password, and first name are required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // Update profile with additional information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          country: formData.country,
          date_of_birth: formData.date_of_birth || null,
          medical_conditions: formData.medical_conditions ? [formData.medical_conditions] : [],
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.warn('Profile update error:', profileError);
      }

      toast({
        title: "Customer Added",
        description: "New customer has been added successfully.",
      });

      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        country: '',
        date_of_birth: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_conditions: '',
      });

      onAdd();
      onClose();
    } catch (error: any) {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add customer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Customer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
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
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Any medical conditions or allergies..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Adding..." : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}