import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
// Import our new CSS file
import '../../styles/HomePage.css';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
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
            <Link to="/confession" className={`option-card ${visibleElements.optionCard1 ? 'visible' : ''}`}>
              <div className="option-icon">
                <FontAwesomeIcon icon={faHeart} />
              </div>
              <h2>{t('confessCardTitle')}</h2>
              <p>{t('confessCardDesc')}</p>
              <div className="btn-primary">
                {t('startConfession')}
              </div>
            </Link>

            <Link to="/help" className={`option-card ${visibleElements.optionCard2 ? 'visible' : ''}`}>
              <div className="option-icon">
                <FontAwesomeIcon icon={faHandsHelping} />
              </div>
              <h2>{t('helpCardTitle')}</h2>
              <p>{t('helpCardDesc')}</p>
              <div className="btn-primary">
                {t('goHelp')}
              </div>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 