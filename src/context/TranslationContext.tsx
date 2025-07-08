import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface TranslationContextType {
  safeT: (key: string, fallback: string) => string;
}

interface TranslationProviderProps {
  children: ReactNode;
}

const TranslationContext = createContext<TranslationContextType>({
  safeT: (key, fallback) => fallback,
});

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  
  const safeT = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation === key ? fallback : translation;
    } catch (e) {
      console.warn(`Translation error for key '${key}':`, e);
      return fallback;
    }
  };
  
  return (
    <TranslationContext.Provider value={{ safeT }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useSafeTranslation = () => useContext(TranslationContext); 