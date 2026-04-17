import React from 'react';
import { useTheme } from '../../hooks/useTheme';

const ThemeModeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  const nextMode = isDark ? 'light' : 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setMode(nextMode)}
      style={{
        position: 'fixed',
        right: 68,
        bottom: 12,
        zIndex: 9999,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: isDark
          ? 'rgba(18, 20, 34, 0.92)'
          : 'rgba(255, 255, 255, 0.96)',
        border: `1px solid ${isDark ? 'rgba(91, 123, 250, 0.4)' : 'rgba(0, 0, 0, 0.12)'}`,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.25)',
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
      title={label}
      aria-label={label}
    >
      <span role="img" aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
    </button>
  );
};

export default ThemeModeToggle;
