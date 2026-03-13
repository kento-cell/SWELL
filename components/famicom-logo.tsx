import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface FamicomLogoProps {
  size?: number;
}

/**
 * 8-bit Famicom style SWELL logo
 * Pixel art wave design inspired by Super Mario Bros era
 */
export function FamicomLogo({ size = 64 }: FamicomLogoProps) {
  const pixelSize = size / 16; // 16x16 grid

  // Define the logo pattern (16x16 pixels)
  // Red (#E74C3C) = 1, Yellow (#F39C12) = 2, Empty = 0
  const pattern = [
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0, 0],
    [1, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0, 0],
    [1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 0, 0, 0, 0],
    [1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const colors = ['transparent', '#E74C3C', '#F39C12'];

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.map((row, y) =>
          row.map((colorIdx, x) =>
            colorIdx > 0 ? (
              <Rect
                key={`${x}-${y}`}
                x={x * pixelSize}
                y={y * pixelSize}
                width={pixelSize}
                height={pixelSize}
                fill={colors[colorIdx]}
              />
            ) : null,
          ),
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
