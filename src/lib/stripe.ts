import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  console.warn('Stripe public key not configured — set VITE_STRIPE_PUBLISHABLE_KEY');
}

export const stripePromise = stripePublicKey
  ? loadStripe(stripePublicKey)
  : null;
