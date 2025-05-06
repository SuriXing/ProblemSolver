import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping, faComments } from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
// Import our new CSS file
import '../../styles/HomePage.css';

const HomePage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const navigate = useNavigate();
  const [visibleElements, setVisibleElements] = useState({
    heroTitle: false,
    heroSubtitle: false,
    optionCard1: false,
    optionCard2: false
  });

  // Add animation when component mounts
  useEffect(() => {
    // Stagger the animations
    const timers = [
      setTimeout(() => setVisibleElements(prev => ({ ...prev, heroTitle: true })), 100),
      setTimeout(() => setVisibleElements(prev => ({ ...prev, heroSubtitle: true })), 300),
      setTimeout(() => setVisibleElements(prev => ({ ...prev, optionCard1: true })), 500),
      setTimeout(() => setVisibleElements(prev => ({ ...prev, optionCard2: true })), 700)
    ];

    // Cleanup timers
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  // Navigation handlers
  const handleConfessClick = () => {
    navigate('/confession');
  };

  const handleHelpClick = () => {
    navigate('/help');
  };

  return (
    <Layout>
      <section id="home-view">
        <div className="hero">
          <div className="container">
            <h1 className={`hero-title ${visibleElements.heroTitle ? 'visible' : ''}`}>
              {t('homeTitle')}
            </h1>
            <p className={`hero-subtitle ${visibleElements.heroSubtitle ? 'visible' : ''}`}>
              {t('homeSubtitle')}
            </p>
          </div>
        </div>

        <div className="container options-container">
          <div className="option-cards">
            <div 
              className={`option-card ${visibleElements.optionCard1 ? 'visible' : ''}`}
              onClick={handleConfessClick}
              role="button"
              tabIndex={0}
            >
              <div className="option-icon" style={{ backgroundColor: '#f0f5ff' }}>
                <FontAwesomeIcon icon={faComments} style={{ color: '#4285F4' }} />
              </div>
              <h2>{t('confessCardTitle')}</h2>
              <p>{t('confessCardDesc')}</p>
              <div className="btn-primary">
                {t('startConfession')}
              </div>
            </div>

            <div 
              className={`option-card ${visibleElements.optionCard2 ? 'visible' : ''}`}
              onClick={handleHelpClick}
              role="button"
              tabIndex={0}
            >
              <div className="option-icon" style={{ backgroundColor: '#f0f5ff' }}>
                <FontAwesomeIcon icon={faHandsHelping} style={{ color: '#4285F4' }} />
              </div>
              <h2>{t('helpCardTitle')}</h2>
              <p>{t('helpCardDesc')}</p>
              <div className="btn-primary" style={{ backgroundColor: 'white', color: '#4285F4', border: '1px solid #4285F4' }}>
                {t('goHelp')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer text-center" style={{ color: '#999', fontSize: '0.9rem', marginTop: '2rem' }}>
          {t('footerText')}
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 