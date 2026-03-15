import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useThemeContext } from '@/lib/theme-provider';

// Pixel padlock icon (larger version)
function PixelPadlock({ size = 48, color = '#A78BFA' }: { size?: number; color?: string }) {
  const p = Math.floor(size / 10);
  const shackle = [
    { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 0, c: 5 }, { r: 0, c: 6 },
    { r: 1, c: 2 }, { r: 1, c: 7 },
    { r: 2, c: 2 }, { r: 2, c: 7 },
    { r: 3, c: 2 }, { r: 3, c: 7 },
  ];
  const body = [
    { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 4, c: 5 }, { r: 4, c: 6 }, { r: 4, c: 7 }, { r: 4, c: 8 },
    { r: 5, c: 1 }, { r: 5, c: 8 },
    { r: 6, c: 1 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 8 },
    { r: 7, c: 1 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 8 },
    { r: 8, c: 1 }, { r: 8, c: 8 },
    { r: 9, c: 1 }, { r: 9, c: 2 }, { r: 9, c: 3 }, { r: 9, c: 4 }, { r: 9, c: 5 }, { r: 9, c: 6 }, { r: 9, c: 7 }, { r: 9, c: 8 },
  ];

  return (
    <Svg width={size} height={size}>
      {shackle.map((px, i) => (
        <Rect key={`s${i}`} x={px.c * p} y={px.r * p} width={p - 1} height={p - 1} fill={color} opacity={0.8} />
      ))}
      {body.map((px, i) => (
        <Rect key={`b${i}`} x={px.c * p} y={px.r * p} width={p - 1} height={p - 1} fill={color} />
      ))}
    </Svg>
  );
}

interface LockOverlayProps {
  category: string;
  onUnlockPress: () => void;
}

export function LockOverlay({ category, onUnlockPress }: LockOverlayProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  return (
    <View style={[styles.overlay, { backgroundColor: `${tc.background}EE` }]}>
      <View style={styles.content}>
        <PixelPadlock size={56} color={tc.primary} />
        <Text style={[styles.title, { color: tc.primary }]}>{category}</Text>
        <Text style={[styles.subtitle, { color: tc.muted }]}>Premiumプランで利用可能</Text>
        <Pressable
          onPress={onUnlockPress}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: tc.primary, borderRadius: themeConfig.borderRadius.sm },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.buttonText, { color: tc.background }]}>アップグレードする</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});
