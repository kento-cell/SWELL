import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { WaveLevel, WaveSentiment } from '@/lib/types';

const WAVE_COLORS: Record<WaveSentiment, string> = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

const WAVE_HEIGHTS: Record<WaveLevel, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.85,
};

interface WaveDisplayProps {
  level: WaveLevel;
  sentiment: WaveSentiment;
  width?: number;
  height?: number;
  animated?: boolean;
}

// Generate pixel-art style wave path
function generatePixelWavePath(
  width: number,
  height: number,
  amplitude: number,
  offset: number,
): string {
  const pixelSize = 4;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);
  let d = '';

  for (let col = 0; col < cols; col++) {
    const x = col * pixelSize;
    const waveY =
      Math.sin((col / cols) * Math.PI * 4 + offset) * amplitude * rows * 0.5 +
      rows * (1 - amplitude) * 0.5;

    for (let row = Math.floor(waveY); row < rows; row++) {
      const y = row * pixelSize;
      d += `M${x},${y} h${pixelSize} v${pixelSize} h-${pixelSize} Z `;
    }
  }
  return d;
}

export function WaveDisplay({
  level,
  sentiment,
  width = 300,
  height = 120,
  animated = true,
}: WaveDisplayProps) {
  const color = WAVE_COLORS[sentiment];
  const amplitude = WAVE_HEIGHTS[level];
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const anim = Animated.loop(
      Animated.timing(animValue, {
        toValue: Math.PI * 2,
        duration: 3000,
        useNativeDriver: false,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [animated, animValue]);

  // Static wave for simplicity (animation via opacity pulse)
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animated, pulseAnim]);

  const pixelSize = 4;
  const cols = Math.floor(width / pixelSize);
  const rows = Math.floor(height / pixelSize);

  // Build pixel wave rows
  const pixels: { x: number; y: number }[] = [];
  for (let col = 0; col < cols; col++) {
    const waveY =
      Math.sin((col / cols) * Math.PI * 5) * amplitude * rows * 0.4 +
      rows * (1 - amplitude) * 0.6;

    for (let row = Math.floor(waveY); row < rows; row++) {
      pixels.push({ x: col * pixelSize, y: row * pixelSize });
    }
  }

  // Second wave layer (offset)
  const pixels2: { x: number; y: number }[] = [];
  for (let col = 0; col < cols; col++) {
    const waveY =
      Math.sin((col / cols) * Math.PI * 5 + Math.PI * 0.7) * amplitude * rows * 0.3 +
      rows * (1 - amplitude * 0.7) * 0.7;

    for (let row = Math.floor(waveY); row < rows; row++) {
      pixels2.push({ x: col * pixelSize, y: row * pixelSize });
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: pulseAnim }]}>
      <Svg width={width} height={height}>
        {/* Background layer */}
        {pixels2.map((p, i) => (
          <Rect
            key={`b${i}`}
            x={p.x}
            y={p.y}
            width={pixelSize - 1}
            height={pixelSize - 1}
            fill={color}
            opacity={0.2}
          />
        ))}
        {/* Main wave layer */}
        {pixels.map((p, i) => (
          <Rect
            key={`f${i}`}
            x={p.x}
            y={p.y}
            width={pixelSize - 1}
            height={pixelSize - 1}
            fill={color}
            opacity={0.85}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
