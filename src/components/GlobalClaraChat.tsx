import React from 'react';
import EnhancedChatWidget from "@/components/ai-chat/EnhancedChatWidget";
import { useTranslation } from 'react-i18next';
import { useClaraChat } from '@/contexts/ClaraChatContext';
import { useLocation } from 'react-router-dom';
import { useClaraVisibility } from '@/hooks/useClaraVisibility';

const GlobalClaraChat: React.FC = () => {
  const { t } = useTranslation();
  const { isClaraOpen, closeClaraChat } = useClaraChat();
  const location = useLocation();
  const { isVisibleOnRoute } = useClaraVisibility();

  // Dynamic visibility based on admin-configured rules
  if (!isVisibleOnRoute(location.pathname)) {
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
