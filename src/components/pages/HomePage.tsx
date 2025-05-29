import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import Layout from '../layout/Layout';
// Import our new CSS file
import '../../styles/HomePage.css';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
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
              在这里，你的故事有人倾听
            </h1>
            <p className={`hero-subtitle ${visibleElements.heroSubtitle ? 'visible' : ''}`}>
              匿名、安全、温暖的社区
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
                <FontAwesomeIcon icon={faCommentDots} style={{ color: '#4285F4' }} />
              </div>
              <h2>我有话想说</h2>
              <p>在这里安全地分享你的困扰，收获温暖回应</p>
              <div className="btn-primary">
                开始倾诉
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
              <h2>我想帮助别人</h2>
              <p>给予他人温暖的建议，成为某人的光</p>
              <div className="btn-primary" style={{ backgroundColor: 'white', color: '#4285F4', border: '1px solid #4285F4' }}>
                去帮助他人
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer text-center" style={{ color: '#999', fontSize: '0.9rem', marginTop: '2rem' }}>
          © 2024 解忧杂货铺 - 一个温暖的心灵港湾
        </div>
      </section>
    </Layout>
  );
};

export default HomePage; 