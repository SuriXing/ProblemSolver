import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { i18n } from 'i18next';
import i18nInstance from '../utils/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18nInstance.language);

  useEffect(() => {
    // Initialize language from localStorage if available
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      i18nInstance.changeLanguage(savedLanguage);
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = async (language: string) => {
    await i18nInstance.changeLanguage(language);
    setCurrentLanguage(language);
    localStorage.setItem('language', language);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
