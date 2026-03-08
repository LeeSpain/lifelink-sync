import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, User, Mail, Plus, Trash2, MessageSquare, PhoneCall, Bell, MessageCircle } from 'lucide-react';

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
}

const CHANNEL_OPTIONS = [
  { id: 'app', label: 'App Notification', icon: Bell, description: 'In-app push notification' },
  { id: 'sms', label: 'SMS / Text', icon: MessageSquare, description: 'Text message alert' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Email notification' },
  { id: 'call', label: 'Phone Call', icon: PhoneCall, description: 'Automated phone call' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'WhatsApp message' },
];

const RELATIONSHIPS = [
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Son / Daughter' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbor', label: 'Neighbour' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
];

const EmergencyContactsStep: React.FC<EmergencyContactsStepProps> = ({ contacts, onChange }) => {

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
    if (contacts.length < 5) {
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
        <h2 className="text-2xl font-poppins font-bold text-foreground">Emergency Contacts</h2>
        <p className="text-sm text-muted-foreground">
          Add people who should be notified during an emergency. Choose how each contact is reached.
        </p>
      </div>

      <div className="space-y-4">
        {contacts.map((contact, index) => (
          <div key={index} className="p-4 rounded-xl border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Contact {index + 1}</h3>
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
                <Label className="text-xs">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder="Contact name"
                    className="pl-10 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Relationship */}
              <div className="space-y-1.5">
                <Label className="text-xs">Relationship</Label>
                <Select value={contact.relationship} onValueChange={(v) => updateContact(index, 'relationship', v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select..." />
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
                <Label className="text-xs">Phone Number</Label>
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
                <Label className="text-xs">Email <span className="text-muted-foreground">(optional)</span></Label>
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
              <Label className="text-xs font-semibold">How should we reach this contact?</Label>
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
      {contacts.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={addContact}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Contact ({contacts.length}/5)
        </Button>
      )}

      {/* Tip */}
      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Add at least 2-3 contacts for the best coverage. Choose people who live nearby and are usually available. Multiple notification channels increase the chance someone responds quickly.
        </p>
      </div>
    </div>
  );
};

export default EmergencyContactsStep;
