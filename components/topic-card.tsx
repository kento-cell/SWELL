import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Topic } from '@/lib/types';
import { WaveDisplay } from './wave-display';
import { WaveLegend } from './wave-legend';
import { SourceBadge } from './source-badge';

interface TopicCardProps {
  topic: Topic;
  onPress: () => void;
}

export function TopicCard({ topic, onPress }: TopicCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 400);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}
    >
      {/* Wave visualization */}
      <View style={styles.waveContainer}>
        <WaveDisplay
          level={topic.waveLevel}
          sentiment={topic.waveSentiment}
          width={cardWidth - 2}
          height={110}
          animated
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Source + legend row */}
        <View style={styles.metaRow}>
          <SourceBadge source={topic.source} />
          <WaveLegend level={topic.waveLevel} sentiment={topic.waveSentiment} compact />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={3}>
          {topic.title}
        </Text>

        {/* Summary */}
        <Text style={styles.summary} numberOfLines={2}>
          {topic.summary}
        </Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          {topic.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Tap hint */}
        <Text style={styles.tapHint}>タップで詳細を見る →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  waveContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  content: {
    padding: 16,
    gap: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#E8EDF5',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  summary: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1F2937',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  tapHint: {
    color: '#374151',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'right',
  },
});
