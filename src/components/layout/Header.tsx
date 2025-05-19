import React, { useState, useRef, useEffect } from 'react';
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
  const [showInstruction, setShowInstruction] = useState(false);
  const [pinned, setPinned] = useState(false);
  const instructionRef = useRef<HTMLDivElement>(null);

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

  // Close the instruction box when clicking outside if pinned
  useEffect(() => {
    if (!pinned) return;
    const handleClick = (e: MouseEvent) => {
      if (
        instructionRef.current &&
        !instructionRef.current.contains(e.target as Node)
      ) {
        setShowInstruction(false);
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [pinned]);

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
          <div
            className="instruction-link"
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => { if (!pinned) setShowInstruction(true); }}
            onMouseLeave={() => { if (!pinned) setShowInstruction(false); }}
          >
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 400 }}
              tabIndex={0}
              onClick={() => { setPinned(true); setShowInstruction(true); }}
            >
              <span role="img" aria-label="instruction">📖</span>
              {t('instruction')}
            </button>
            {showInstruction && (
              <div
                ref={instructionRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#222',
                  color: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  padding: '20px 24px',
                  minWidth: 320,
                  maxWidth: 400,
                  zIndex: 100,
                  fontSize: '0.98rem',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-line',
                  maxHeight: 320,
                  overflowY: pinned ? 'auto' : 'hidden',
                  transition: 'background 0.2s, color 0.2s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '1.08rem', color: '#fff' }}>
                  🌱 Welcome to {t('siteName')}
                </div>
                <div style={{ marginBottom: 12 }}>
                  A private place to share your worries, feel heard, and find comfort.
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>🫶 What This Website Is For</div>
                <div style={{ marginBottom: 8 }}>
                  Everyone has moments when things feel too heavy. This website is a safe space where you can:
                </div>
                <ul style={{ marginBottom: 8, paddingLeft: 22 }}>
                  <li>💬 Talk about your worries—anything that's been bothering you, big or small.</li>
                  <li>🤝 Receive kind words and comfort from others who understand.</li>
                  <li>✨ Know you're not alone.</li>
                </ul>
                <div style={{ marginBottom: 10 }}>
                  There's no need to keep it all bottled up. You can share here anonymously, safely, and without judgment.
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>🔐 How It Works: The Access Code System</div>
                <div style={{ marginBottom: 8 }}>
                  Whenever you share a problem or post something on the site, you'll be given a unique access code.
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>Why is this important?</div>
                <div style={{ marginBottom: 6 }}>
                  <b>Privacy First:</b><br />
                  We don't show a list of your past posts on the homepage or any account page. Why?<br />
                  Because we care about your privacy.<br />
                  Let's say your parent or someone else checks your phone—you don't have to worry. You can just tell them this is a website your school teacher recommended to help others. There's nothing obvious that shows what you've posted.
                </div>
                <div>
                  <b>Easy to Find Your Post Again:</b><br />
                  Just save or remember the access code. When you want to check replies or updates, you can simply enter your code to go straight to your post—quietly, securely, and whenever you're ready.
                </div>
              </div>
            )}
          </div>
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
