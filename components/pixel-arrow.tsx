import React, { useState } from 'react';
import { StyleSheet, View, Platform, Pressable } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

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
    pixels.push({ row: 6, col: 3 });
  }

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pixels.map((pixel, index) => (
        <Rect
          key={index}
          x={pixel.col * p}
          y={pixel.row * p}
          width={p}
          height={p}
          fill={color}
        />
      ))}
    </Svg>
  );
}

// Pixel lock icon
function PixelLock({ size, color }: { size: number; color: string }) {
  const p = Math.floor(size / 8);
  const pixels = [
    // Lock body
    { row: 2, col: 1 },
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 2, col: 5 },
    { row: 2, col: 6 },
    { row: 3, col: 1 },
    { row: 3, col: 6 },
    { row: 4, col: 1 },
    { row: 4, col: 6 },
    { row: 5, col: 1 },
    { row: 5, col: 6 },
    { row: 6, col: 1 },
    { row: 6, col: 2 },
    { row: 6, col: 3 },
    { row: 6, col: 4 },
    { row: 6, col: 5 },
    { row: 6, col: 6 },
    // Keyhole
    { row: 4, col: 3 },
    { row: 4, col: 4 },
    { row: 5, col: 3 },
    { row: 5, col: 4 },
  ];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {pixels.map((pixel, index) => (
        <Rect
          key={index}
          x={pixel.col * p}
          y={pixel.row * p}
          width={p}
          height={p}
          fill={color}
        />
      ))}
    </Svg>
  );
}

export function PixelArrow({
  direction,
  onPress,
  disabled = false,
  locked = false,
  size = 32,
}: PixelArrowProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    console.log('[PixelArrow] handlePress called');
    if (!disabled) {
      onPress();
    }
  };

  // For web, use native button element
  if (Platform.OS === 'web') {
    return (
      <button
        onClick={handlePress}
        disabled={disabled}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
        }}
      >
        <PixelTriangle direction={direction} size={size} color={disabled ? '#374151' : '#6B7280'} />
        {locked && (
          <div style={{ position: 'absolute' }}>
            <PixelLock size={size * 0.6} color="#A78BFA" />
          </div>
        )}
      </button>
    );
  }

  // For native, use View with onPress
  const arrowColor = disabled ? '#374151' : '#6B7280';
  const lockColor = '#A78BFA';

  return (
    <View
      style={[
        styles.button,
        disabled && styles.disabled,
        isPressed && !disabled && { opacity: 0.6 },
      ]}
      onTouchStart={() => !disabled && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <View style={styles.inner} pointerEvents="none">
        <PixelTriangle direction={direction} size={size} color={arrowColor} />
        {locked && (
          <View style={[styles.lockOverlay, { width: size * 0.6, height: size * 0.6 }]}>
            <PixelLock size={size * 0.6} color={lockColor} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
