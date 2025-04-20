/**
 * Theme Constants for worry-solver
 * 
 * This file contains shared style variables to ensure visual consistency
 * with the original Problem_solver application.
 */

export const colors = {
  // Primary colors
  primary: '#5B7BFA',       // Main brand color
  primaryDark: '#4360D3',   // Darker version for hover states
  primaryLight: '#8A9FFC',  // Lighter version for backgrounds
  
  // Secondary colors
  secondary: '#FF6B6B',     // Secondary accent color
  secondaryDark: '#E95252', // Darker version for hover states
  secondaryLight: '#FF9E9E', // Lighter version for backgrounds
  
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F8F9FA',       // Lightest gray (backgrounds)
  gray200: '#E9ECEF',       // Light gray (borders)
  gray300: '#DEE2E6',       // Medium-light gray
  gray400: '#CED4DA',       // Medium gray
  gray500: '#ADB5BD',       // Medium-dark gray
  gray600: '#6C757D',       // Dark gray (secondary text)
  gray700: '#495057',       // Darker gray (main text)
  gray800: '#343A40',       // Very dark gray (headings)
  gray900: '#212529',       // Nearly black (emphasized text)
  
  // Semantic colors
  success: '#28A745',       // Success messages
  info: '#17A2B8',          // Information messages
  warning: '#FFC107',       // Warning messages
  danger: '#DC3545',        // Error messages
  
  // Category tag colors
  categoryRelationship: '#FF6B6B',  // Relationship
  categoryWork: '#36B9CC',          // Work/Career
  categoryHealth: '#4FD1C5',        // Health
  categoryPersonal: '#7B61FF',      // Personal Development
  categoryOther: '#6C757D',         // Other
};

export const typography = {
  // Font families
  fontFamily: {
    base: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    heading: "'Roboto', 'Helvetica Neue', Arial, sans-serif",
    monospace: "'Roboto Mono', 'Courier New', monospace",
  },
  
  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  
  // Font weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const spacing = {
  // Base unit is 0.25rem (4px)
  '0': '0',
  '1': '0.25rem',      // 4px
  '2': '0.5rem',       // 8px
  '3': '0.75rem',      // 12px
  '4': '1rem',         // 16px
  '5': '1.25rem',      // 20px
  '6': '1.5rem',       // 24px
  '8': '2rem',         // 32px
  '10': '2.5rem',      // 40px
  '12': '3rem',        // 48px
  '16': '4rem',        // 64px
  '20': '5rem',        // 80px
  '24': '6rem',        // 96px
  '32': '8rem',        // 128px
  '40': '10rem',       // 160px
  '48': '12rem',       // 192px
  '56': '14rem',       // 224px
  '64': '16rem',       // 256px
};

export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',    // 2px
    default: '0.25rem', // 4px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    full: '9999px',    // Full rounded (circle)
  },
  
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const transitions = {
  duration: {
    fast: '150ms',
    default: '300ms',
    slow: '500ms',
  },
  
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const breakpoints = {
  xs: '0px',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px',
  '2xl': '1400px',
};

export const mediaQueries = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
};

// Common component styles
export const componentStyles = {
  card: {
    borderRadius: borders.radius.lg,
    boxShadow: shadows.md,
    backgroundColor: colors.white,
    borderWidth: borders.width.thin,
    borderStyle: borders.style.solid,
    borderColor: colors.gray200,
    transition: `${transitions.duration.default} ${transitions.timing.easeInOut}`,
    hoverBoxShadow: shadows.lg,
  },
  
  button: {
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
      hoverBackgroundColor: colors.primaryDark,
      borderRadius: borders.radius.default,
      padding: `${spacing['2']} ${spacing['4']}`,
      fontWeight: typography.fontWeight.medium,
      transition: `${transitions.duration.fast} ${transitions.timing.easeInOut}`,
    },
    secondary: {
      backgroundColor: colors.secondary,
      color: colors.white,
      hoverBackgroundColor: colors.secondaryDark,
      borderRadius: borders.radius.default,
      padding: `${spacing['2']} ${spacing['4']}`,
      fontWeight: typography.fontWeight.medium,
      transition: `${transitions.duration.fast} ${transitions.timing.easeInOut}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.primary,
      borderColor: colors.primary,
      borderWidth: borders.width.thin,
      borderStyle: borders.style.solid,
      hoverBackgroundColor: colors.primaryLight,
      borderRadius: borders.radius.default,
      padding: `${spacing['2']} ${spacing['4']}`,
      fontWeight: typography.fontWeight.medium,
      transition: `${transitions.duration.fast} ${transitions.timing.easeInOut}`,
    },
  },
  
  input: {
    borderRadius: borders.radius.default,
    borderWidth: borders.width.thin,
    borderStyle: borders.style.solid,
    borderColor: colors.gray300,
    padding: `${spacing['2']} ${spacing['3']}`,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    backgroundColor: colors.white,
    focusBorderColor: colors.primary,
    focusBoxShadow: `0 0 0 3px rgba(91, 123, 250, 0.3)`,
    transition: `${transitions.duration.fast} ${transitions.timing.ease}`,
  },
  
  tag: {
    borderRadius: borders.radius.full,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
};

// Export all as a theme object
export const theme = {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  mediaQueries,
  componentStyles,
};

export default theme; 