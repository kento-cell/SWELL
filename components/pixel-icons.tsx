import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface PixelIconProps {
  size?: number;
  color?: string;
}

/**
 * 8-bit Famicom style icons
 * Each icon is rendered as a pixel grid (8x8 or 16x16)
 */

// Arrow Right (→)
export function PixelArrowRight({ size = 16, color = '#E74C3C' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Arrow Left (←)
export function PixelArrowLeft({ size = 16, color = '#E74C3C' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Star (★)
export function PixelStar({ size = 16, color = '#F39C12' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Heart (♥)
export function PixelHeart({ size = 16, color = '#E74C3C' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 1, 0, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Lock (🔒)
export function PixelLock({ size = 16, color = '#F39C12' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Settings (⚙)
export function PixelSettings({ size = 16, color = '#8B8B8B' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

// Checkmark (✓)
export function PixelCheckmark({ size = 16, color = '#27AE60' }: PixelIconProps) {
  const pixelSize = size / 8;
  const pattern = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 1, 1, 0],
    [1, 0, 0, 0, 1, 1, 0, 0],
    [1, 1, 0, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return (
    <Svg width={size} height={size}>
      {pattern.map((row, y) =>
        row.map((pixel, x) =>
          pixel ? (
            <Rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}
