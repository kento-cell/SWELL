import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface PixelCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outline';
  padding?: number;
  style?: ViewStyle;
}

/**
 * 8-bit Famicom style card component
 * Pixel-perfect borders, no rounded corners, retro aesthetic
 */
export function PixelCard({
  children,
  variant = 'default',
  padding = 16,
  style,
}: PixelCardProps) {
  const variantStyle = {
    default: styles.cardDefault,
    elevated: styles.cardElevated,
    outline: styles.cardOutline,
  }[variant];

  return (
    <View
      style={[
        styles.card,
        variantStyle,
        {
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0, // Pixel perfect
  },
  cardDefault: {
    backgroundColor: '#2D2D44',
    borderWidth: 2,
    borderColor: '#3D3D5C',
  },
  cardElevated: {
    backgroundColor: '#2D2D44',
    borderWidth: 3,
    borderColor: '#F0F0F0',
    // Simulate shadow with border effect
    borderTopColor: '#F0F0F0',
    borderLeftColor: '#F0F0F0',
    borderRightColor: '#1A1A2E',
    borderBottomColor: '#1A1A2E',
  },
  cardOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3D3D5C',
  },
});
