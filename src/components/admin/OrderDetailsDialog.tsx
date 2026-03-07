import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCustomerProducts } from '@/hooks/useCustomerProducts';
import { format } from 'date-fns';
import { Package, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface OrderDetailsDialogProps {
  order: any;
  userId: string;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  order,
  userId,
  open,
  onClose,
}) => {
  const { updateOrderStatus, isUpdating } = useCustomerProducts(userId);
  const [newStatus, setNewStatus] = useState(order.status);
  const [notes, setNotes] = useState('');

  const handleUpdateStatus = () => {
    updateOrderStatus(
      {
        orderId: order.id,
        status: newStatus,
        notes,
      },
      {
        onSuccess: () => {
          setNotes('');
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Order ID</div>
              <div className="font-mono text-sm">{order.id}</div>
            </div>
            <Badge>{order.status}</Badge>
          </div>

          {/* Product Information */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="font-medium">{order.products?.name || 'Unknown Product'}</div>
                <div className="text-sm text-muted-foreground">SKU: {order.products?.sku || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">
                  Category: {order.products?.product_categories?.name || 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm">Order Date</div>
                <div className="font-medium">{format(new Date(order.created_at), 'PPP')}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm">Pricing</div>
                <div className="font-medium">
                  {order.quantity} × ${Number(order.unit_price).toFixed(2)} = ${Number(order.total_price).toFixed(2)}
                </div>
              </div>
            </div>

            {order.stripe_payment_intent_id && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm">Payment ID</div>
                  <div className="font-mono text-xs">{order.stripe_payment_intent_id}</div>
                </div>
              </div>
            )}
          </div>

          {/* Update Status Section */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Update Order Status</h4>
            
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button 
            onClick={handleUpdateStatus} 
            disabled={newStatus === order.status || isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
