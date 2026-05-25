import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransitionDurations, prefersReducedMotion } from '../utils/transitions';

/**
 * Singleton navigation lock — addresses defect #3 (race condition).
 * Without a shared lock, each click handler keeps its own `isExiting` state,
 * so card+crown+lang-toggle within the same frame all fire navigate().
 *
 * Defect #2: useExitNavigate returns a function that plays the exit animation
 * and then navigates, so back-navigation buttons can replay the same animation.
 *
 * Defect #4: prefers-reduced-motion → navigate immediately, no setTimeout, no
 * exit class.
 *
 * Defect #7: duration comes from CSS custom property, not hardcoded.
 *
 * Browser back button trade-off: HashRouter doesn't expose a reliable
 * pre-navigation hook (popstate fires after the URL has already changed),
 * so we DO NOT intercept browser back. The destination still plays its
 * `.page-fade-in` enter animation; only the exit phase is skipped on
 * browser-back. This is documented and accepted.
 */

interface NavigationLockContextValue {
  isExiting: boolean;
  exitClassName: string;
  navigateWithExit: (path: string, options?: { fast?: boolean }) => void;
}

const NavigationLockContext = createContext<NavigationLockContextValue | null>(null);

export const NavigationLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [exitClassName, setExitClassName] = useState('');
  const lockedRef = useRef(false);

  const navigateWithExit = useCallback(
    (path: string, options?: { fast?: boolean }) => {
      if (lockedRef.current) return;
      lockedRef.current = true;

      // Reduced-motion: hard-cut, no animation, no setTimeout. Must be <150ms.
      if (prefersReducedMotion()) {
        navigate(path);
        // release lock on next tick so React Router can settle
        window.setTimeout(() => {
          lockedRef.current = false;
        }, 0);
        return;
      }

      const durations = getTransitionDurations();
      const ms = options?.fast ? durations.adminMs : durations.exitMs;
      const className = options?.fast ? 'page-fast-exit' : 'home-page-exit';

      setExitClassName(className);
      setIsExiting(true);

      window.setTimeout(() => {
        navigate(path);
        // clear class after navigation; destination will mount and play its
        // own .page-fade-in. Reset state for next navigation back to home.
        setIsExiting(false);
        setExitClassName('');
      }, ms);

      // T-1: hold the lock for the FULL exit+enter window so that any clicks
      // landing during the destination's enter animation cannot retrigger
      // navigation (which previously caused router-back to "/").
      window.setTimeout(() => {
        lockedRef.current = false;
      }, ms + durations.enterMs);
    },
    [navigate]
  );

  return (
    <NavigationLockContext.Provider value={{ isExiting, exitClassName, navigateWithExit }}>
      {children}
    </NavigationLockContext.Provider>
  );
};

export const useExitNavigate = () => {
  const ctx = useContext(NavigationLockContext);
  if (!ctx) {
    throw new Error('useExitNavigate must be used within a NavigationLockProvider');
  }
  return ctx;
};
