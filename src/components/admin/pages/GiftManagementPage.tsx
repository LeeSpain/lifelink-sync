import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Euro, Search, RefreshCw, Loader2, Copy, Mail, DollarSign, CheckCircle, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';

interface GiftRecord {
  id: string;
  purchaser_email: string;
  purchaser_name: string | null;
  recipient_email: string;
  recipient_name: string | null;
  gift_type: string;
  amount_paid: number;
  currency: string;
  status: string;
  redeem_code: string;
  personal_message: string | null;
  delivery_date: string | null;
  delivered_at: string | null;
  redeemed_at: string | null;
  expires_at: string;
  created_at: string;
}

type StatusFilter = 'all' | 'pending_payment' | 'paid' | 'delivered' | 'redeemed' | 'expired' | 'refunded';

const GIFT_TYPE_LABELS: Record<string, string> = {
  monthly: '1 Month',
  annual: '12 Months',
  bundle: 'Bundle + Pendant',
  voucher: 'Voucher',
};

export default function GiftManagementPage() {
  const [gifts, setGifts] = useState<GiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refundGiftId, setRefundGiftId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    loadGifts();
  }, []);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('gift_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGifts((data || []) as unknown as GiftRecord[]);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to load gifts: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredGifts = useMemo(() => {
    let result = gifts;

    if (statusFilter !== 'all') {
      result = result.filter(g => g.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(g =>
        g.purchaser_email.toLowerCase().includes(q) ||
        g.recipient_email.toLowerCase().includes(q) ||
        (g.purchaser_name?.toLowerCase().includes(q)) ||
        (g.recipient_name?.toLowerCase().includes(q)) ||
        g.redeem_code.toLowerCase().includes(q)
      );
    }

    return result;
  }, [gifts, statusFilter, searchQuery]);

  // Stats
  const totalGifts = gifts.length;
  const totalRevenue = gifts
    .filter(g => g.status !== 'pending_payment' && g.status !== 'refunded')
    .reduce((sum, g) => sum + Number(g.amount_paid), 0);
  const redeemedCount = gifts.filter(g => g.status === 'redeemed').length;
  const pendingCount = gifts.filter(g => g.status === 'paid' || g.status === 'delivered').length;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Redeem code copied');
  };

  const handleResendEmail = async (giftId: string) => {
    setResendingId(giftId);
    try {
      const { error } = await supabase.functions.invoke('gift-send-email', {
        body: { gift_id: giftId, type: 'recipient' },
      });
      if (error) throw error;
      toast.success('Gift email resent');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to resend: ' + msg);
    } finally {
      setResendingId(null);
    }
  };

  const handleMarkRefunded = async () => {
    if (!refundGiftId) return;
    try {
      const { error } = await supabase
        .from('gift_subscriptions')
        .update({ status: 'refunded', updated_at: new Date().toISOString() })
        .eq('id', refundGiftId)
        .in('status', ['paid', 'delivered']);

      if (error) throw error;
      toast.success('Gift marked as refunded');
      setRefundGiftId(null);
      loadGifts();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error('Failed to refund: ' + msg);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">Pending</Badge>;
      case 'paid':
        return <Badge className="bg-blue-100 text-blue-800">Paid</Badge>;
      case 'delivered':
        return <Badge className="bg-indigo-100 text-indigo-800">Delivered</Badge>;
      case 'redeemed':
        return <Badge className="bg-green-100 text-green-800">Redeemed</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expired</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-800">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            Gift Subscriptions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage gift purchases, track redemptions, and handle refunds</p>
        </div>
        <Button onClick={loadGifts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" /> Total Gifts Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalGifts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Euro className="h-3 w-3" /> Gift Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Redeemed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{redeemedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, name, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Purchases ({filteredGifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredGifts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery || statusFilter !== 'all' ? 'No gifts match your filters' : 'No gift purchases yet'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Purchaser</th>
                    <th className="text-left py-3 px-2 font-medium">Recipient</th>
                    <th className="text-left py-3 px-2 font-medium">Package</th>
                    <th className="text-right py-3 px-2 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Code</th>
                    <th className="text-right py-3 px-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGifts.map(gift => (
                    <tr key={gift.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 whitespace-nowrap">
                        {new Date(gift.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[140px] truncate" title={gift.purchaser_email}>
                          {gift.purchaser_name || gift.purchaser_email}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="max-w-[140px] truncate" title={gift.recipient_email}>
                          {gift.recipient_name || gift.recipient_email}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="secondary" className="text-xs">
                          {GIFT_TYPE_LABELS[gift.gift_type] || gift.gift_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        €{Number(gift.amount_paid).toFixed(2)}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(gift.status)}</td>
                      <td className="py-3 px-2">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {gift.redeem_code}
                        </code>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            title="Copy redeem code"
                            onClick={() => handleCopyCode(gift.redeem_code)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {(gift.status === 'paid' || gift.status === 'delivered') && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Resend gift email"
                                disabled={resendingId === gift.id}
                                onClick={() => handleResendEmail(gift.id)}
                              >
                                {resendingId === gift.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Mail className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Mark as refunded"
                                onClick={() => setRefundGiftId(gift.id)}
                              >
                                <DollarSign className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundGiftId} onOpenChange={() => setRefundGiftId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark gift as refunded?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the gift as refunded. The recipient will no longer be able to redeem the code.
              Make sure you have processed the actual Stripe refund separately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleMarkRefunded}
            >
              Mark Refunded
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
