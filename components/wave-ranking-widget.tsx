import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Topic, WAVE_LEVEL_LABEL, WAVE_SENTIMENT_LABEL } from '@/lib/types';
import { WaveDisplay } from './wave-display';

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>最も盛り上がっているトピック</Text>
      </View>

      <View style={styles.rankingList}>
        {topRanked.map((topic, index) => (
          <Pressable
            key={topic.id}
            onPress={() => onTopicPress(topic)}
            style={({ pressed }) => [
              styles.rankingItem,
              pressed && styles.rankingItemPressed,
            ]}
          >
            {/* Rank badge */}
            <View
              style={[
                styles.rankBadge,
                index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : styles.rank3,
              ]}
            >
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>

            {/* Wave mini display */}
            <View style={styles.wavePreview}>
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
              <Text style={styles.topicTitle} numberOfLines={2}>
                {topic.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.source}>{topic.source}</Text>
                <Text style={styles.waveInfo}>
                  {WAVE_LEVEL_LABEL[topic.waveLevel]} · {WAVE_SENTIMENT_LABEL[topic.waveSentiment]}
                </Text>
              </View>
            </View>

            {/* Chevron */}
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 4,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    color: '#E8EDF5',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#4B5563',
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
    borderBottomColor: '#1F2937',
    gap: 10,
  },
  rankingItemPressed: {
    backgroundColor: '#0F1419',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rank1: {
    backgroundColor: '#F59E0B',
  },
  rank2: {
    backgroundColor: '#A78BFA',
  },
  rank3: {
    backgroundColor: '#6B7280',
  },
  rankNumber: {
    color: '#0A0E1A',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  wavePreview: {
    width: 60,
    height: 40,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#0F1419',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topicTitle: {
    color: '#E8EDF5',
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
    color: '#4B5563',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  waveInfo: {
    color: '#6B7280',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  chevron: {
    color: '#374151',
    fontSize: 16,
  },
});
