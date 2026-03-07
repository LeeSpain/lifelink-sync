import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCustomerProducts } from '@/hooks/useCustomerProducts';
import { Package, Plus, ShoppingCart, DollarSign, Calendar } from 'lucide-react';
import { AddProductDialog } from './AddProductDialog';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface CustomerProductsTabProps {
  userId: string;
}

export const CustomerProductsTab: React.FC<CustomerProductsTabProps> = ({ userId }) => {
  const { orders, availableProducts, stats, isLoading } = useCustomerProducts(userId);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      delivered: 'default',
      cancelled: 'destructive',
      refunded: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Purchase</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {stats.lastPurchaseDate 
                ? format(new Date(stats.lastPurchaseDate), 'MMM d, yyyy')
                : 'No purchases'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order History</CardTitle>
          <Button onClick={() => setShowAddProduct(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.products?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {order.products?.sku || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>${Number(order.total_price).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet. Click "Add Product" to create an order.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddProductDialog
        userId={userId}
        availableProducts={availableProducts || []}
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
      />

      {selectedOrder && (
        <OrderDetailsDialog
          order={selectedOrder}
          userId={userId}
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
