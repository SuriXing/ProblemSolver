import i18n from 'i18next';
import enTranslation from '../locales/en/translation.json';
import zhCNTranslation from '../locales/zh-CN/translation.json';

export const reloadTranslations = () => {
  console.log('Reloading translations...');
  
  // Add resources manually
  i18n.addResourceBundle('en', 'translation', enTranslation, true, true);
  i18n.addResourceBundle('zh-CN', 'translation', zhCNTranslation, true, true);
  
  // Force language reload
  const currentLanguage = i18n.language;
  i18n.changeLanguage(currentLanguage);
  
  console.log('Translation reload complete, current language:', currentLanguage);
}; 