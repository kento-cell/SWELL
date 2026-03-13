import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { WaveDisplay } from '@/components/wave-display';
import { getTopicsByCategory } from '@/lib/data-source-manager';
import { Topic } from '@/lib/types';
import { useRouter } from 'expo-router';

/**
 * App Clips Widget for iOS home screen
 * Displays top 3 topics from the selected category
 * Minimal, fast-loading widget experience
 */
export default function WidgetScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const newsTopics = await getTopicsByCategory('NEWS');
      setTopics(newsTopics.slice(0, 3));
    } catch (error) {
      console.error('Failed to load topics for widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    router.push(`/topic/${topic.id}`);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SWELL</Text>
        <Text style={styles.headerSubtitle}>今日のニュース</Text>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleTopicPress(item)}
            style={({ pressed }) => [styles.topicItem, pressed && styles.topicItemPressed]}
          >
            <View style={styles.waveSmall}>
              <WaveDisplay
                level={item.waveLevel}
                sentiment={item.waveSentiment}
                width={80}
                height={40}
                animated={false}
              />
            </View>

            <View style={styles.topicContent}>
              <Text style={styles.topicTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.topicSource}>{item.source}</Text>
            </View>

            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <Pressable onPress={() => router.push('/')}>
          <Text style={styles.footerLink}>アプリで詳しく見る →</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#E8EDF5',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D5C',
  },
  headerTitle: {
    color: '#F0F0F0',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  headerSubtitle: {
    color: '#8B8B8B',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  listContent: {
    padding: 8,
    gap: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D44',
    borderWidth: 1,
    borderColor: '#3D3D5C',
    borderRadius: 2,
    padding: 10,
    gap: 10,
  },
  topicItemPressed: {
    backgroundColor: '#3D3D5C',
    opacity: 0.8,
  },
  waveSmall: {
    width: 80,
    height: 40,
    borderRadius: 2,
    overflow: 'hidden',
  },
  topicContent: {
    flex: 1,
    gap: 4,
  },
  topicTitle: {
    color: '#F0F0F0',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  topicSource: {
    color: '#8B8B8B',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  chevron: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#3D3D5C',
  },
  footerLink: {
    color: '#E74C3C',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
    textAlign: 'center',
  },
});
