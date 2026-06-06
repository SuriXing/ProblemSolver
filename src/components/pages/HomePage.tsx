import React, { useEffect, useState } from 'react';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping, faComments, faCrown } from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
import { withLocalSuffix } from '../../utils/environmentLabel';
import { useExitNavigate } from '../../context/NavigationLockContext';
import { prefersReducedMotion } from '../../utils/transitions';
import '../../styles/HomePage.css';

const HomePage: React.FC = () => {
  const { t, i18n } = useTypeSafeTranslation();
  const { isExiting, exitClassName, navigateWithExit } = useExitNavigate();
  // Per-card click feedback (defect #9). The clicked card scales down via CSS
  // within ~80ms — well under the 60ms read window in OUT-7.
  const [clickedCard, setClickedCard] = useState<null | 'confess' | 'help'>(null);

  // Update page title when language changes
  useEffect(() => {
    document.title = withLocalSuffix(t('siteName'));
  }, [t, i18n.language]);

  const handleConfessClick = () => {
    setClickedCard('confess');
    navigateWithExit('/confession');
  };
  const handleHelpClick = () => {
    setClickedCard('help');
    navigateWithExit('/help');
  };
  // Defect #10: admin uses fast variant (--transition-admin-ms ≈ 200ms).
  const handleAdminClick = () => navigateWithExit('/admin/login', { fast: true });

  // Defect #8: removed the visibleElements cascade. The page-enter keyframe
  // already handles the arrival animation; per-element fades were redundant
  // and conflicted with the section-level animation.

  return (
    <Layout>
      <section
        id="home-view"
        className={isExiting ? exitClassName : ''}
        // A-3: hide exiting page from focus + AT
        {...(isExiting ? { inert: '' as unknown as undefined } : {})}
      >
        <div className="hero">
          <div className="container">
            <h1 className="hero-title">{t('homeTitle')}</h1>
            <p className="hero-subtitle">{t('homeSubtitle')}</p>
          </div>
        </div>

        <div className="container options-container">
          <div className="option-cards">
            <div
              className={`option-card${clickedCard === 'confess' ? ' clicked' : ''}`}
              onClick={handleConfessClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleConfessClick();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="option-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <FontAwesomeIcon icon={faComments} style={{ color: 'var(--primary)' }} />
              </div>
              <h2>{t('confessCardTitle')}</h2>
              <p>{t('confessCardDesc')}</p>
              <div className="btn-primary">
                {t('startConfession')}
              </div>
            </div>

            <div
              className={`option-card${clickedCard === 'help' ? ' clicked' : ''}`}
              onClick={handleHelpClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleHelpClick();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className="option-icon" style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 15%, transparent)' }}>
                <FontAwesomeIcon icon={faHandsHelping} style={{ color: 'var(--primary)' }} />
              </div>
              <h2>{t('helpCardTitle')}</h2>
              <p>{t('helpCardDesc')}</p>
              <div className="btn-primary" style={{ backgroundColor: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                {t('goHelp')}
              </div>
            </div>
          </div>
        </div>

        {/* Admin access link */}
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 80,
          zIndex: 1000
        }}>
          <button
            onClick={handleAdminClick}
            type="button"
            data-testid="admin-login-button"
            aria-label={t('adminLogin') || 'Admin login'}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '50%',
              width: 48,
              height: 48,
              color: 'var(--text-on-primary, #f5f7ff)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              // A-4: respect reduced-motion
              transition: prefersReducedMotion() ? 'none' : 'all 0.3s ease',
              opacity: 0.7
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              if (!prefersReducedMotion()) {
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.7';
              if (!prefersReducedMotion()) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={t('adminLogin') || 'Admin login'}
          >
            <FontAwesomeIcon icon={faCrown} aria-hidden="true" />
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;
