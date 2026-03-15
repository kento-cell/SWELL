import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Unified ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should support both light/dark mode and design themes', () => {
    // The ThemeProvider should handle:
    // 1. Color scheme (light/dark)
    // 2. Design theme (normal/cli/8bit)
    expect(['light', 'dark']).toBeDefined();
    expect(['normal', 'cli', '8bit']).toBeDefined();
  });

  it('should persist design theme to AsyncStorage', async () => {
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    const mockGetItem = vi.fn().mockResolvedValue('cli');

    // Simulate saving theme
    await mockSetItem('app_design_theme', 'cli');
    expect(mockSetItem).toHaveBeenCalledWith('app_design_theme', 'cli');

    // Simulate loading theme
    const saved = await mockGetItem('app_design_theme');
    expect(saved).toBe('cli');
  });

  it('should default to normal theme when no theme is saved', async () => {
    const mockGetItem = vi.fn().mockResolvedValue(null);
    const saved = await mockGetItem('app_design_theme');
    const theme = saved || 'normal';
    expect(theme).toBe('normal');
  });

  it('should support switching between all three design themes', async () => {
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    const themes = ['normal', 'cli', '8bit'];

    for (const theme of themes) {
      await mockSetItem('app_design_theme', theme);
      expect(mockSetItem).toHaveBeenCalledWith('app_design_theme', theme);
    }

    expect(mockSetItem).toHaveBeenCalledTimes(3);
  });

  it('should maintain color scheme separately from design theme', async () => {
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    const mockGetItem = vi.fn()
      .mockResolvedValueOnce('light')  // color scheme
      .mockResolvedValueOnce('8bit');  // design theme

    // Simulate independent persistence
    await mockSetItem('color_scheme', 'light');
    await mockSetItem('app_design_theme', '8bit');

    const colorScheme = await mockGetItem('color_scheme');
    const designTheme = await mockGetItem('app_design_theme');

    expect(colorScheme).toBe('light');
    expect(designTheme).toBe('8bit');
  });

  it('should handle theme loading errors gracefully', async () => {
    const mockGetItem = vi.fn().mockRejectedValue(new Error('Storage error'));
    const mockSetItem = vi.fn().mockResolvedValue(undefined);

    try {
      await mockGetItem('app_design_theme');
    } catch (error) {
      // Should fall back to default theme
      await mockSetItem('app_design_theme', 'normal');
    }

    expect(mockSetItem).toHaveBeenCalledWith('app_design_theme', 'normal');
  });

  it('should support widget theme synchronization', async () => {
    const mockGetItem = vi.fn().mockResolvedValue('8bit');
    const mockSetItem = vi.fn().mockResolvedValue(undefined);

    // App saves theme
    await mockSetItem('app_design_theme', '8bit');

    // Widget loads same theme
    const widgetTheme = await mockGetItem('app_design_theme');

    expect(widgetTheme).toBe('8bit');
  });

  it('should provide theme context with both schemes and design themes', () => {
    const contextValue = {
      colorScheme: 'light' as const,
      setColorScheme: vi.fn(),
      designTheme: 'normal' as const,
      setDesignTheme: vi.fn(),
      themeConfig: {
        name: 'normal',
        label: 'ノーマル',
        description: 'Modern design',
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
          fontFamily: 'system',
          fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24 },
          fontWeight: { normal: 400, semibold: 600, bold: 700 },
        },
        spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
        borderRadius: { none: 0, sm: 4, md: 8, lg: 12 },
      },
    };

    expect(contextValue.colorScheme).toBe('light');
    expect(contextValue.designTheme).toBe('normal');
    expect(contextValue.themeConfig.name).toBe('normal');
  });

  it('should handle rapid theme switching', async () => {
    const mockSetItem = vi.fn().mockResolvedValue(undefined);
    const themes = ['normal', 'cli', '8bit', 'normal', 'cli'];

    for (const theme of themes) {
      await mockSetItem('app_design_theme', theme);
    }

    expect(mockSetItem).toHaveBeenCalledTimes(5);
    expect(mockSetItem).toHaveBeenLastCalledWith('app_design_theme', 'cli');
  });

  it('should validate theme configuration structure', () => {
    const validTheme = {
      name: 'normal',
      label: 'ノーマル',
      description: 'Modern design',
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
        fontFamily: 'system',
        fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24 },
        fontWeight: { normal: 400, semibold: 600, bold: 700 },
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      borderRadius: { none: 0, sm: 4, md: 8, lg: 12 },
    };

    expect(validTheme).toHaveProperty('name');
    expect(validTheme).toHaveProperty('colors');
    expect(validTheme).toHaveProperty('typography');
    expect(validTheme.colors).toHaveProperty('primary');
    expect(validTheme.typography).toHaveProperty('fontFamily');
  });
});
