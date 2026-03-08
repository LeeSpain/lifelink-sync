import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, Plus, Trash2 } from 'lucide-react';

export interface FamilyInvite {
  email: string;
  relationship: string;
}

interface InviteFamilyStepProps {
  invites: FamilyInvite[];
  onChange: (invites: FamilyInvite[]) => void;
}

const RELATIONSHIPS = [
  { value: 'spouse', label: 'Spouse / Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Son / Daughter' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
];

const InviteFamilyStep: React.FC<InviteFamilyStepProps> = ({ invites, onChange }) => {

  const updateInvite = (index: number, field: keyof FamilyInvite, value: string) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addInvite = () => {
    if (invites.length < 5) {
      onChange([...invites, { email: '', relationship: '' }]);
    }
  };

  const removeInvite = (index: number) => {
    onChange(invites.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">Invite Family Members</h2>
        <p className="text-sm text-muted-foreground">
          Invite loved ones to join your safety circle. They'll receive an email with a link to connect.
        </p>
      </div>

      {/* Skip option */}
      <div className="p-3 rounded-lg bg-muted/50 text-center">
        <p className="text-xs text-muted-foreground">
          This step is optional. You can always invite family members later from your dashboard.
        </p>
      </div>

      <div className="space-y-3">
        {invites.map((invite, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={invite.email}
                  onChange={(e) => updateInvite(index, 'email', e.target.value)}
                  placeholder="Family member's email"
                  className="pl-10 h-9 text-sm"
                />
              </div>
              <Select value={invite.relationship} onValueChange={(v) => updateInvite(index, 'relationship', v)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeInvite(index)}
              className="text-muted-foreground hover:text-destructive mt-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {invites.length < 5 && (
        <Button
          type="button"
          variant="outline"
          onClick={addInvite}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Family Member
        </Button>
      )}
    </div>
  );
};

export default InviteFamilyStep;
