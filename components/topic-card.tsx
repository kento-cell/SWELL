import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Topic } from '@/lib/types';
import { WaveDisplay } from './wave-display';
import { WaveLegend } from './wave-legend';
import { SourceBadge } from './source-badge';
import { useThemeContext } from '@/lib/theme-provider';

interface TopicCardProps {
  topic: Topic;
  onPress: () => void;
}

export function TopicCard({ topic, onPress }: TopicCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 400);
  const { themeConfig } = useThemeContext();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          backgroundColor: themeConfig.colors.surface,
          borderColor: themeConfig.colors.border,
          borderRadius: themeConfig.borderRadius.md,
        },
        pressed && styles.pressed,
      ]}
    >
      {/* Wave visualization */}
      <View style={[styles.waveContainer, { borderBottomColor: themeConfig.colors.border }]}>
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
        <Text
          style={[styles.title, { color: themeConfig.colors.foreground, fontFamily: themeConfig.typography.fontFamily }]}
          numberOfLines={3}
        >
          {topic.title}
        </Text>

        {/* Summary */}
        <Text
          style={[styles.summary, { color: themeConfig.colors.muted, fontFamily: themeConfig.typography.fontFamily }]}
          numberOfLines={2}
        >
          {topic.summary}
        </Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          {topic.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: themeConfig.colors.background }]}>
              <Text style={[styles.tagText, { color: themeConfig.colors.muted }]}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Tap hint */}
        <Text style={[styles.tapHint, { color: themeConfig.colors.muted }]}>タップで詳細を見る →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  waveContainer: {
    borderBottomWidth: 1,
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
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  summary: {
    fontSize: 13,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  tapHint: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'right',
    opacity: 0.6,
  },
});
