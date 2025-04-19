import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { i18n } from 'i18next';
import i18nInstance from '../utils/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh-CN');

  useEffect(() => {
    // Initialize language from i18n once it's ready
    i18nInstance.then((instance: unknown) => {
      const i18n = instance as unknown as i18n;
      setCurrentLanguage(i18n.language);
    });
  }, []);

  const changeLanguage = async (language: string) => {
    const instance = await i18nInstance as unknown as i18n;
    await instance.changeLanguage(language);
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
