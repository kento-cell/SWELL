import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

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

const COLOR_MAP: Record<TextColor, string> = {
  primary: '#F0F0F0',     // Off-white
  secondary: '#8B8B8B',   // Medium gray
  muted: '#6B7280',       // Muted gray
  accent: '#E74C3C',      // Famicom Red
  error: '#C0392B',       // Dark Red
  success: '#27AE60',     // Famicom Green
};

/**
 * 8-bit Famicom style text component
 * Consistent typography with monospace font and pixel-perfect sizing
 */
export function PixelText({
  children,
  variant = 'body',
  color = 'primary',
  style,
  numberOfLines,
}: PixelTextProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const textColor = COLOR_MAP[color];

  return (
    <Text
      style={[
        styles.text,
        variantStyle,
        {
          color: textColor,
        },
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
