import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{source}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#374151',
    alignSelf: 'flex-start',
  },
  text: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});
