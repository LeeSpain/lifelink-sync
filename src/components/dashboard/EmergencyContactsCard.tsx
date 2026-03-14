import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Phone, Smartphone, Shield, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useContactLimit } from "@/hooks/useContactLimit";

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
  const { t } = useTranslation();
  const { maxContacts, canAddMore, isTrial, remaining, refetchCount } = useContactLimit();

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
        title: t('emergencyContactsCard.errorTitle'),
        description: t('emergencyContactsCard.loadError'),
        variant: "destructive"
      });
    }
  };

  const addContact = async () => {
    if (!canAddMore) {
      toast({
        title: t('emergencyContacts.limitReached', { max: maxContacts }),
        description: isTrial ? t('emergencyContacts.upgradeDesc') : t('emergencyContacts.limitReached', { max: maxContacts }),
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newContact = {
        user_id: user.id,
        name: t('emergencyContactsCard.newContact'),
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
      refetchCount();
      onProfileUpdate();

    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: t('emergencyContactsCard.errorTitle'),
        description: t('emergencyContactsCard.addError'),
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
      refetchCount();
      onProfileUpdate();
      toast({
        title: t('emergencyContactsCard.removeSuccessTitle'),
        description: t('emergencyContactsCard.removeSuccessDescription')
      });

    } catch (error) {
      console.error('Error removing contact:', error);
      toast({
        title: t('emergencyContactsCard.errorTitle'),
        description: t('emergencyContactsCard.removeError'),
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
            title: t('emergencyContactsCard.validationTitle'),
            description: t('emergencyContactsCard.validationDescription'),
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
        title: t('emergencyContactsCard.saveSuccessTitle'),
        description: t('emergencyContactsCard.saveSuccessDescription')
      });

    } catch (error) {
      console.error('Error saving contacts:', error);
      toast({
        title: t('emergencyContactsCard.errorTitle'),
        description: t('emergencyContactsCard.saveError'),
        variant: "destructive"
      });
    }
  };

  const getContactTypeBadge = (type: string) => {
    return type === 'family' ? (
      <Badge variant="default" className="gap-1">
        <Smartphone className="h-3 w-3" />
        {t('emergencyContactsCard.familyAccess')}
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Phone className="h-3 w-3" />
        {t('emergencyContactsCard.callOnly')}
      </Badge>
    );
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            {t('emergencyContactsCard.title')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? t('emergencyContactsCard.save') : t('emergencyContactsCard.edit')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.length === 0 && !isEditing ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>{t('emergencyContactsCard.noContactsYet')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('emergencyContactsCard.addContact')}
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
                          <h4 className="font-medium">{contact.name || t('emergencyContactsCard.newContact')}</h4>
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
                          placeholder={t('emergencyContactsCard.namePlaceholder')}
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          required
                        />
                        <input
                          type="tel"
                          placeholder={t('emergencyContactsCard.phonePlaceholder')}
                          value={contact.phone}
                          onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                          required
                        />
                        <input
                          type="email"
                          placeholder={t('emergencyContactsCard.emailPlaceholder')}
                          value={contact.email || ''}
                          onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        />
                        <input
                          type="text"
                          placeholder={t('emergencyContactsCard.relationshipPlaceholder')}
                          value={contact.relationship || ''}
                          onChange={(e) => updateContact(contact.id, 'relationship', e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        />
                      </div>
                      {contact.type === 'call_only' && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                          <strong>{t('emergencyContactsCard.callOnly')}:</strong> {t('emergencyContactsCard.callOnlyDescription')}
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
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {canAddMore ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addContact}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('emergencyContacts.addButton')}
                      </Button>
                    ) : isTrial ? (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Lock className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs font-medium">
                          {t('emergencyContacts.freeLimit', '1 contact on free plan')}
                        </span>
                        <a
                          href="/pricing"
                          className="text-xs font-semibold text-amber-800 hover:underline ml-1"
                        >
                          {t('emergencyContacts.upgradeButton', 'Upgrade')}
                        </a>
                      </div>
                    ) : null}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={saveContacts}
                    >
                      {t('emergencyContactsCard.saveChanges')}
                    </Button>
                  </div>
                  {isTrial && contacts.length >= 1 && canAddMore && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t('emergencyContacts.upgradeTitle')}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{t('emergencyContacts.upgradeDesc')}</p>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-shrink-0 rounded-full"
                        onClick={() => window.location.href = '/pricing'}
                      >
                        {t('emergencyContacts.upgradeButton')}
                      </Button>
                    </div>
                  )}
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