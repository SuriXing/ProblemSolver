import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { useLanguage } from '../../context/LanguageContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping, faHistory, faGlobe } from '@fortawesome/free-solid-svg-icons';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <FontAwesomeIcon icon={faHandsHelping} className={styles.logoIcon} />
            <span>{t('siteName')}</span>
          </Link>
        </div>
        <div className={styles.navActions}>
          <Link to="/past-questions" className={styles.navLink}>
            <FontAwesomeIcon icon={faHistory} className={styles.navIcon} />
            <span>{t('pastQuestions')}</span>
          </Link>
          
          {/* Language Selector */}
          <div className={styles.languageSelector}>
            <div 
              className={styles.languageBtn}
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            >
              <FontAwesomeIcon icon={faGlobe} /> 
              <span>{t('language')}</span>
              <FontAwesomeIcon icon={faGlobe} className={styles.languageIcon} />
            </div>
            <div className={`${styles.languageDropdown} ${isLangDropdownOpen ? styles.show : ''}`}>
              <div 
                className={`${styles.languageOption} ${currentLanguage === 'zh-CN' ? styles.active : ''}`}
                onClick={() => handleLanguageChange('zh-CN')}
              >
                {t('chinese')}
              </div>
              <div 
                className={`${styles.languageOption} ${currentLanguage === 'en' ? styles.active : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                {t('english')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
