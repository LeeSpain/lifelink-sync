import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useStripeConfig } from '@/hooks/useStripeConfig';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface ProductionStripeWrapperProps {
  children: React.ReactNode;
}

export const ProductionStripeWrapper: React.FC<ProductionStripeWrapperProps> = ({ children }) => {
  const { publishableKey, loading, error } = useStripeConfig();
  const [stripePromise, setStripePromise] = React.useState<any>(null);

  React.useEffect(() => {
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !publishableKey || !stripePromise) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Payment system temporarily unavailable</p>
        <p className="text-sm text-muted-foreground mt-2">
          Please try again later or contact support if the issue persists.
        </p>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};