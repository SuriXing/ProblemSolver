import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faHistory, faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import { useTranslationContext } from '../../context/TranslationContext';
import type { SupportedLanguages } from '../../types/i18n.types';
import '../../styles/Header.css';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useTranslationContext();

  const languages = [
    { code: 'zh-CN' as SupportedLanguages, name: '中文' },
    { code: 'en' as SupportedLanguages, name: 'English' },
    { code: 'ja' as SupportedLanguages, name: '日本語' },
    { code: 'ko' as SupportedLanguages, name: '한국어' },
    { code: 'es' as SupportedLanguages, name: 'Español' }
  ] as const;

  const handleLanguageChange = async (languageCode: SupportedLanguages) => {
    await changeLanguage(languageCode);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <FontAwesomeIcon icon={faHandsHelping} className="logo-icon" />
            <span>{t('siteName')}</span>
          </Link>
        </div>
        <div className="nav-actions">
          <Link to="/past-questions" className="history-link">
            <FontAwesomeIcon icon={faHistory} />
            <span>{t('goToPastQuestions')}</span>
          </Link>
          <div className="language-selector">
            <div className="language-button">
              <FontAwesomeIcon icon={faGlobe} />
              <span>{languages.find(lang => lang.code === i18n.language)?.name || '中文'}</span>
            </div>
            <div className="language-dropdown">
              {languages.map(language => (
                <div 
                  key={language.code}
                  className={`language-option ${i18n.language === language.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  {language.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
