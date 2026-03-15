import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'mono';
type TextColor = 'primary' | 'secondary' | 'muted' | 'accent' | 'error' | 'success';

interface PixelTextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  style?: TextStyle;
  numberOfLines?: number;
}

const VARIANT_STYLES: Record<TextVariant, TextStyle> = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 1,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0.5,
  },
  h3: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  mono: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
};

/**
 * Pixel-art style text component that adapts to the current theme
 */
export function PixelText({
  children,
  variant = 'body',
  color = 'primary',
  style,
  numberOfLines,
}: PixelTextProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  // Map color tokens to theme colors
  const getColor = (c: TextColor): string => {
    switch (c) {
      case 'primary': return tc.foreground;
      case 'secondary': return tc.muted;
      case 'muted': return tc.muted;
      case 'accent': return tc.primary;
      case 'error': return tc.error;
      case 'success': return tc.success;
      default: return tc.foreground;
    }
  };

  const variantStyle = VARIANT_STYLES[variant];
  const textColor = getColor(color);

  return (
    <Text
      style={[
        styles.text,
        { fontFamily: themeConfig.typography.fontFamily },
        variantStyle,
        { color: textColor },
        style,
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'monospace',
  },
});
