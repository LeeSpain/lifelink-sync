import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, User, Mail, Plus, Trash2, MessageSquare, PhoneCall, Bell, MessageCircle, Lock, ArrowRight } from 'lucide-react';

export interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notifyChannels: string[];
}

interface EmergencyContactsStepProps {
  contacts: EmergencyContact[];
  onChange: (contacts: EmergencyContact[]) => void;
  isTrial?: boolean;
  onGoToPlanStep?: () => void;
}

const CHANNEL_ICONS = [
  { id: 'app', icon: Bell },
  { id: 'sms', icon: MessageSquare },
  { id: 'email', icon: Mail },
  { id: 'call', icon: PhoneCall },
  { id: 'whatsapp', icon: MessageCircle },
];

const RELATIONSHIP_VALUES = ['spouse', 'parent', 'child', 'sibling', 'grandparent', 'friend', 'neighbor', 'caregiver', 'other'];

const EmergencyContactsStep: React.FC<EmergencyContactsStepProps> = ({ contacts, onChange, isTrial = false, onGoToPlanStep }) => {
  const { t } = useTranslation();
  const contactLimit = isTrial ? 1 : 5;
  const maxContacts = contactLimit;
  const atLimit = contacts.length >= contactLimit;

  const CHANNEL_OPTIONS = CHANNEL_ICONS.map(({ id, icon }) => ({
    id,
    icon,
    label: t(`registration.contacts.channels.${id}`),
  }));

  const RELATIONSHIPS = RELATIONSHIP_VALUES.map(value => ({
    value,
    label: t(`registration.contacts.relationships.${value}`),
  }));

  const updateContact = (index: number, field: keyof EmergencyContact, value: any) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleChannelToggle = (contactIndex: number, channelId: string, checked: boolean) => {
    const contact = contacts[contactIndex];
    const channels = contact.notifyChannels || ['app'];
    const updated = checked
      ? [...channels, channelId]
      : channels.filter(c => c !== channelId);
    // Always keep 'app' as minimum
    if (!updated.includes('app')) updated.unshift('app');
    updateContact(contactIndex, 'notifyChannels', updated);
  };

  const addContact = () => {
    if (contacts.length < maxContacts) {
      onChange([...contacts, { name: '', phone: '', email: '', relationship: '', notifyChannels: ['app'] }]);
    }
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      onChange(contacts.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Phone className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">{t('registration.contacts.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {isTrial
            ? t('emergencyContacts.trialLimit')
            : t('emergencyContacts.paidLimit', { max: maxContacts })
          }
        </p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div key={index} className="p-4 rounded-xl border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{t('registration.contacts.contactNumber', { number: index + 1 })}</h3>
              {contacts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('registration.contacts.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder={t('registration.contacts.namePlaceholder')}
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('registration.contacts.relationship')}</Label>
                <Select value={contact.relationship} onValueChange={(v) => updateContact(index, 'relationship', v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={t('registration.contacts.selectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('registration.contacts.phoneNumber')}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder="+34 600 123 456"
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('registration.contacts.email')} <span className="text-muted-foreground">({t('registration.contacts.optional')})</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    placeholder="contact@example.com"
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">{t('registration.contacts.howToReach')}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CHANNEL_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <div
                    key={id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      contact.notifyChannels?.includes(id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                    onClick={() => {
                      if (id === 'app') return; // app is always on
                      handleChannelToggle(index, id, !contact.notifyChannels?.includes(id));
                    }}
                  >
                    <Checkbox
                      checked={contact.notifyChannels?.includes(id)}
                      disabled={id === 'app'}
                      onCheckedChange={(checked) => {
                        if (id === 'app') return;
                        handleChannelToggle(index, id, checked as boolean);
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Contact Button */}
      {!atLimit ? (
        <Button
          type="button"
          variant="outline"
          onClick={addContact}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isTrial
            ? `${t('registration.contacts.addAnother', { count: contacts.length })} (${contacts.length}/${contactLimit})`
            : t('registration.contacts.addAnother', { count: contacts.length })
          }
        </Button>
      ) : isTrial ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {t('emergencyContacts.freeLimit', 'Free plan includes 1 emergency contact')}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {t('emergencyContacts.upgradeTo5', 'Upgrade to the Individual Plan (€9.99/mo) to add up to 5 contacts')}
              </p>
            </div>
          </div>
          {onGoToPlanStep && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onGoToPlanStep}
              className="w-full"
            >
              {t('emergencyContacts.upgradeNow', 'Upgrade now')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      ) : null}

      {/* Tip */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>{t('registration.contacts.tipLabel')}</strong> {t('registration.contacts.tipText')}
        </p>
      </div>
    </div>
  );
};

export default EmergencyContactsStep;
