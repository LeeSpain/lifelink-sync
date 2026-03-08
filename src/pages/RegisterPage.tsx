import React from 'react';
import { PageSEO } from '@/components/PageSEO';
import RegistrationWizard from '@/components/registration/RegistrationWizard';

const RegisterPage: React.FC = () => {
  return (
    <>
      <PageSEO
        title="Register - LifeLink Sync"
        description="Create your LifeLink Sync account. Set up your emergency protection profile, add contacts, and choose your plan."
      />
      <RegistrationWizard />
    </>
  );
};

export default RegisterPage;
