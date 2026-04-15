import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AccessCodeNotebook from '../pages/AccessCodeNotebook';
import Aurora from '../shared/Aurora';
import ThemePicker from '../shared/ThemePicker';
import ThemeModeToggle from '../shared/ThemeModeToggle';
import { useTheme } from '../../hooks/useTheme';
import '../../styles/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="layout">
      <Aurora colorStops={theme.aurora} amplitude={1.0} blend={0.5} />
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
      <AccessCodeNotebook />
      <ThemePicker />
      <ThemeModeToggle />
    </div>
  );
};

export default Layout; 