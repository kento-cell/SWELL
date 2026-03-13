import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';

interface PixelArrowProps {
  direction: 'left' | 'right';
  onPress: () => void;
  disabled?: boolean;
  locked?: boolean;
  size?: number;
}

// Pixel art arrow (triangle made of squares)
function PixelTriangle({
  direction,
  size,
  color,
}: {
  direction: 'left' | 'right';
  size: number;
  color: string;
}) {
  const p = Math.floor(size / 8); // pixel unit
  // Build a simple pixel triangle
  const pixels: { row: number; col: number }[] = [];

  if (direction === 'right') {
    // Right-pointing triangle
    pixels.push({ row: 0, col: 0 });
    pixels.push({ row: 1, col: 0 });
    pixels.push({ row: 1, col: 1 });
    pixels.push({ row: 2, col: 0 });
    pixels.push({ row: 2, col: 1 });
    pixels.push({ row: 2, col: 2 });
    pixels.push({ row: 3, col: 0 });
    pixels.push({ row: 3, col: 1 });
    pixels.push({ row: 3, col: 2 });
    pixels.push({ row: 3, col: 3 });
    pixels.push({ row: 4, col: 0 });
    pixels.push({ row: 4, col: 1 });
    pixels.push({ row: 4, col: 2 });
    pixels.push({ row: 5, col: 0 });
    pixels.push({ row: 5, col: 1 });
    pixels.push({ row: 6, col: 0 });
    pixels.push({ row: 6, col: 1 });
    pixels.push({ row: 7, col: 0 });
  } else {
    // Left-pointing triangle (mirror)
    pixels.push({ row: 0, col: 3 });
    pixels.push({ row: 1, col: 2 });
    pixels.push({ row: 1, col: 3 });
    pixels.push({ row: 2, col: 1 });
    pixels.push({ row: 2, col: 2 });
    pixels.push({ row: 2, col: 3 });
    pixels.push({ row: 3, col: 0 });
    pixels.push({ row: 3, col: 1 });
    pixels.push({ row: 3, col: 2 });
    pixels.push({ row: 3, col: 3 });
    pixels.push({ row: 4, col: 1 });
    pixels.push({ row: 4, col: 2 });
    pixels.push({ row: 4, col: 3 });
    pixels.push({ row: 5, col: 2 });
    pixels.push({ row: 5, col: 3 });
    pixels.push({ row: 6, col: 2 });
    pixels.push({ row: 6, col: 3 });
    pixels.push({ row: 7, col: 3 });
  }

  return (
    <Svg width={size} height={size}>
      {pixels.map((px, i) => (
        <Rect
          key={i}
          x={px.col * p}
          y={px.row * p}
          width={p - 1}
          height={p - 1}
          fill={color}
        />
      ))}
    </Svg>
  );
}

// Pixel lock icon
function PixelLock({ size, color }: { size: number; color: string }) {
  const p = Math.floor(size / 8);
  // Simple pixel padlock
  const bodyPixels = [
    { r: 3, c: 1 }, { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 },
    { r: 4, c: 0 }, { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 4, c: 5 }, { r: 4, c: 6 },
    { r: 5, c: 0 }, { r: 5, c: 6 },
    { r: 6, c: 0 }, { r: 6, c: 3 }, { r: 6, c: 6 },
    { r: 7, c: 0 }, { r: 7, c: 3 }, { r: 7, c: 6 },
  ];
  const shacklePixels = [
    { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 },
    { r: 1, c: 1 }, { r: 1, c: 5 },
    { r: 2, c: 1 }, { r: 2, c: 5 },
  ];

  return (
    <Svg width={size} height={size}>
      {shacklePixels.map((px, i) => (
        <Rect key={`s${i}`} x={px.c * p} y={px.r * p} width={p - 1} height={p - 1} fill={color} />
      ))}
      {bodyPixels.map((px, i) => (
        <Rect key={`b${i}`} x={px.c * p} y={px.r * p} width={p - 1} height={p - 1} fill={color} />
      ))}
    </Svg>
  );
}

export function PixelArrow({
  direction,
  onPress,
  disabled = false,
  locked = false,
  size = 40,
}: PixelArrowProps) {
  const arrowColor = disabled ? '#374151' : '#6B7280';
  const lockColor = '#A78BFA';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && { opacity: 0.6 },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.inner}>
        <PixelTriangle direction={direction} size={size} color={arrowColor} />
        {locked && (
          <View style={[styles.lockOverlay, { width: size * 0.6, height: size * 0.6 }]}>
            <PixelLock size={size * 0.6} color={lockColor} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  disabled: {
    opacity: 0.3,
  },
});
