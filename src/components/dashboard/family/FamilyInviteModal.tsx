import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Plus, Shield, MapPin, Smartphone } from "lucide-react";

interface FamilyInviteModalProps {
  onInviteCreated: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FamilyInviteModal = ({ onInviteCreated, isOpen, onOpenChange }: FamilyInviteModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
    billing_type: "owner" as "owner" | "self"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.relationship) {
        throw new Error(t('familyDashboard.allFieldsRequired'));
      }

      if (formData.billing_type === 'owner') {
        // For "You Pay" - redirect to Stripe checkout
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('family-subscription-checkout', {
          body: {
            email: formData.email,
            billing_type: 'owner',
            invite_data: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              relationship: formData.relationship
            }
          }
        });

        if (checkoutError) throw checkoutError;
        if (checkoutData.error) throw new Error(checkoutData.error);

        // Create emergency contact immediately for owner-paid
        if (currentUser?.id) {
          await supabase.from('emergency_contacts').insert({
            user_id: currentUser.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            type: 'family',
            relationship: formData.relationship,
            priority: 1
          });
        }

        toast({
          title: t('familyDashboard.redirectingToPayment'),
          description: t('familyDashboard.redirectingToPaymentDesc', { name: formData.name })
        });

        // Redirect to Stripe
        window.open(checkoutData.url, '_blank');
        
        // Reset form and close modal
        setFormData({
          name: "",
          email: "",
          phone: "",
          relationship: "",
          billing_type: "owner"
        });
        onInviteCreated();
        onOpenChange(false);

      } else {
        // For "They Pay" - send invite email
        const { data, error } = await supabase.functions.invoke('family-invite-management', {
          body: {
            action: 'create',
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            relationship: formData.relationship,
            billing_type: formData.billing_type
          }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Create emergency contact immediately with pending status
        if (currentUser?.id) {
          await supabase.from('emergency_contacts').insert({
            user_id: currentUser.id,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            type: 'family',
            relationship: formData.relationship,
            priority: 1
          });
        }

        toast({
          title: t('familyDashboard.inviteSent'),
          description: t('familyDashboard.inviteSentDesc', { name: formData.name })
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          relationship: "",
          billing_type: "owner"
        });

        onInviteCreated();
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('family-invite-updated'));
        
        onOpenChange(false);
      }

    } catch (error) {
      console.error('Error creating family invite:', error);
      toast({
        title: t('familyDashboard.error'),
        description: error instanceof Error ? error.message : t('familyDashboard.failedProcessInvite'),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background border-b pb-4 mb-4">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            {t('familyDashboard.inviteFamilyMember')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-1">
          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-3 text-foreground">{t('familyDashboard.familyBenefits')}</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{t('familyDashboard.locationOnlyDuringSos')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t('familyDashboard.noTelemetryShared')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>{t('familyDashboard.liveAlertMapAccess')}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t('familyDashboard.nameRequired')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('familyDashboard.enterFamilyMemberName')}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">{t('familyDashboard.emailRequired')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('familyDashboard.enterEmailAddress')}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">{t('familyDashboard.phoneRequired')}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('familyDashboard.enterPhoneNumberField')}
                required
              />
            </div>

            <div>
              <Label htmlFor="relationship">{t('familyDashboard.relationshipRequired')}</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder={t('familyDashboard.relationshipPlaceholder')}
                required
              />
            </div>

            <div>
              <Label className="text-base font-medium">{t('familyDashboard.whoPays')}</Label>
              <RadioGroup
                value={formData.billing_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, billing_type: value as "owner" | "self" }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>{t('familyDashboard.youPayOwner')}</span>
                      <Badge variant="secondary">{t('familyDashboard.perMonth')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('familyDashboard.seatBilledOnYours')}
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>{t('familyDashboard.theyPayInvitee')}</span>
                      <Badge variant="outline">{t('familyDashboard.perMonth')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('familyDashboard.theyCreateSubscription')}
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-0 bg-background border-t pt-4 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('familyDashboard.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? (formData.billing_type === 'owner' ? t('familyDashboard.processing') : t('familyDashboard.sending'))
                  : (formData.billing_type === 'owner' ? t('familyDashboard.payNow') : t('familyDashboard.sendInvite'))
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyInviteModal;