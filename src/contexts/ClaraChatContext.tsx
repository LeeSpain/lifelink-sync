import React, { createContext, useContext, useState, useCallback } from 'react';

interface ClaraChatContextType {
  isClaraOpen: boolean;
  openClaraChat: () => void;
  closeClaraChat: () => void;
}

const ClaraChatContext = createContext<ClaraChatContextType | undefined>(undefined);

export const useClaraChat = () => {
  const context = useContext(ClaraChatContext);
  if (!context) {
    throw new Error('useClaraChat must be used within a ClaraChatProvider');
  }
  return context;
};

interface ClaraChatProviderProps {
  children: React.ReactNode;
}

export const ClaraChatProvider: React.FC<ClaraChatProviderProps> = ({ children }) => {
  const [isClaraOpen, setIsClaraOpen] = useState(false);

  const openClaraChat = useCallback(() => {
    setIsClaraOpen(true);
  }, []);

  const closeClaraChat = useCallback(() => {
    setIsClaraOpen(false);
  }, []);

  return (
    <ClaraChatContext.Provider value={{ isClaraOpen, openClaraChat, closeClaraChat }}>
      {children}
    </ClaraChatContext.Provider>
  );
};