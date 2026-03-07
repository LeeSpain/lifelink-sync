import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCustomerServices } from '@/hooks/useCustomerServices';

interface AddServiceDialogProps {
  userId: string;
  availableServices: any[];
  open: boolean;
  onClose: () => void;
}

export const AddServiceDialog: React.FC<AddServiceDialogProps> = ({
  userId,
  availableServices,
  open,
  onClose,
}) => {
  const { assignService, isAssigning } = useCustomerServices(userId);
  const [formData, setFormData] = useState({
    serviceId: '',
    priceOverride: '',
    autoRenew: true,
    endDate: '',
    notes: '',
  });

  const handleSubmit = () => {
    assignService(
      {
        customerId: userId,
        serviceId: formData.serviceId,
        priceOverride: formData.priceOverride ? Number(formData.priceOverride) : undefined,
        autoRenew: formData.autoRenew,
        endDate: formData.endDate || undefined,
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          onClose();
          setFormData({
            serviceId: '',
            priceOverride: '',
            autoRenew: true,
            endDate: '',
            notes: '',
          });
        },
      }
    );
  };

  const selectedService = availableServices.find(s => s.id === formData.serviceId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Regional Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Service</Label>
            <Select value={formData.serviceId} onValueChange={(value) => setFormData({ ...formData, serviceId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - {service.region} (${service.price}/mo)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Price Override (optional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={selectedService ? `Default: $${selectedService.price}/month` : ''}
              value={formData.priceOverride}
              onChange={(e) => setFormData({ ...formData, priceOverride: e.target.value })}
            />
          </div>

          <div>
            <Label>End Date (optional)</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Auto-renew</Label>
            <Switch
              checked={formData.autoRenew}
              onCheckedChange={(checked) => setFormData({ ...formData, autoRenew: checked })}
            />
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Internal notes about this service assignment..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {selectedService && (
            <div className="p-3 bg-muted rounded space-y-1">
              <div className="text-sm font-medium">
                Monthly Price: ${formData.priceOverride || selectedService.price}
              </div>
              <div className="text-xs text-muted-foreground">
                Region: {selectedService.region}
              </div>
              {selectedService.features && (
                <div className="text-xs text-muted-foreground mt-2">
                  Features: {selectedService.features.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.serviceId || isAssigning}
          >
            {isAssigning ? 'Assigning...' : 'Assign Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
