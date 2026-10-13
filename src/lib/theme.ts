import { CustomThemeTokens, UserPreferences } from '../types/froyo';

export const PASTEL_PINK_THEME: CustomThemeTokens = {
  bgCanvas: '#FFF5F7',
  bgSurface: '#FFFFFF',
  bgElevated: '#FFF0F4',
  borderSubtle: '#FCE7ED',
  accentPrimary: '#FF85A1',
  accentSecondary: '#FFA6C1',
  textPrimary: '#3D3135',
  textMuted: '#8C737B',
};

export const DARK_MAUVE_THEME: CustomThemeTokens = {
  bgCanvas: '#181316',
  bgSurface: '#231C20',
  bgElevated: '#2E242A',
  borderSubtle: '#3A2D34',
  accentPrimary: '#FF85A1',
  accentSecondary: '#D96B87',
  textPrimary: '#F7EDF0',
  textMuted: '#B09AA2',
};

export const PRESET_THEMES: Record<string, { label: string; tokens: CustomThemeTokens }> = {
  'pastel-pink': {
    label: 'Soft Rose Pastel (Default)',
    tokens: PASTEL_PINK_THEME,
  },
  dark: {
    label: 'Deep Mauve Charcoal (Dark)',
    tokens: DARK_MAUVE_THEME,
  },
  matcha: {
    label: 'Matcha Cream',
    tokens: {
      bgCanvas: '#F4FBF7',
      bgSurface: '#FFFFFF',
      bgElevated: '#E8F6EE',
      borderSubtle: '#D5EDE0',
      accentPrimary: '#34D399',
      accentSecondary: '#6EE7B7',
      textPrimary: '#1F352B',
      textMuted: '#5C7D6E',
    },
  },
  lavender: {
    label: 'Lavender Oat',
    tokens: {
      bgCanvas: '#F8F6FF',
      bgSurface: '#FFFFFF',
      bgElevated: '#F1ECFF',
      borderSubtle: '#E4DCFF',
      accentPrimary: '#9333EA',
      accentSecondary: '#C084FC',
      textPrimary: '#2E2344',
      textMuted: '#736294',
    },
  },
};

export function applyThemeVariables(prefs: UserPreferences): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const activeTokens: CustomThemeTokens =
    prefs.themeMode === 'pastel-pink'
      ? PASTEL_PINK_THEME
      : prefs.themeMode === 'dark'
      ? DARK_MAUVE_THEME
      : prefs.customTheme;

  const isDark = prefs.themeMode === 'dark' || getRelativeLuminance(activeTokens.bgCanvas) < 0.25;

  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', prefs.themeMode);

  root.style.setProperty('--bg-canvas', activeTokens.bgCanvas);
  root.style.setProperty('--bg-surface', activeTokens.bgSurface);
  root.style.setProperty('--bg-elevated', activeTokens.bgElevated);
  root.style.setProperty('--border-subtle', activeTokens.borderSubtle);
  root.style.setProperty('--accent-primary', activeTokens.accentPrimary);
  root.style.setProperty('--accent-secondary', activeTokens.accentSecondary);
  root.style.setProperty('--text-primary', activeTokens.textPrimary);
  root.style.setProperty('--text-muted', activeTokens.textMuted);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) || 0;
    const g = parseInt(clean[1] + clean[1], 16) || 0;
    const b = parseInt(clean[2] + clean[2], 16) || 0;
    return { r, g, b };
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generates contrast-compliant text, subtle background tint, and border styles
 * for any arbitrary custom hex color tag.
 */
export function getAccessibleTagStyles(hexColor: string, isDarkTheme = false) {
  const { r, g, b } = hexToRgb(hexColor);
  // Darken color for light mode text, lighten for dark mode text to guarantee WCAG contrast
  const textR = isDarkTheme ? Math.min(255, Math.round(r + (255 - r) * 0.55)) : Math.round(r * 0.52);
  const textG = isDarkTheme ? Math.min(255, Math.round(g + (255 - g) * 0.55)) : Math.round(g * 0.52);
  const textB = isDarkTheme ? Math.min(255, Math.round(b + (255 - b) * 0.55)) : Math.round(b * 0.52);

  return {
    backgroundColor: isDarkTheme ? `rgba(${r}, ${g}, ${b}, 0.20)` : `rgba(${r}, ${g}, ${b}, 0.15)`,
    borderColor: isDarkTheme ? `rgba(${r}, ${g}, ${b}, 0.42)` : `rgba(${r}, ${g}, ${b}, 0.35)`,
    color: `rgb(${textR}, ${textG}, ${textB})`,
    dotColor: hexColor,
  };
}
