import React from 'react';
import { useTranslation } from 'react-i18next';
import Header from './Header';
import Footer from './Footer';
import '../../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <div className="language-selector">
        <div className="language-icon">🌐</div>
        <div className="language-options">
          <div className="language-option" onClick={() => changeLanguage('en')}>English</div>
          <div className="language-option" onClick={() => changeLanguage('zh')}>中文</div>
          <div className="language-option" onClick={() => changeLanguage('es')}>Español</div>
        </div>
      </div>
    </div>
  );
};

export default Layout; 