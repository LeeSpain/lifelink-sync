import React from 'react';
import { ProductionStripeWrapper } from './ProductionStripeWrapper';

// Unified Stripe Provider: delegates to dynamic key from Supabase edge function
// This removes the hardcoded publishable key and ensures live/test keys
// are always fetched securely from get-stripe-config.

interface ProductionStripeProviderProps {
  children: React.ReactNode;
}

export const ProductionStripeProvider: React.FC<ProductionStripeProviderProps> = ({ children }) => {
  return (
    <ProductionStripeWrapper>
      {children}
    </ProductionStripeWrapper>
  );
};
