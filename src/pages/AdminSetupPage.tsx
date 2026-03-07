import React from 'react';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import SecureAdminSetup from '@/components/SecureAdminSetup';

const AdminSetupPage = () => {
  useScrollToTop();

  return <SecureAdminSetup />;
};

export default AdminSetupPage;