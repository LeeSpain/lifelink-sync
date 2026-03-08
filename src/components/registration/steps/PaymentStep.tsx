import React from 'react';
import EmbeddedPayment from '@/components/EmbeddedPayment';
import { Shield } from 'lucide-react';

interface PaymentStepProps {
  data: {
    selectedPlanId: string;
    selectedProducts: string[];
    selectedServices: string[];
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone: string;
    city: string;
    country: string;
  };
  onSuccess: () => void;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ data, onSuccess, onBack }) => {
  const plans = data.selectedPlanId ? [data.selectedPlanId] : [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">Complete Payment</h2>
        <p className="text-sm text-muted-foreground">Secure payment powered by Stripe</p>
      </div>

      <EmbeddedPayment
        plans={plans}
        products={data.selectedProducts}
        regionalServices={data.selectedServices}
        userEmail={data.email}
        firstName={data.firstName}
        lastName={data.lastName}
        password={data.password}
        phone={data.phone}
        city={data.city}
        country={data.country}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </div>
  );
};

export default PaymentStep;
