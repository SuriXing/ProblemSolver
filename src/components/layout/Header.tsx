import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faHistory, faHandsHelping, faUsers } from '@fortawesome/free-solid-svg-icons';
import { useTranslationContext } from '../../context/TranslationContext';
import type { SupportedLanguages } from '../../types/i18n.types';
import { withLocalSuffix } from '../../utils/environmentLabel';
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
  const siteNameLabel = withLocalSuffix(t('siteName'));
  const mentorTableLabel = t('mentorTableNav');

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

  // Add logic to not show instruction if user opted out
  useEffect(() => {
    if (localStorage.getItem('hideInstruction') === '1') {
      setShowInstruction(false);
    }
  }, []);

  return (
    <header className="header">
      <div className="container">
        <div className="logo">
          <Link to="/">
            <FontAwesomeIcon icon={faHandsHelping} className="logo-icon" />
            <span>{siteNameLabel}</span>
          </Link>
        </div>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/past-questions" className="nav-link">
            <FontAwesomeIcon icon={faHistory} />
            <span>{t('goToPastQuestions')}</span>
          </Link>
          <Link to="/mentor-table" className="nav-link">
            <FontAwesomeIcon icon={faUsers} />
            <span>{mentorTableLabel}</span>
          </Link>
          {localStorage.getItem('hideInstruction') !== '1' && (
            <div
              className="instruction-container"
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => { if (!pinned) setShowInstruction(true); }}
              onMouseLeave={() => { if (!pinned) setShowInstruction(false); }}
            >
              <button
                type="button"
                className="nav-link instruction-button"
                tabIndex={0}
                onClick={() => { setPinned(true); setShowInstruction(true); }}
              >
                <span role="img" aria-label="instruction">📖</span>
                <span>{t('instruction')}</span>
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
                    🌱 {siteNameLabel}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    {t('siteDescription')}
                  </div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('instruction')}</div>
                  <ul style={{ marginBottom: 8, paddingLeft: 22 }}>
                    <li>{t('confessCardDesc')}</li>
                    <li>{t('helpCardDesc')}</li>
                    <li>{t('saveAccessCode')}</li>
                  </ul>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('privacyWarningTitle')}</div>
                  <div>
                    {t('privacyWarningText')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18 }}>
                    <button
                      type="button"
                      className="instruction-button"
                      style={{
                        background: 'none',
                        border: '1px solid #fff',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: '0.97rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        localStorage.setItem('hideInstruction', '1');
                        setShowInstruction(false);
                        setPinned(false);
                      }}
                    >
                      {t('hideInstruction')}
                    </button>
                    <button
                      type="button"
                      className="instruction-button"
                      style={{
                        background: 'none',
                        border: '1px solid #fff',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: '0.97rem',
                        fontWeight: 500,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setShowInstruction(false);
                        setPinned(false);
                      }}
                    >
                      {t('keepInstruction')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
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
