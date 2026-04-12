import { renderHook, act } from '@testing-library/react';
import { useTheme, THEMES, type ThemeId, type ThemeMode } from '../useTheme';

const STORAGE_KEY = 'anoncafe_theme';
const MODE_KEY = 'anoncafe_theme_mode';

beforeEach(() => {
  localStorage.clear();
  // Reset CSS custom properties
  const root = document.documentElement;
  root.style.cssText = '';
  delete root.dataset.themeMode;
});

describe('useTheme', () => {
  describe('defaults', () => {
    it('returns blue theme and dark mode when localStorage is empty', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeId).toBe('blue');
      expect(result.current.mode).toBe('dark');
      expect(result.current.theme).toBe(THEMES.blue);
    });
  });

  describe('localStorage persistence', () => {
    it('reads stored theme from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'purple');
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeId).toBe('purple');
      expect(result.current.theme).toBe(THEMES.purple);
    });

    it('reads stored mode from localStorage', () => {
      localStorage.setItem(MODE_KEY, 'light');
      const { result } = renderHook(() => useTheme());
      expect(result.current.mode).toBe('light');
    });

    it('falls back to blue for invalid stored theme', () => {
      localStorage.setItem(STORAGE_KEY, 'nonexistent');
      const { result } = renderHook(() => useTheme());
      expect(result.current.themeId).toBe('blue');
    });

    it('falls back to dark for invalid stored mode', () => {
      localStorage.setItem(MODE_KEY, 'invalid');
      const { result } = renderHook(() => useTheme());
      expect(result.current.mode).toBe('dark');
    });

    it('saves theme to localStorage when changed', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setTheme('forest');
      });
      expect(localStorage.getItem(STORAGE_KEY)).toBe('forest');
    });

    it('saves mode to localStorage when changed', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setMode('light');
      });
      expect(localStorage.getItem(MODE_KEY)).toBe('light');
    });
  });

  describe('setTheme', () => {
    it('updates themeId and theme object', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setTheme('teal');
      });
      expect(result.current.themeId).toBe('teal');
      expect(result.current.theme).toBe(THEMES.teal);
    });

    it.each(['blue', 'purple', 'teal', 'sunset', 'forest'] as ThemeId[])(
      'can set theme to %s',
      (id) => {
        const { result } = renderHook(() => useTheme());
        act(() => {
          result.current.setTheme(id);
        });
        expect(result.current.themeId).toBe(id);
        expect(result.current.theme.id).toBe(id);
      }
    );
  });

  describe('setMode', () => {
    it('switches from dark to light', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setMode('light');
      });
      expect(result.current.mode).toBe('light');
    });

    it('switches from light to dark', () => {
      localStorage.setItem(MODE_KEY, 'light');
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setMode('dark');
      });
      expect(result.current.mode).toBe('dark');
    });
  });

  describe('CSS custom properties', () => {
    it('applies theme colors to document root on mount', () => {
      renderHook(() => useTheme());
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--primary')).toBe(THEMES.blue.primary);
      expect(root.style.getPropertyValue('--primary-dark')).toBe(THEMES.blue.primaryDark);
      expect(root.style.getPropertyValue('--primary-light')).toBe(THEMES.blue.primaryLight);
      expect(root.style.getPropertyValue('--color-primary')).toBe(THEMES.blue.primary);
      expect(root.style.getPropertyValue('--color-primary-dark')).toBe(THEMES.blue.primaryDark);
      expect(root.style.getPropertyValue('--border-focus')).toBe(THEMES.blue.primary);
      expect(root.style.getPropertyValue('--primary-color')).toBe(THEMES.blue.primary);
    });

    it('sets data-theme-mode on document root', () => {
      renderHook(() => useTheme());
      expect(document.documentElement.dataset.themeMode).toBe('dark');
    });

    it('updates CSS when theme changes', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setTheme('sunset');
      });
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--primary')).toBe(THEMES.sunset.primary);
      expect(root.style.getPropertyValue('--primary-dark')).toBe(THEMES.sunset.primaryDark);
    });

    it('updates data-theme-mode when mode changes', () => {
      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setMode('light');
      });
      expect(document.documentElement.dataset.themeMode).toBe('light');
    });
  });

  describe('cross-component sync via CustomEvent', () => {
    it('dispatches themeChange event when theme changes', () => {
      const handler = vi.fn();
      window.addEventListener('themeChange', handler);

      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setTheme('purple');
      });

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[handler.mock.calls.length - 1][0] as CustomEvent;
      expect(event.detail.themeId).toBe('purple');

      window.removeEventListener('themeChange', handler);
    });

    it('dispatches themeChange event when mode changes', () => {
      const handler = vi.fn();
      window.addEventListener('themeChange', handler);

      const { result } = renderHook(() => useTheme());
      act(() => {
        result.current.setMode('light');
      });

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[handler.mock.calls.length - 1][0] as CustomEvent;
      expect(event.detail.mode).toBe('light');

      window.removeEventListener('themeChange', handler);
    });

    it('syncs themeId when receiving themeChange from another component', () => {
      const { result } = renderHook(() => useTheme());

      // Simulate external event
      act(() => {
        window.dispatchEvent(
          new CustomEvent('themeChange', { detail: { themeId: 'forest', mode: 'dark' } })
        );
      });

      expect(result.current.themeId).toBe('forest');
    });

    it('syncs mode when receiving themeChange from another component', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        window.dispatchEvent(
          new CustomEvent('themeChange', { detail: { themeId: 'blue', mode: 'light' } })
        );
      });

      expect(result.current.mode).toBe('light');
    });

    it('ignores themeChange with invalid themeId', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        window.dispatchEvent(
          new CustomEvent('themeChange', { detail: { themeId: 'invalid' } })
        );
      });

      expect(result.current.themeId).toBe('blue');
    });

    it('ignores themeChange with invalid mode', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        window.dispatchEvent(
          new CustomEvent('themeChange', { detail: { mode: 'invalid' } })
        );
      });

      expect(result.current.mode).toBe('dark');
    });
  });

  describe('THEMES constant', () => {
    it('has exactly 5 themes', () => {
      expect(Object.keys(THEMES)).toHaveLength(5);
    });

    it('contains all expected theme ids', () => {
      expect(Object.keys(THEMES).sort()).toEqual(['blue', 'forest', 'purple', 'sunset', 'teal']);
    });

    it('each theme has required properties', () => {
      for (const theme of Object.values(THEMES)) {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('swatch');
        expect(theme).toHaveProperty('aurora');
        expect(theme).toHaveProperty('primary');
        expect(theme).toHaveProperty('primaryDark');
        expect(theme).toHaveProperty('primaryLight');
        expect(theme.aurora).toHaveLength(3);
      }
    });
  });
});
