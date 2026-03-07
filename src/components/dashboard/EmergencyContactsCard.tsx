import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Phone, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  type: 'call_only' | 'family';
  priority: number;
}

interface EmergencyContactsCardProps {
  profile: any;
  onProfileUpdate: () => void;
}

const EmergencyContactsCard = ({ profile, onProfileUpdate }: EmergencyContactsCardProps) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEmergencyContacts();
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: contacts, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (error) throw error;

      // Cast to proper types since we know the data structure
      setContacts((contacts || []).map(contact => ({
        ...contact,
        type: contact.type as 'call_only' | 'family'
      })));
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency contacts.",
        variant: "destructive"
      });
    }
  };

  const addContact = async () => {
    if (contacts.length >= 5) {
      toast({
        title: "Maximum contacts reached",
        description: "You can only have up to 5 emergency contacts.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newContact = {
        user_id: user.id,
        name: "New Contact",
        phone: "",
        email: "",
        relationship: "",
        type: 'call_only' as const,
        priority: contacts.length + 1
      };

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([newContact])
        .select()
        .single();

      if (error) throw error;

      setContacts([...contacts, { ...data, type: data.type as 'call_only' | 'family' }]);
      setIsEditing(true);
      onProfileUpdate();

    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: "Failed to add emergency contact.",
        variant: "destructive"
      });
    }
  };

  const removeContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== contactId));
      onProfileUpdate();
      toast({
        title: "Success",
        description: "Emergency contact removed successfully."
      });

    } catch (error) {
      console.error('Error removing contact:', error);
      toast({
        title: "Error",
        description: "Failed to remove emergency contact.",
        variant: "destructive"
      });
    }
  };

  const updateContact = (contactId: string, field: keyof EmergencyContact, value: string | number) => {
    const newContacts = contacts.map((contact) => 
      contact.id === contactId ? { ...contact, [field]: value } : contact
    );
    setContacts(newContacts);
  };

  const saveContacts = async () => {
    try {
      for (const contact of contacts) {
        if (!contact.name || !contact.phone) {
          toast({
            title: "Validation Error",
            description: "All contacts must have a name and phone number.",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from('emergency_contacts')
          .update({
            name: contact.name,
            phone: contact.phone,
            email: contact.email || null,
            relationship: contact.relationship || null
          })
          .eq('id', contact.id);

        if (error) throw error;
      }

      setIsEditing(false);
      onProfileUpdate();
      toast({
        title: "Success",
        description: "Emergency contacts updated successfully."
      });

    } catch (error) {
      console.error('Error saving contacts:', error);
      toast({
        title: "Error",
        description: "Failed to save emergency contacts.",
        variant: "destructive"
      });
    }
  };

  const getContactTypeBadge = (type: string) => {
    return type === 'family' ? (
      <Badge variant="default" className="gap-1">
        <Smartphone className="h-3 w-3" />
        Family Access
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Phone className="h-3 w-3" />
        Call-only
      </Badge>
    );
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Emergency Contacts
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.length === 0 && !isEditing ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No emergency contacts added yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          ) : (
            <>
              {contacts.map((contact) => (
                <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{contact.name || 'New Contact'}</h4>
                          {getContactTypeBadge(contact.type)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(contact.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Name *"
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          required
                        />
                        <input
                          type="tel"
                          placeholder="Phone *"
                          value={contact.phone}
                          onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          required
                        />
                        <input
                          type="email"
                          placeholder="Email (optional)"
                          value={contact.email || ''}
                          onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Relationship"
                          value={contact.relationship || ''}
                          onChange={(e) => updateContact(contact.id, 'relationship', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        />
                      </div>
                      {contact.type === 'call_only' && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>Call-only Contact:</strong> Sequential dialing during SOS (no alerts, no login)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{contact.name}</p>
                          {getContactTypeBadge(contact.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.email && <p className="text-sm text-muted-foreground">{contact.email}</p>}
                      </div>
                      {contact.relationship && (
                        <Badge variant="outline">{contact.relationship}</Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <div className="flex gap-2">
                  {contacts.length < 5 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addContact}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={saveContacts}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyContactsCard;