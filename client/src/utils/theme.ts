/* ============================================================
   HeggyVerse — Theme tokens (JS mirror of variables.css)
   Orange #FFA646 / Teal #33A9AC / Red-Orange #F86041 / Magenta #982062 / Deep #343779
   ============================================================ */

export const theme = {
  colors: {
    primary: '#FFA646',
    primaryHover: '#F59A33',
    primaryActive: '#F86041',
    secondary: '#33A9AC',
    secondaryHover: '#2C999C',
    secondaryActive: '#23787B',
    accent: '#F86041',
    accentHover: '#E85536',
    accentActive: '#C94A2E',
    magenta: '#982062',
    magentaLight: '#C13A85',
    deep: '#343779',
    bg: '#121212',
    bgElevated: '#1E1E1E',
    bgCard: '#1E1E1E',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E0E0',
    textTertiary: '#9E9E9E',
    border: '#424242',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  },
  spacing: {
    base: 8,
    section: 64,
    component: 24,
    gutter: 24,
    containerMax: 1200,
  },
  typography: {
    scale: [12, 14, 16, 20, 24, 32, 48, 64],
    fontArabic: "'Cairo', sans-serif",
    fontEnglish: "'Inter', sans-serif",
  },
  radius: {
    input: 6,
    button: 8,
    card: 12,
    modal: 16,
  },
  shadows: {
    card: '0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
  },
} as const;

export type Theme = typeof theme;
export default theme;
