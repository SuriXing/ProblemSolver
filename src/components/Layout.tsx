import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from '../context/TranslationContext';
import Header from './layout/Header';
import '../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { currentLanguage } = useTranslationContext();
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);

  // 监听语言变化，添加过渡效果
  useEffect(() => {
    const handleLanguageChanging = () => {
      setIsLanguageChanging(true);
      setTimeout(() => setIsLanguageChanging(false), 300);
    };

    i18n.on('languageChanging', handleLanguageChanging);
    return () => {
      i18n.off('languageChanging', handleLanguageChanging);
    };
  }, [i18n]);

  return (
    <div className={`layout ${isLanguageChanging ? 'language-changing' : ''}`} data-i18n-loading={isLanguageChanging}>
      <Header />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          {t('footerText')}
        </div>
      </footer>
    </div>
  );
};

export default Layout;