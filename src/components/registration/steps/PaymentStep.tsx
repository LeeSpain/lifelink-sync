import React from 'react';
import { useTranslation } from 'react-i18next';
import EmbeddedPayment from '@/components/EmbeddedPayment';
import { Shield } from 'lucide-react';

interface PaymentStepProps {
  data: {
    selectedPlanId: string;
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
  const { t } = useTranslation();
  const plans = data.selectedPlanId ? [data.selectedPlanId] : [];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
          <Shield className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-poppins font-bold text-foreground">{t('registration.payment.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('registration.payment.subtitle')}</p>
      </div>

      <EmbeddedPayment
        plans={plans}
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
