/**
 * Single source of truth for transition timing — reads CSS custom properties
 * from :root so JS and CSS never drift apart. Defined in src/styles/transitions.css.
 */

const parseMs = (raw: string, fallback: number): number => {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (trimmed.endsWith('ms')) {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? n : fallback;
  }
  if (trimmed.endsWith('s')) {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? n * 1000 : fallback;
  }
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? n : fallback;
};

export interface TransitionDurations {
  exitMs: number;
  enterMs: number;
  adminMs: number;
}

export const getTransitionDurations = (): TransitionDurations => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { exitMs: 500, enterMs: 1400, adminMs: 200 };
  }
  const styles = getComputedStyle(document.documentElement);
  return {
    exitMs: parseMs(styles.getPropertyValue('--transition-exit-ms'), 500),
    enterMs: parseMs(styles.getPropertyValue('--transition-enter-ms'), 1400),
    adminMs: parseMs(styles.getPropertyValue('--transition-admin-ms'), 200),
  };
};

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
