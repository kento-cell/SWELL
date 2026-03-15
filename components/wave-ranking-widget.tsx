import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Topic, WAVE_LEVEL_LABEL, WAVE_SENTIMENT_LABEL } from '@/lib/types';
import { WaveDisplay } from './wave-display';
import { useThemeContext } from '@/lib/theme-provider';

interface WaveRankingWidgetProps {
  topics: Topic[];
  onTopicPress: (topic: Topic) => void;
  title?: string;
}

export function WaveRankingWidget({
  topics,
  onTopicPress,
  title = '波のランキング',
}: WaveRankingWidgetProps) {
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  // Sort topics by wave level (high > medium > low) and sentiment intensity
  const sortedTopics = useMemo(() => {
    const levelOrder = { high: 3, medium: 2, low: 1 };
    const sentimentOrder = { red: 4, yellow: 3, green: 2, blue: 1 };

    return [...topics].sort((a, b) => {
      const levelDiff = levelOrder[b.waveLevel] - levelOrder[a.waveLevel];
      if (levelDiff !== 0) return levelDiff;
      return sentimentOrder[b.waveSentiment] - sentimentOrder[a.waveSentiment];
    });
  }, [topics]);

  const topRanked = sortedTopics.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: tc.surface, borderColor: tc.border, borderRadius: themeConfig.borderRadius.sm }]}>
      <View style={[styles.header, { borderBottomColor: tc.border }]}>
        <Text style={[styles.title, { color: tc.foreground }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: tc.muted }]}>最も盛り上がっているトピック</Text>
      </View>

      <View style={styles.rankingList}>
        {topRanked.map((topic, index) => (
          <Pressable
            key={topic.id}
            onPress={() => onTopicPress(topic)}
            style={({ pressed }) => [
              styles.rankingItem,
              { borderBottomColor: tc.border },
              pressed && { backgroundColor: tc.background },
            ]}
          >
            {/* Rank badge */}
            <View
              style={[
                styles.rankBadge,
                { backgroundColor: index === 0 ? '#F59E0B' : index === 1 ? tc.primary : tc.muted },
              ]}
            >
              <Text style={[styles.rankNumber, { color: tc.background }]}>{index + 1}</Text>
            </View>

            {/* Wave mini display */}
            <View style={[styles.wavePreview, { backgroundColor: tc.background }]}>
              <WaveDisplay
                level={topic.waveLevel}
                sentiment={topic.waveSentiment}
                width={60}
                height={40}
                animated={false}
              />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={[styles.topicTitle, { color: tc.foreground }]} numberOfLines={2}>
                {topic.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.source, { color: tc.muted }]}>{topic.source}</Text>
                <Text style={[styles.waveInfo, { color: tc.muted }]}>
                  {WAVE_LEVEL_LABEL[topic.waveLevel]} · {WAVE_SENTIMENT_LABEL[topic.waveSentiment]}
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <Text style={[styles.chevron, { color: tc.muted }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  rankingList: {
    gap: 0,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  wavePreview: {
    width: 60,
    height: 40,
    borderRadius: 2,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topicTitle: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  source: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  waveInfo: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  chevron: {
    fontSize: 16,
  },
});
