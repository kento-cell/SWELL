import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PageIndicatorProps {
  current: number;
  total: number;
  color?: string;
}

export function PageIndicator({ current, total, color = '#3B82F6' }: PageIndicatorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current
                ? [styles.dotActive, { backgroundColor: color }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.counter}>
        {current + 1} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 0,
  },
  dotActive: {
    width: 8,
    height: 4,
  },
  dotInactive: {
    backgroundColor: '#374151',
  },
  counter: {
    color: '#4B5563',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
