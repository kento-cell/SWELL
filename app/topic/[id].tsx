import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { WaveDisplay } from '@/components/wave-display';
import { WaveLegend } from '@/components/wave-legend';
import { SourceBadge } from '@/components/source-badge';
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
          <Text style={styles.notFoundText}>トピックが見つかりません</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const handleOpenSource = () => {
    if (topic.sourceUrl) {
      Linking.openURL(topic.sourceUrl);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.backBtnText}>← 戻る</Text>
        </Pressable>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{topic.category}</Text>
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
        <Text style={styles.title}>{topic.title}</Text>

        {/* Wave Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendCardTitle}>波の状態</Text>
          <WaveLegend level={topic.waveLevel} sentiment={topic.waveSentiment} />
          <View style={styles.legendDetail}>
            <Text style={styles.legendDetailText}>
              この話題は<Text style={styles.highlight}>{WAVE_LEVEL_LABEL[topic.waveLevel]}</Text>で、
              反応傾向は<Text style={styles.highlight}>{WAVE_SENTIMENT_LABEL[topic.waveSentiment]}</Text>です。
            </Text>
          </View>
        </View>

        {/* Detail text */}
        <Text style={styles.detail}>{topic.detail}</Text>

        {/* Tags */}
        <View style={styles.tagRow}>
          {topic.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Source link */}
        {topic.sourceUrl ? (
          <Pressable
            onPress={handleOpenSource}
            style={({ pressed }) => [styles.sourceLink, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.sourceLinkText}>元記事を読む → {topic.source}</Text>
          </Pressable>
        ) : (
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceInfoText}>ソース: {topic.source}</Text>
          </View>
        )}
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
  sourceLink: {
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 2,
    padding: 12,
    alignItems: 'center',
  },
  sourceLinkText: {
    color: '#3B82F6',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  sourceInfo: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 2,
  },
  sourceInfoText: {
    color: '#4B5563',
    fontSize: 12,
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
