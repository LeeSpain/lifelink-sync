import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink } from 'lucide-react';

interface StripeManagementControlProps {
  stripeCustomerId?: string;
  userId: string;
}

export function StripeManagementControl({ stripeCustomerId, userId }: StripeManagementControlProps) {
  const handleOpenStripe = () => {
    if (stripeCustomerId) {
      // Open Stripe dashboard for this customer
      window.open(`https://dashboard.stripe.com/customers/${stripeCustomerId}`, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Integration
        </CardTitle>
        <CardDescription>
          Payment and billing management
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Customer ID</span>
            {stripeCustomerId ? (
              <Badge variant="outline" className="font-mono">
                {stripeCustomerId}
              </Badge>
            ) : (
              <Badge variant="secondary">Not linked</Badge>
            )}
          </div>

          {stripeCustomerId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenStripe}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Stripe Dashboard
            </Button>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Manage payment methods, invoices, and billing history through the Stripe dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
