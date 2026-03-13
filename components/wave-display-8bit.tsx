import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { WaveLevel, WaveSentiment } from '@/lib/types';

const WAVE_COLORS: Record<WaveSentiment, string> = {
  blue: '#3498DB',    // Sky Blue
  green: '#27AE60',   // NES Green
  yellow: '#F39C12',  // NES Yellow
  red: '#E74C3C',     // NES Red
};

const WAVE_HEIGHTS: Record<WaveLevel, number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
};

interface WaveDisplay8bitProps {
  level: WaveLevel;
  sentiment: WaveSentiment;
  width?: number;
  height?: number;
  animated?: boolean;
}

/**
 * 8-bit Famicom style wave display
 * Uses chunky 8x8 pixel blocks for authentic retro look
 */
export function WaveDisplay8bit({
  level,
  sentiment,
  width = 300,
  height = 120,
  animated = true,
}: WaveDisplay8bitProps) {
  const color = WAVE_COLORS[sentiment];
  const amplitude = WAVE_HEIGHTS[level];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animated, pulseAnim]);

  // 8x8 pixel blocks for authentic 8-bit look
  const pixelSize = 8;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  // Generate wave pixels with smooth sine curve
  const pixels: { x: number; y: number; opacity: number }[] = [];

  for (let col = 0; col < cols; col++) {
    // Main wave
    const waveY =
      Math.sin((col / cols) * Math.PI * 4) * amplitude * rows * 0.4 +
      rows * (1 - amplitude) * 0.5;

    for (let row = Math.floor(waveY); row < rows; row++) {
      const distFromWave = row - waveY;
      const opacity = Math.max(0.3, 1 - distFromWave * 0.15);

      pixels.push({
        x: col * pixelSize,
        y: row * pixelSize,
        opacity: Math.min(1, opacity),
      });
    }
  }

  // Secondary wave layer (offset for depth)
  const pixels2: { x: number; y: number; opacity: number }[] = [];
  for (let col = 0; col < cols; col++) {
    const waveY =
      Math.sin((col / cols) * Math.PI * 4 + Math.PI * 0.5) *
        amplitude *
        rows *
        0.25 +
      rows * (1 - amplitude * 0.6) * 0.65;

    for (let row = Math.floor(waveY); row < rows; row++) {
      const distFromWave = row - waveY;
      const opacity = Math.max(0.1, 1 - distFromWave * 0.2);

      pixels2.push({
        x: col * pixelSize,
        y: row * pixelSize,
        opacity: Math.min(0.5, opacity),
      });
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: pulseAnim }]}>
      <Svg width={width} height={height}>
        {/* Background layer (darker, further back) */}
        {pixels2.map((p, i) => (
          <Rect
            key={`bg${i}`}
            x={p.x}
            y={p.y}
            width={pixelSize - 1}
            height={pixelSize - 1}
            fill={color}
            opacity={p.opacity * 0.4}
          />
        ))}

        {/* Main wave layer (brighter, in front) */}
        {pixels.map((p, i) => (
          <Rect
            key={`fg${i}`}
            x={p.x}
            y={p.y}
            width={pixelSize - 1}
            height={pixelSize - 1}
            fill={color}
            opacity={p.opacity}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#3D3D5C',
  },
});
