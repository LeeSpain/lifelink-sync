// Utility functions to handle payment success notifications across tabs

export const notifyPaymentSuccess = (type: 'subscription' | 'family' | 'order') => {
  // Store in localStorage to trigger storage event in other tabs
  localStorage.setItem(`${type}-updated`, Date.now().toString());
  
  // Remove immediately to ensure future updates trigger
  setTimeout(() => {
    localStorage.removeItem(`${type}-updated`);
  }, 100);
  
  // Dispatch custom event in current tab
  window.dispatchEvent(new CustomEvent('data-updated', {
    detail: { type }
  }));
};

export const handleStripeSuccess = () => {
  // Called when user returns from successful Stripe payment
  notifyPaymentSuccess('subscription');
  
  // Show success message
  const toast = document.createElement('div');
  toast.innerHTML = 'Payment successful! Your subscription is now active.';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    z-index: 10000;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    document.body.removeChild(toast);
  }, 3000);
};