import { useEffect, useState } from 'react';

export type ThemeId = 'blue' | 'purple' | 'teal' | 'sunset' | 'forest';
export type ThemeMode = 'dark' | 'light';

interface Theme {
  id: ThemeId;
  name: string;
  swatch: string;
  aurora: [string, string, string];
  primary: string;
  primaryDark: string;
  primaryLight: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  blue: {
    id: 'blue',
    name: '深蓝 · Dark Blue',
    swatch: '#4360D3',
    aurora: ['#1a2a6c', '#5B7BFA', '#4A90FA'],
    primary: '#4360D3',
    primaryDark: '#3149a8',
    primaryLight: '#8A9FFC',
  },
  purple: {
    id: 'purple',
    name: '暗紫 · Dark Purple',
    swatch: '#9F6BFF',
    aurora: ['#3a1a6c', '#9F6BFF', '#C084FC'],
    primary: '#9F6BFF',
    primaryDark: '#7C3AED',
    primaryLight: '#C4A6FF',
  },
  teal: {
    id: 'teal',
    name: '深青 · Dark Teal',
    swatch: '#2DD4BF',
    aurora: ['#0a3a3a', '#2DD4BF', '#14B8A6'],
    primary: '#2DD4BF',
    primaryDark: '#0D9488',
    primaryLight: '#5EEAD4',
  },
  sunset: {
    id: 'sunset',
    name: '夕阳 · Dark Sunset',
    swatch: '#FB7185',
    aurora: ['#6c1a3a', '#FB7185', '#FBBF24'],
    primary: '#FB7185',
    primaryDark: '#E11D48',
    primaryLight: '#FDA4AF',
  },
  forest: {
    id: 'forest',
    name: '暗林 · Dark Forest',
    swatch: '#4ADE80',
    aurora: ['#0a3a1a', '#4ADE80', '#22C55E'],
    primary: '#4ADE80',
    primaryDark: '#16A34A',
    primaryLight: '#86EFAC',
  },
};

const STORAGE_KEY = 'anoncafe_theme';
const MODE_KEY = 'anoncafe_theme_mode';
const DEFAULT_THEME: ThemeId = 'blue';
const DEFAULT_MODE: ThemeMode = 'dark';

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in THEMES) return stored as ThemeId;
  } catch {
    // localStorage unavailable, fall through
  }
  return DEFAULT_THEME;
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // ignore
  }
  return DEFAULT_MODE;
}

function applyThemeToRoot(theme: Theme, mode: ThemeMode) {
  const root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-dark', theme.primaryDark);
  root.style.setProperty('--primary-light', theme.primaryLight);
  root.style.setProperty('--primary-color', theme.primary);
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-dark', theme.primaryDark);
  root.style.setProperty('--border-focus', theme.primary);
  root.dataset.themeMode = mode;
}

export function useTheme() {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => readStoredTheme());
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());

  useEffect(() => {
    applyThemeToRoot(THEMES[themeId], mode);
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // ignore
    }
    window.dispatchEvent(
      new CustomEvent('themeChange', { detail: { themeId, mode } })
    );
  }, [themeId, mode]);

  // Listen for theme changes from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ themeId?: ThemeId; mode?: ThemeMode }>;
      const detail = custom.detail || {};
      if (detail.themeId && detail.themeId !== themeId && detail.themeId in THEMES) {
        setThemeIdState(detail.themeId);
      }
      if (detail.mode && detail.mode !== mode && (detail.mode === 'light' || detail.mode === 'dark')) {
        setModeState(detail.mode);
      }
    };
    window.addEventListener('themeChange', handler);
    return () => window.removeEventListener('themeChange', handler);
  }, [themeId, mode]);

  return {
    theme: THEMES[themeId],
    themeId,
    setTheme: setThemeIdState,
    mode,
    setMode: setModeState,
  };
}
