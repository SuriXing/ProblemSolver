import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faHistory, faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import { useTranslationContext } from '../../context/TranslationContext';
import type { SupportedLanguages } from '../../types/i18n.types';
import '../../styles/Header.css';
import { Modal } from 'antd';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useTranslationContext();
  const [showInstruction, setShowInstruction] = useState(false);

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
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/past-questions" className="history-link">
            <FontAwesomeIcon icon={faHistory} />
            <span>{t('goToPastQuestions')}</span>
          </Link>
          <button
            type="button"
            className="instruction-link"
            style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 400 }}
            onClick={() => setShowInstruction(true)}
          >
            <span role="img" aria-label="instruction">📖</span>
            {t('instruction')}
          </button>
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
        <Modal
          open={showInstruction}
          onCancel={() => setShowInstruction(false)}
          footer={null}
          centered
          width={520}
          bodyStyle={{ borderRadius: 12, padding: 32, background: '#f9f9f9' }}
        >
          <div style={{ fontSize: '1.1rem', color: '#222', lineHeight: 1.7 }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: 12 }}>
              🌱 Welcome to {t('siteName')}
            </div>
            <div style={{ marginBottom: 18 }}>
              A private place to share your worries, feel heard, and find comfort.
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>🫶 What This Website Is For</b>
            </div>
            <div style={{ marginBottom: 12 }}>
              Everyone has moments when things feel too heavy. This website is a safe space where you can:
            </div>
            <ul style={{ marginBottom: 12, paddingLeft: 24 }}>
              <li>💬 Talk about your worries—anything that's been bothering you, big or small.</li>
              <li>🤝 Receive kind words and comfort from others who understand.</li>
              <li>✨ Know you're not alone.</li>
            </ul>
            <div style={{ marginBottom: 18 }}>
              There's no need to keep it all bottled up. You can share here anonymously, safely, and without judgment.
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>🔐 How It Works: The Access Code System</b>
            </div>
            <div style={{ marginBottom: 12 }}>
              Whenever you share a problem or post something on the site, you'll be given a unique access code.
            </div>
            <div style={{ marginBottom: 12 }}>
              <b>Why is this important?</b>
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Privacy First:</b><br />
              We don't show a list of your past posts on the homepage or any account page. Why?<br />
              Because we care about your privacy.<br />
              Let's say your parent or someone else checks your phone—you don't have to worry. You can just tell them this is a website your school teacher recommended to help others. There's nothing obvious that shows what you've posted.
            </div>
            <div style={{ marginBottom: 8 }}>
              <b>Easy to Find Your Post Again:</b><br />
              Just save or remember the access code. When you want to check replies or updates, you can simply enter your code to go straight to your post—quietly, securely, and whenever you're ready.
            </div>
          </div>
        </Modal>
      </div>
    </header>
  );
};

export default Header;
