import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import type { SupportedLanguages } from '../types/i18n.types';

interface TranslationContextType {
  changeLanguage: (lang: SupportedLanguages) => Promise<void>;
  getCurrentLanguage: () => SupportedLanguages;
  currentLanguage: string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 初始化时从 localStorage 读取语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const changeLanguage = useCallback(async (lang: SupportedLanguages) => {
    try {
      await i18n.changeLanguage(lang);
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;

      // 更新页面标题和描述
      const siteNameTranslation = i18n.t('siteName');
      const siteDescriptionTranslation = i18n.t('siteDescription');
      document.title = siteNameTranslation;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', siteDescriptionTranslation);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);

  const getCurrentLanguage = useCallback((): SupportedLanguages => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && isSupportedLanguage(savedLanguage)) {
      return savedLanguage;
    }
    return 'zh-CN';
  }, []);

  return (
    <TranslationContext.Provider value={{ 
      changeLanguage, 
      getCurrentLanguage,
      currentLanguage: i18n.language 
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};

// Type guard for supported languages
function isSupportedLanguage(lang: string): lang is SupportedLanguages {
  return ['zh-CN', 'en', 'ja', 'ko', 'es'].includes(lang);
}

export default TranslationContext;