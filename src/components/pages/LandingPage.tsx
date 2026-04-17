import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import '../../styles/LandingPage.css';

const ProblemSolverIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6M10 22h4" strokeWidth="1.5" stroke="currentColor" />
    <path d="M9 18c-1.5-1.5-3-3.5-3-6a6 6 0 1 1 12 0c0 2.5-1.5 4.5-3 6" stroke="currentColor" />
    <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
  </svg>
);

const MentorTableIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" />
    <path d="M12 6.5l1.3 2.6 2.9.4-2.1 2 .5 2.9L12 12.8l-2.6 1.6.5-2.9-2.1-2 2.9-.4z" fill="currentColor" opacity="0.2" stroke="none" />
    <path d="M12 6.5l1.3 2.6 2.9.4-2.1 2 .5 2.9L12 12.8l-2.6 1.6.5-2.9-2.1-2 2.9-.4z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('landing-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [step, setStep] = useState(0);

  useEffect(() => {
    document.title = "Suri's Lab";
    const timers = [
      setTimeout(() => setStep(1), 100),   // brand pill
      setTimeout(() => setStep(2), 350),   // title
      setTimeout(() => setStep(3), 650),   // tagline
      setTimeout(() => setStep(4), 900),   // card 1
      setTimeout(() => setStep(5), 1100),  // card 2
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  useEffect(() => {
    localStorage.setItem('landing-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className={`landing-page ${theme}`}>
      <div className="landing-grid-bg" />
      <div className="landing-orb orb-ps" />
      <div className="landing-orb orb-mt" />

      <button
        className="landing-theme-toggle"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className="landing-content">
        <div className={`landing-brand-pill ${step >= 1 ? 'visible' : ''}`}>
          ✨ Suri&apos;s Lab
        </div>

        <h1 className={`landing-title ${step >= 2 ? 'visible' : ''}`}>
          Tools for<br />Curious Minds
        </h1>

        <p className={`landing-tagline ${step >= 3 ? 'visible' : ''}`}>
          A growing collection of apps to help people think, ask, and learn from the best.
        </p>

        <div className="landing-cards">
          <div
            className={`landing-card card-ps ${step >= 4 ? 'visible' : ''}`}
            onClick={() => navigate('/problem-solver')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/problem-solver')}
          >
            <div className="landing-icon-box icon-ps">
              <ProblemSolverIcon />
            </div>
            <div className="landing-card-name">Problem Solver</div>
            <div className="landing-card-desc">Drop your worry in</div>
            <span className="landing-enter-btn btn-ps">Explore →</span>
          </div>

          <div
            className={`landing-card card-mt ${step >= 5 ? 'visible' : ''}`}
            onClick={() => window.open('http://localhost:9999/', '_blank')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && window.open('http://localhost:9999/', '_blank')}
          >
            <div className="landing-icon-box icon-mt">
              <MentorTableIcon />
            </div>
            <div className="landing-card-name">Mentor Table</div>
            <div className="landing-card-desc">Chat with great minds</div>
            <span className="landing-enter-btn btn-mt">Explore →</span>
          </div>
        </div>
      </div>

      <button
        className="landing-admin-btn"
        onClick={() => navigate('/admin/login')}
        title="Admin"
      >
        <FontAwesomeIcon icon={faCrown} />
      </button>
    </div>
  );
};

export default LandingPage;
