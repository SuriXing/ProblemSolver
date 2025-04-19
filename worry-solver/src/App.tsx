import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './assets/css/index.css';
import './utils/i18n'; // Initialize i18n
import { useTypeSafeTranslation } from './utils/translationHelper';
import HomePage from './components/pages/HomePage';
import HelpPage from './components/pages/HelpPage';
import ConfessionPage from './components/pages/ConfessionPage';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const { i18n } = useTypeSafeTranslation();
  const [isLoading, setIsLoading] = useState(true);

  // Initialize the app
  useEffect(() => {
    // Add loaded class to body for fade-in transition
    document.body.classList.add('loaded');
    
    // Set up i18n
    const savedLanguage = localStorage.getItem('language') || 'zh-CN';
    i18n.changeLanguage(savedLanguage).then(() => {
      console.log('i18n initialized with language:', savedLanguage);
      setIsLoading(false);
    });

    return () => {
      document.body.classList.remove('loaded');
    };
  }, [i18n]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="App" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#4f7cff' }}>
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <h1 style={{ 
          fontSize: '1.5rem', 
          color: '#374151', 
          marginBottom: '0.5rem'
        }}>解忧杂货铺 - Worry Solver</h1>
        <p style={{ color: '#6b7280' }}>Application is loading...</p>
      </div>
    );
  }

  return (
    <UserProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/confession" element={<ConfessionPage />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </UserProvider>
  );
};

export default App;
