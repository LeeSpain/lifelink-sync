import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Phone, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Users,
  Smartphone,
  PhoneCall,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEmergencyContacts, type EmergencyContact } from "@/hooks/useEmergencyContacts";

interface EnhancedEmergencyContactsSectionProps {
  profile: any;
  onProfileUpdate: () => void;
}

const EnhancedEmergencyContactsSection = ({ profile, onProfileUpdate }: EnhancedEmergencyContactsSectionProps) => {
  const { contacts, loading, refetch } = useEmergencyContacts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<EmergencyContact>({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    priority: 1
  });

  const relationships = [
    'Spouse/Partner',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Neighbor',
    'Doctor',
    'Other'
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      priority: contacts.length + 1
    });
    setEditingContact(null);
  };

  const openModal = (contact?: EmergencyContact) => {
    if (contact) {
      setFormData(contact);
      setEditingContact(contact);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Name and phone number are required.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingContact?.id) {
        // Update existing contact
        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            relationship: formData.relationship,
            priority: formData.priority
          })
          .eq('id', editingContact.id);

        if (error) throw error;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('emergency_contacts')
          .insert({
            user_id: user.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            relationship: formData.relationship,
            type: 'call_only',
            priority: formData.priority
          });

        if (error) throw error;
      }

      refetch();
      onProfileUpdate();
      setIsModalOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: `Emergency contact ${editingContact ? 'updated' : 'added'} successfully.`
      });
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contact.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      refetch();
      onProfileUpdate();
      toast({
        title: "Success",
        description: "Emergency contact removed successfully."
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: "Failed to remove emergency contact.",
        variant: "destructive"
      });
    }
  };

  const getContactTypeBadge = () => {
    return (
      <Badge variant="secondary" className="gap-1">
        <PhoneCall className="h-3 w-3" />
        Call Only
      </Badge>
    );
  };

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <Star className="h-4 w-4 text-yellow-500 fill-current" />;
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Emergency Contacts</CardTitle>
              <p className="text-sm text-muted-foreground">
                {contacts.length}/5 contacts • Sequential calling during SOS
              </p>
            </div>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openModal()}
                disabled={contacts.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contact name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Order</Label>
                  <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num === 1 ? `${num} (Primary)` : num.toString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Contact Type: Call Only</p>
                  <p className="text-xs text-muted-foreground">
                    Emergency contacts receive sequential calls during SOS activation. 
                    They cannot access your location or receive alerts.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : editingContact ? 'Update' : 'Add Contact'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-medium mb-2">No emergency contacts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add up to 5 emergency contacts for SOS calling
            </p>
            <Button variant="outline" onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Contact
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(contact.priority)}
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{contact.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Priority {contact.priority}
                      </Badge>
                      {getContactTypeBadge()}
                    </div>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    {contact.relationship && (
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to remove this contact?")) {
                        handleDelete(contact.id!);
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {contacts.length >= 5 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium text-orange-800">Maximum contacts reached</p>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              You can have up to 5 emergency contacts. Remove one to add another.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedEmergencyContactsSection;