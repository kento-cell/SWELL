import { describe, it, expect } from 'vitest';
import { getTheme, getAllThemes, THEMES, normalTheme, cliTheme, eightbitTheme } from '../theme-system';

describe('Theme System', () => {
  it('should return normal theme by default', () => {
    const theme = getTheme('normal');
    expect(theme.name).toBe('normal');
    expect(theme.colors.primary).toBe('#3B82F6');
  });

  it('should return CLI theme', () => {
    const theme = getTheme('cli');
    expect(theme.name).toBe('cli');
    expect(theme.colors.primary).toBe('#00FF00');
    expect(theme.typography.fontFamily).toContain('monospace');
  });

  it('should return 8bit theme', () => {
    const theme = getTheme('8bit');
    expect(theme.name).toBe('8bit');
    expect(theme.colors.primary).toBe('#FF6B35');
  });

  it('should return normal theme for invalid name', () => {
    const theme = getTheme('invalid' as any);
    expect(theme.name).toBe('normal');
  });

  it('should return all themes', () => {
    const themes = getAllThemes();
    expect(themes.length).toBe(3);
    expect(themes.map(t => t.name)).toContain('normal');
    expect(themes.map(t => t.name)).toContain('cli');
    expect(themes.map(t => t.name)).toContain('8bit');
  });

  it('should have consistent theme structure', () => {
    Object.values(THEMES).forEach(theme => {
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('label');
      expect(theme).toHaveProperty('description');
      expect(theme).toHaveProperty('colors');
      expect(theme).toHaveProperty('typography');
      expect(theme).toHaveProperty('spacing');
      expect(theme).toHaveProperty('borderRadius');
    });
  });

  it('should have valid color values', () => {
    Object.values(THEMES).forEach(theme => {
      const colors = theme.colors;
      expect(colors.primary).toBeTruthy();
      expect(colors.background).toBeTruthy();
      expect(colors.foreground).toBeTruthy();
    });
  });

  it('CLI theme should have monospace font', () => {
    expect(cliTheme.typography.fontFamily).toContain('monospace');
  });

  it('8bit theme should have pixel font', () => {
    expect(eightbitTheme.typography.fontFamily).toContain('Press Start');
  });

  it('Normal theme should have sans-serif font', () => {
    expect(normalTheme.typography.fontFamily).toContain('sans-serif');
  });
});
