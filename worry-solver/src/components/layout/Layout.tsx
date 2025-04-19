import React, { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Add loaded class to body for fade-in effect
  useEffect(() => {
    document.body.classList.add('loaded');
    
    return () => {
      document.body.classList.remove('loaded');
    };
  }, []);
  
  return (
    <div className="app">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default Layout; 