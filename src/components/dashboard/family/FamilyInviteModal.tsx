import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
        throw new Error("Name, email, phone, and relationship are all required");
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
          title: "Redirecting to Payment",
          description: `Taking you to secure payment for ${formData.name}'s family access.`
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
          title: "Invite Sent",
          description: `Invite sent to ${formData.name}. They will receive payment instructions via email.`
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process family invite",
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
            Invite Family Member
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 px-1">
          {/* Benefits Section */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-4 rounded-lg border">
            <h4 className="font-medium mb-3 text-foreground">Family gets SOS alerts and a live map with a single "Received & On It."</h4>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location only during SOS. No continuous tracking.</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>No device/battery telemetry shared with family.</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Live alerts, map access, and acknowledgment tools.</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter family member's name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder="e.g., Spouse, Parent, Child, Sibling"
                required
              />
            </div>

            <div>
              <Label className="text-base font-medium">Who pays? (€2.99/month)</Label>
              <RadioGroup
                value={formData.billing_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, billing_type: value as "owner" | "self" }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="owner" id="owner" />
                  <Label htmlFor="owner" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>You pay (Owner-paid)</span>
                      <Badge variant="secondary">€2.99/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seat is billed on your subscription
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="self" id="self" />
                  <Label htmlFor="self" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span>They pay (Invitee-paid)</span>
                      <Badge variant="outline">€2.99/month</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      They create their own subscription
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
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (formData.billing_type === 'owner' ? "Processing..." : "Sending...") 
                  : (formData.billing_type === 'owner' ? "Pay Now" : "Send Invite")
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