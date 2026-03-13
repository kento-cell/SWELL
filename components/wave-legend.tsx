import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WaveLevel, WaveSentiment, WAVE_LEVEL_LABEL, WAVE_SENTIMENT_LABEL } from '@/lib/types';

const WAVE_COLORS: Record<WaveSentiment, string> = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
};

interface WaveLegendProps {
  level: WaveLevel;
  sentiment: WaveSentiment;
  compact?: boolean;
}

export function WaveLegend({ level, sentiment, compact = false }: WaveLegendProps) {
  const color = WAVE_COLORS[sentiment];

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.compactText}>
          {WAVE_LEVEL_LABEL[level]} · {WAVE_SENTIMENT_LABEL[sentiment]}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>話題性</Text>
        <Text style={styles.value}>{WAVE_LEVEL_LABEL[level]}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>反応</Text>
        <View style={styles.sentimentRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.value, { color }]}>{WAVE_SENTIMENT_LABEL[sentiment]}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
    width: 36,
  },
  value: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  sentimentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
