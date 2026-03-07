import React from 'react';
import EnhancedChatWidget from "@/components/ai-chat/EnhancedChatWidget";
import { useTranslation } from 'react-i18next';
import { useClaraChat } from '@/contexts/ClaraChatContext';
import { useLocation } from 'react-router-dom';

const GlobalClaraChat: React.FC = () => {
  const { t } = useTranslation();
  const { isClaraOpen, closeClaraChat } = useClaraChat();
  const location = useLocation();

  // Don't show Clara on admin dashboard, member dashboard, family-app page, or SOS app page
  if (location.pathname.startsWith('/admin-dashboard') ||
      location.pathname.startsWith('/member-dashboard') ||
      location.pathname === '/family-app' ||
      location.pathname === '/sos-app') {
    return null;
  }

  // Only render the chat widget (trigger button is now in Navigation)
  return (
    <EnhancedChatWidget
      isOpen={isClaraOpen}
      onClose={closeClaraChat}
      userName={t('common.visitor', { defaultValue: 'Visitor' })}
      context="global"
    />
  );
};

export default GlobalClaraChat;
