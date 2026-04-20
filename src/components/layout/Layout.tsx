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
 * announces the new route. On every route change we (1) scroll to top,
 * (2) move focus to <main>, and (3) emit an aria-live announcement so the
 * page is verbally surfaced.
 *
 * A1.2 review fixes:
 * - Use location.key (changes on every nav) instead of pathname only — catches
 *   query/hash changes within the same route (e.g. ?tab=2).
 * - Track previous key via ref instead of an isFirstRender boolean so
 *   StrictMode's double-mount in dev doesn't flip the guard false on initial
 *   render and yank focus.
 * - Delay announcement to 300ms so page-level useEffects that set
 *   document.title have a chance to run first, avoiding the stale-title race.
 *   Cancel the pending timeout on re-nav so rapid navigation still announces
 *   the final page, not a dropped intermediate one.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const announceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastKeyRef.current === null) {
      lastKeyRef.current = location.key;
      return;
    }
    if (lastKeyRef.current === location.key) return;
    lastKeyRef.current = location.key;

    window.scrollTo(0, 0);
    mainRef.current?.focus();

    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
    }
    if (announceRef.current) {
      announceRef.current.textContent = '';
    }
    announceTimerRef.current = window.setTimeout(() => {
      if (announceRef.current) {
        announceRef.current.textContent = document.title || 'Page loaded';
      }
    }, 300);

    return () => {
      if (announceTimerRef.current !== null) {
        window.clearTimeout(announceTimerRef.current);
      }
    };
  }, [location.key]);

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