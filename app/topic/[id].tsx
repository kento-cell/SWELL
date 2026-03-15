import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { WaveDisplay } from '@/components/wave-display';
import { WaveLegend } from '@/components/wave-legend';
import { SourceBadge } from '@/components/source-badge';
import { OpenSourceButton } from '@/components/open-source-button';
import { PixelText } from '@/components/pixel-text';
import { PixelButton } from '@/components/pixel-button';
import { MOCK_TOPICS } from '@/lib/mock-data';
import { WAVE_LEVEL_LABEL, WAVE_SENTIMENT_LABEL } from '@/lib/types';

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const topic = MOCK_TOPICS.find((t) => t.id === id);

  if (!topic) {
    return (
      <ScreenContainer>
        <View style={styles.notFound}>
          <PixelText variant="body" color="muted">トピックが見つかりません</PixelText>
          <PixelButton label="← 戻る" onPress={() => router.back()} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  // OpenSourceButton handles the URL opening

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <PixelButton label="← 戻る" onPress={() => router.back()} variant="secondary" size="sm" />
        <View style={styles.categoryBadge}>
          <PixelText variant="mono" color="muted">{topic.category}</PixelText>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Wave visualization */}
        <View style={styles.waveArea}>
          <WaveDisplay
            level={topic.waveLevel}
            sentiment={topic.waveSentiment}
            width={360}
            height={140}
            animated
          />
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          <SourceBadge source={topic.source} />
          <Text style={styles.publishedAt}>
            {new Date(topic.publishedAt).toLocaleDateString('ja-JP', {
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {/* Title */}
        <PixelText variant="h2" color="primary">{topic.title}</PixelText>

        {/* Wave Legend */}
        <View style={styles.legendCard}>
          <PixelText variant="mono" color="muted">波の状況</PixelText>
          <WaveLegend level={topic.waveLevel} sentiment={topic.waveSentiment} />
          <View style={styles.legendDetail}>
            <PixelText variant="body" color="secondary">
              この話題は<PixelText variant="body" color="accent">{WAVE_LEVEL_LABEL[topic.waveLevel]}</PixelText>で、
              反応傾向は<PixelText variant="body" color="accent">{WAVE_SENTIMENT_LABEL[topic.waveSentiment]}</PixelText>です。
            </PixelText>
          </View>
        </View>

        {/* Detail text */}
        <PixelText variant="body" color="secondary">{topic.detail}</PixelText>

        {/* Tags */}
        <View style={styles.tagRow}>
          {topic.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <PixelText variant="caption" color="muted">#{tag}</PixelText>
            </View>
          ))}
        </View>

        {/* Source link */}
        <OpenSourceButton url={topic.sourceUrl} label={`${topic.source}で読む`} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  categoryText: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  waveArea: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1F2937',
    alignSelf: 'center',
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publishedAt: {
    color: '#4B5563',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  title: {
    color: '#E8EDF5',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  legendCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 4,
    padding: 14,
    gap: 10,
  },
  legendCardTitle: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  legendDetail: {
    marginTop: 4,
  },
  legendDetailText: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 20,
  },
  highlight: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  detail: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 24,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#1F2937',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: 'monospace',
  },

  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  notFoundText: {
    color: '#6B7280',
    fontSize: 14,
  },
  backButton: {
    padding: 12,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 14,
  },
});
