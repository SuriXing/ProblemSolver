import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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

/**
 * A1.1 focus restoration: SPA route changes don't move focus by default, so
 * screen-reader users stay on the old page's focused element and AT never
 * announces the new route. On every pathname change we (1) scroll to top,
 * (2) move focus to <main>, and (3) emit an aria-live announcement so the
 * page is verbally surfaced without stealing visible focus state.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus();
    if (announceRef.current) {
      // Small timeout so AT treats this as a fresh announcement
      announceRef.current.textContent = '';
      const title = document.title || 'Page loaded';
      setTimeout(() => {
        if (announceRef.current) announceRef.current.textContent = title;
      }, 50);
    }
  }, [location.pathname]);

  return (
    <div className="layout">
      <Aurora colorStops={theme.aurora} amplitude={1.0} blend={0.5} />
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="main-content"
        style={{ outline: 'none' }}
      >
        {children}
      </main>
      <div
        ref={announceRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
      <Footer />
      <AccessCodeNotebook />
      <ThemePicker />
      <ThemeModeToggle />
    </div>
  );
};

export default Layout;