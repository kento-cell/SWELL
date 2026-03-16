import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { WaveDisplay } from '@/components/wave-display';
import { WaveLegend } from '@/components/wave-legend';
import { SourceBadge } from '@/components/source-badge';
import { OpenSourceButton } from '@/components/open-source-button';
import { PixelText } from '@/components/pixel-text';
import { PixelButton } from '@/components/pixel-button';
import { WAVE_LEVEL_LABEL, WAVE_SENTIMENT_LABEL } from '@/lib/types';
import { useTopicContext } from '@/lib/topic-context';
import { useThemeContext } from '@/lib/theme-provider';

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { selectedTopic } = useTopicContext();
  const { themeConfig } = useThemeContext();
  const tc = themeConfig.colors;

  // Use selectedTopic from context (set when user taps a card)
  const topic = selectedTopic;

  if (!topic) {
    return (
      <ScreenContainer>
        <View style={styles.notFound}>
          <PixelText variant="body" color="muted">トピックが見つかりません</PixelText>
          <PixelText variant="body" color="muted" style={{ marginTop: 8, fontSize: 12 }}>ID: {id}</PixelText>
          <PixelButton label="← 戻る" onPress={() => router.back()} variant="secondary" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.border }]}>
        <PixelButton label="← 戻る" onPress={() => router.back()} variant="secondary" size="sm" />
        <View style={[styles.categoryBadge, { backgroundColor: tc.surface }]}>
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
          <Text style={[styles.publishedAt, { color: tc.muted }]}>
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
        <View style={[styles.legendCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          <PixelText variant="mono" color="muted">波の状況</PixelText>
          <WaveLegend level={topic.waveLevel} sentiment={topic.waveSentiment} />
          <View style={styles.legendDetail}>
            <PixelText variant="body" color="secondary">
              この話題は<PixelText variant="body" color="accent">{WAVE_LEVEL_LABEL[topic.waveLevel]}</PixelText>で、
              反応傾向は<PixelText variant="body" color="accent">{WAVE_SENTIMENT_LABEL[topic.waveSentiment]}</PixelText>です。
            </PixelText>
          </View>
        </View>

        {/* Summary */}
        {topic.summary && (
          <View style={[styles.descriptionCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <Text style={[styles.summaryLabel, { color: tc.muted }]}>AI 要約</Text>
            <Text style={[styles.summaryText, { color: tc.foreground }]}>
              {topic.summary}
            </Text>
          </View>
        )}

        {/* Detail */}
        {topic.detail && topic.detail !== topic.summary && (
          <View style={[styles.descriptionCard, { backgroundColor: tc.surface, borderColor: tc.border }]}>
            <PixelText variant="body" color="primary">
              {topic.detail}
            </PixelText>
          </View>
        )}

        {/* Open Source Button */}
        {topic.sourceUrl && (
          <View style={styles.buttonContainer}>
            <OpenSourceButton url={topic.sourceUrl} />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    gap: 16,
  },
  waveArea: {
    alignItems: 'center',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  publishedAt: {
    fontSize: 12,
  },
  legendCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  legendDetail: {
    marginTop: 8,
  },
  descriptionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingVertical: 8,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});
