import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Topic } from '@/lib/types';
import { WaveDisplay } from './wave-display';
import { WaveLegend } from './wave-legend';
import { SourceBadge } from './source-badge';
import { WaveChart } from './wave-chart';
import { useThemeContext } from '@/lib/theme-provider';

interface TopicCardProps {
  topic: Topic;
  onPress: () => void;
  category?: 'NEWS' | 'SOCIAL' | 'MARKET';
}

export function TopicCard({ topic, onPress, category = 'NEWS' }: TopicCardProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 32, 400);
  const { themeConfig } = useThemeContext();
  
  // MARKET カテゴリの場合は WaveChart を表示
  const isMarketCategory = category === 'MARKET';
  
  // テスト用の株価データ
  const mockStockData = isMarketCategory ? {
    symbol: topic.title.split('\n')[0] || 'AAPL',
    price: Math.random() * 200 + 100,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 5,
    high: Math.random() * 200 + 120,
    low: Math.random() * 200 + 80,
  } : null;

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
      {/* Wave visualization or Wave Chart */}
      <View style={[styles.waveContainer, { borderBottomColor: themeConfig.colors.border }]}>
        {isMarketCategory && mockStockData ? (
          <WaveChart
            data={mockStockData}
            width={cardWidth - 32}
            height={100}
          />
        ) : (
          <WaveDisplay
            level={topic.waveLevel}
            sentiment={topic.waveSentiment}
            width={cardWidth - 2}
            height={110}
            animated
          />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Source + legend row (hide for MARKET) */}
        {!isMarketCategory && (
          <View style={styles.metaRow}>
            <SourceBadge source={topic.source} />
            <WaveLegend level={topic.waveLevel} sentiment={topic.waveSentiment} compact />
          </View>
        )}

        {/* Title or Stock Symbol */}
        <Text
          style={[styles.title, { color: themeConfig.colors.foreground, fontFamily: themeConfig.typography.fontFamily }]}
          numberOfLines={isMarketCategory ? 1 : 3}
        >
          {isMarketCategory ? mockStockData?.symbol : topic.title}
        </Text>

        {/* Summary (hide for MARKET) */}
        {!isMarketCategory && (
          <Text
            style={[styles.summary, { color: themeConfig.colors.muted, fontFamily: themeConfig.typography.fontFamily }]}
            numberOfLines={2}
          >
            {topic.summary}
          </Text>
        )}

        {/* Tags (hide for MARKET) */}
        {!isMarketCategory && (
          <View style={styles.tagRow}>
            {topic.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: themeConfig.colors.background }]}>
                <Text style={[styles.tagText, { color: themeConfig.colors.muted }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tap hint */}
        <Text style={[styles.tapHint, { color: themeConfig.colors.muted }]}>
          {isMarketCategory ? '詳細を見る →' : 'タップで詳細を見る →'}
        </Text>
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
