import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PixelButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; border: string; text: string; pressed: string }> = {
  primary: {
    bg: '#E74C3C',      // Famicom Red
    border: '#C0392B',  // Dark Red
    text: '#F0F0F0',    // Off-white
    pressed: '#C0392B',
  },
  secondary: {
    bg: '#2D2D44',      // Dark gray-blue
    border: '#3D3D5C',  // Darker border
    text: '#F0F0F0',
    pressed: '#3D3D5C',
  },
  danger: {
    bg: '#C0392B',      // Dark Red
    border: '#A93226',  // Darker red
    text: '#F0F0F0',
    pressed: '#A93226',
  },
  success: {
    bg: '#27AE60',      // Famicom Green
    border: '#1E8449',  // Dark Green
    text: '#F0F0F0',
    pressed: '#1E8449',
  },
};

const SIZE_STYLES: Record<ButtonSize, { padding: number; fontSize: number }> = {
  sm: { padding: 8, fontSize: 11 },
  md: { padding: 12, fontSize: 13 },
  lg: { padding: 16, fontSize: 14 },
};

/**
 * 8-bit Famicom style button component
 * Features pixel-perfect borders, no rounded corners, retro aesthetic
 */
export function PixelButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
  textStyle,
  icon,
}: PixelButtonProps) {
  const colors = VARIANT_COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? '#555555' : pressed ? colors.pressed : colors.bg,
          borderColor: disabled ? '#333333' : colors.border,
          paddingHorizontal: sizeStyle.padding,
          paddingVertical: sizeStyle.padding * 0.75,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            styles.label,
            {
              fontSize: sizeStyle.fontSize,
              color: disabled ? '#999999' : colors.text,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderRadius: 0, // Pixel perfect - no rounding
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 16,
    height: 16,
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
