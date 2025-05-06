import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping, faComments } from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
import '../../styles/HomePage.css';

const HomePage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const navigate = useNavigate();
  
  // Safe translation function
  const safeT = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation === key ? fallback : translation;
    } catch (e) {
      console.warn(`Translation error for key '${key}':`, e);
      return fallback;
    }
  };
  
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

  console.log('HomePage rendering');

  return (
    <Layout>
      <section id="home-view">
        <div className="hero">
          <div className="container">
            <h1 className={`hero-title ${visibleElements.heroTitle ? 'visible' : ''}`}>
              {safeT('homeTitle', 'Worry Solver')}
            </h1>
            <p className={`hero-subtitle ${visibleElements.heroSubtitle ? 'visible' : ''}`}>
              {safeT('homeSubtitle', 'Share your troubles, find solutions')}
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
              <h2>{safeT('confessCardTitle', 'Share Your Worries')}</h2>
              <p>{safeT('confessCardDesc', 'Share your troubles safely and receive warm responses')}</p>
              <div className="btn-primary">
                {safeT('startConfession', 'Start Sharing')}
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
              <h2>{safeT('helpCardTitle', 'Help Others')}</h2>
              <p>{safeT('helpCardDesc', 'Provide guidance to those in need')}</p>
              <div className="btn-primary" style={{ backgroundColor: 'white', color: '#4285F4', border: '1px solid #4285F4' }}>
                {safeT('goHelp', 'Offer Help')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer text-center" style={{ color: '#999', fontSize: '0.9rem', marginTop: '2rem' }}>
          {safeT('footerText', '© 2023 Worry Solver. All rights reserved.')}
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 