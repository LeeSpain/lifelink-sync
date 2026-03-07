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
import { useCustomerProducts } from '@/hooks/useCustomerProducts';

interface AddProductDialogProps {
  userId: string;
  availableProducts: any[];
  open: boolean;
  onClose: () => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  userId,
  availableProducts,
  open,
  onClose,
}) => {
  const { createOrder, isCreating } = useCustomerProducts(userId);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    priceOverride: '',
    paymentMethod: 'manual' as 'manual' | 'stripe' | 'free',
    status: 'completed' as any,
    notes: '',
  });

  const handleSubmit = () => {
    createOrder(
      {
        userId,
        productId: formData.productId,
        quantity: formData.quantity,
        priceOverride: formData.priceOverride ? Number(formData.priceOverride) : undefined,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          onClose();
          setFormData({
            productId: '',
            quantity: 1,
            priceOverride: '',
            paymentMethod: 'manual',
            status: 'completed',
            notes: '',
          });
        },
      }
    );
  };

  const selectedProduct = availableProducts.find(p => p.id === formData.productId);
  const calculatedPrice = formData.priceOverride 
    ? Number(formData.priceOverride) * formData.quantity
    : selectedProduct 
      ? selectedProduct.price * formData.quantity 
      : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product to Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Product</Label>
            <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - ${product.price} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            />
          </div>

          <div>
            <Label>Price Override (optional)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder={selectedProduct ? `Default: $${selectedProduct.price}` : ''}
              value={formData.priceOverride}
              onChange={(e) => setFormData({ ...formData, priceOverride: e.target.value })}
            />
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="free">Free/Promotional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Internal notes about this order..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="p-3 bg-muted rounded">
            <div className="text-sm font-medium">Total: ${calculatedPrice.toFixed(2)}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.productId || isCreating}
          >
            {isCreating ? 'Adding...' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
