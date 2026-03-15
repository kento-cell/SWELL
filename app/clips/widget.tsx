import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { WaveDisplay } from '@/components/wave-display';
import { getTopicsByCategory } from '@/lib/data-source-manager';
import { Topic } from '@/lib/types';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType } from '@/lib/theme-system';

/**
 * App Clips Widget for iOS home screen
 * Displays top 3 topics from the selected category
 * Minimal, fast-loading widget experience with theme support
 */
export default function WidgetScreen() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [designTheme, setDesignTheme] = useState<ThemeType>('normal');

  useEffect(() => {
    loadTheme();
    loadTopics();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_design_theme');
      const theme = (saved as ThemeType) || 'normal';
      setDesignTheme(theme);
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

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

  // Get theme-specific styles
  const getThemeStyles = () => {
    const themeStyles = {
      normal: {
        headerBg: '#0F172A',
        headerText: '#F1F5F9',
        headerBorder: '#334155',
        itemBg: '#1E293B',
        itemBorder: '#334155',
        itemText: '#F1F5F9',
        itemMuted: '#94A3B8',
        chevron: '#3B82F6',
        fontFamily: 'system',
      },
      cli: {
        headerBg: '#000000',
        headerText: '#00FF00',
        headerBorder: '#333333',
        itemBg: '#111111',
        itemBorder: '#333333',
        itemText: '#00FF00',
        itemMuted: '#666666',
        chevron: '#00FF00',
        fontFamily: 'monospace',
      },
      '8bit': {
        headerBg: '#1A1A2E',
        headerText: '#FFEB3B',
        headerBorder: '#FF6B35',
        itemBg: '#2D2D44',
        itemBorder: '#FF6B35',
        itemText: '#FFEB3B',
        itemMuted: '#9E9E9E',
        chevron: '#FF6B35',
        fontFamily: 'monospace',
      },
    };
    return themeStyles[designTheme] || themeStyles.normal;
  };

  const themeStyles = getThemeStyles();

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: themeStyles.itemText }]}>読み込み中...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={[styles.header, { backgroundColor: themeStyles.headerBg, borderBottomColor: themeStyles.headerBorder }]}>
        <Text style={[styles.headerTitle, { color: themeStyles.headerText, fontFamily: themeStyles.fontFamily }]}>SWELL</Text>
        <Text style={[styles.headerSubtitle, { color: themeStyles.itemMuted, fontFamily: themeStyles.fontFamily }]}>今日のニュース</Text>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleTopicPress(item)}
            style={({ pressed }) => [
              styles.topicItem,
              { backgroundColor: themeStyles.itemBg, borderColor: themeStyles.itemBorder },
              pressed && { opacity: 0.8 }
            ]}
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
              <Text style={[styles.topicTitle, { color: themeStyles.itemText, fontFamily: themeStyles.fontFamily }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.topicSource, { color: themeStyles.itemMuted, fontFamily: themeStyles.fontFamily }]}>{item.source}</Text>
            </View>

            <Text style={[styles.chevron, { color: themeStyles.chevron }]}>›</Text>
          </Pressable>
        )}
      />

      <View style={[styles.footer, { backgroundColor: themeStyles.headerBg, borderTopColor: themeStyles.headerBorder }]}>
        <Pressable onPress={() => router.push('/')}>
          <Text style={[styles.footerLink, { color: themeStyles.chevron, fontFamily: themeStyles.fontFamily }]}>アプリで詳しく見る →</Text>
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
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  listContent: {
    padding: 8,
    gap: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    gap: 10,
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
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  topicSource: {
    fontSize: 10,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
