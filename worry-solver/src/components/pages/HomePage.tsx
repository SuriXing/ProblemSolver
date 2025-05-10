import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';

const HomePage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
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
    <>
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
            <div className={`option-card ${visibleElements.optionCard1 ? 'visible' : ''}`}>
              <div className="option-icon">
                <FontAwesomeIcon icon={faCommentDots} />
              </div>
              <h2>{t('confessCardTitle')}</h2>
              <p>{t('confessCardDesc')}</p>
              <Link to="/confession" className="btn-primary">
                {t('startConfession')}
              </Link>
            </div>

            <div className={`option-card ${visibleElements.optionCard2 ? 'visible' : ''}`}>
              <div className="option-icon">
                <FontAwesomeIcon icon={faHandsHelping} />
              </div>
              <h2>{t('helpCardTitle')}</h2>
              <p>{t('helpCardDesc')}</p>
              <Link to="/help" className="btn-primary">
                {t('goHelp')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage; 