import React, { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES, ThemeId, ThemeMode } from '../../hooks/useTheme';

const ThemePicker: React.FC = () => {
  const { themeId, setTheme, mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const themeList = Object.values(THEMES);

  return (
    <div
      ref={containerRef}
      className="theme-picker-fixed"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 9999,
      }}
    >
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 60,
            background: mode === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(18, 20, 34, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(91, 123, 250, 0.25)'}`,
            borderRadius: 12,
            padding: 12,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            minWidth: 200,
          }}
        >
          {/* Light/Dark toggle */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 12,
              padding: 4,
              background: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
              borderRadius: 8,
            }}
          >
            {(['light', 'dark'] as ThemeMode[]).map((m) => {
              const isActive = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    background: isActive ? 'var(--primary-color)' : 'transparent',
                    color: isActive ? '#ffffff' : (mode === 'light' ? '#374151' : '#e8ebf5'),
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              );
            })}
          </div>
          <div
            style={{
              color: mode === 'light' ? '#374151' : '#e8ebf5',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            主题色 · Theme
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {themeList.map((theme) => {
              const isActive = theme.id === themeId;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id as ThemeId);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: isActive ? 'color-mix(in srgb, var(--primary-color) 18%, transparent)' : 'transparent',
                    border: isActive ? '1px solid color-mix(in srgb, var(--primary-color) 40%, transparent)' : '1px solid transparent',
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: mode === 'light' ? '#374151' : '#e8ebf5',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${theme.aurora[0]}, ${theme.aurora[1]}, ${theme.aurora[2]})`,
                      boxShadow: `0 0 12px ${theme.swatch}66`,
                      flexShrink: 0,
                    }}
                  />
                  <span>{theme.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${THEMES[themeId].aurora[0]}, ${THEMES[themeId].aurora[1]}, ${THEMES[themeId].aurora[2]})`,
          border: '1px solid rgba(91, 123, 250, 0.4)',
          cursor: 'pointer',
          boxShadow: `0 4px 20px ${THEMES[themeId].swatch}55, 0 2px 8px rgba(0, 0, 0, 0.4)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Change theme"
        aria-label="Change theme color"
        aria-expanded={open}
      >
        <span role="img" aria-hidden="true">🎨</span>
      </button>
    </div>
  );
};

export default ThemePicker;
