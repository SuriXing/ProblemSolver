import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faHistory, faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import '../../styles/Header.css';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = React.useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '中文' },
    { code: 'es', name: 'Español' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' }
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setShowLanguageMenu(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <FontAwesomeIcon icon={faHandsHelping} className="logo-icon" />
            <span>{t('siteName', '解忧杂货铺')}</span>
          </Link>
        </div>
        <div className="nav-actions">
          <Link to="/past-questions" className="history-link">
            <FontAwesomeIcon icon={faHistory} />
            <span>{t('pastQuestions', '过往问题')}</span>
          </Link>
          <div className="language-selector">
            <div 
              className="language-button" 
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <FontAwesomeIcon icon={faGlobe} /> {languages.find(lang => lang.code === i18n.language)?.name || 'English'}
            </div>
            <div className={`language-dropdown ${showLanguageMenu ? 'show' : ''}`}>
              {languages.map(language => (
                <div 
                  key={language.code}
                  className={`language-option ${i18n.language === language.code ? 'active' : ''}`}
                  onClick={() => changeLanguage(language.code)}
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
