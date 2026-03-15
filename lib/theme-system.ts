/**
 * Theme System for Swell
 * Supports 3 design themes: Normal, CLI, 8bit
 */

export type ThemeType = 'normal' | 'cli' | '8bit';

export interface ThemeConfig {
  name: ThemeType;
  label: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
    foreground: string;
    muted: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
    };
    fontWeight: {
      normal: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
  };
}

/**
 * Normal Theme - Modern, Clean Design
 */
export const normalTheme: ThemeConfig = {
  name: 'normal',
  label: 'ノーマル',
  description: '洗練されたモダンデザイン',
  colors: {
    primary: '#3B82F6',
    background: '#0F172A',
    surface: '#1E293B',
    foreground: '#F1F5F9',
    muted: '#94A3B8',
    border: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    fontWeight: {
      normal: 400,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
  },
};

/**
 * CLI Theme - Terminal/Command Line Interface Style
 */
export const cliTheme: ThemeConfig = {
  name: 'cli',
  label: 'CLI',
  description: 'ターミナル風テキストベース',
  colors: {
    primary: '#00FF00',
    background: '#000000',
    surface: '#111111',
    foreground: '#00FF00',
    muted: '#666666',
    border: '#333333',
    success: '#00FF00',
    warning: '#FFFF00',
    error: '#FF0000',
  },
  typography: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
    },
    fontWeight: {
      normal: 400,
      semibold: 700,
      bold: 700,
    },
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  borderRadius: {
    none: 0,
    sm: 0,
    md: 0,
    lg: 0,
  },
};

/**
 * 8bit Theme - Retro Pixel Art Style (Famicom)
 */
export const eightbitTheme: ThemeConfig = {
  name: '8bit',
  label: '8bit',
  description: 'ポップなピクセルアート',
  colors: {
    primary: '#FF6B35',
    background: '#1A1A2E',
    surface: '#2D2D44',
    foreground: '#FFEB3B',
    muted: '#9E9E9E',
    border: '#FF6B35',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
  },
  typography: {
    fontFamily: '"Press Start 2P", "Courier New", monospace',
    fontSize: {
      xs: 8,
      sm: 10,
      base: 12,
      lg: 14,
      xl: 16,
      '2xl': 20,
    },
    fontWeight: {
      normal: 400,
      semibold: 700,
      bold: 700,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    none: 0,
    sm: 0,
    md: 0,
    lg: 0,
  },
};

/**
 * All available themes
 */
export const THEMES: Record<ThemeType, ThemeConfig> = {
  normal: normalTheme,
  cli: cliTheme,
  '8bit': eightbitTheme,
};

/**
 * Get theme by name
 */
export function getTheme(name: ThemeType): ThemeConfig {
  return THEMES[name] || normalTheme;
}

/**
 * Get all available themes
 */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}
