import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { useThemeContext } from '@/lib/theme-provider';

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

const SIZE_STYLES: Record<ButtonSize, { padding: number; fontSize: number }> = {
  sm: { padding: 8, fontSize: 11 },
  md: { padding: 12, fontSize: 13 },
  lg: { padding: 16, fontSize: 14 },
};

/**
 * Theme-aware button component
 * Adapts to Normal/CLI/8bit themes
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
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;
  const sizeStyle = SIZE_STYLES[size];

  // Map variant to theme colors
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: tc.primary, border: tc.primary, text: tc.background };
      case 'secondary':
        return { bg: tc.surface, border: tc.border, text: tc.foreground };
      case 'danger':
        return { bg: tc.error, border: tc.error, text: tc.background };
      case 'success':
        return { bg: tc.success, border: tc.success, text: tc.background };
    }
  };

  const colors = getColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? tc.muted : pressed ? tc.border : colors.bg,
          borderColor: disabled ? tc.border : colors.border,
          borderRadius: themeConfig.borderRadius.sm,
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
              color: disabled ? tc.background : colors.text,
              fontFamily: themeConfig.typography.fontFamily,
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
