import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { CategoryTab } from '@/components/category-tab';
import { TopicCard } from '@/components/topic-card';
import { VideoCard } from '@/components/video-card';
import { PixelArrow } from '@/components/pixel-arrow';
import { PageIndicator } from '@/components/page-indicator';
import { LockOverlay } from '@/components/lock-overlay';
import { Tutorial } from '@/components/tutorial';
import { PremiumSheet } from '@/components/premium-sheet';
import { WaveRankingWidget } from '@/components/wave-ranking-widget';
import { PixelText } from '@/components/pixel-text';
import { usePlan } from '@/lib/plan-context';
// mock-data kept for legacy reference only - not used in main flow
import { Category, FREE_CATEGORIES, Topic } from '@/lib/types';
import { useCategoryData, useNewsData } from '@/hooks/use-real-time-data';
import { useTopicContext } from '@/lib/topic-context';
import { useLocalization } from '@/lib/localization-context';
import { useThemeContext } from '@/lib/theme-provider';

const CATEGORIES: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { plan, tutorialDone } = usePlan();
  const { setSelectedTopic } = useTopicContext();
  const { t } = useLocalization();
  const { themeConfig } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch real-time data from server (includes videos for SOCIAL)
  const { topics: realtimeTopics, isLoading, error, source } = useCategoryData(activeCategory);
  // Always fetch NEWS topics for wave ranking widget (independent of active category)
  const { topics: newsTopics } = useNewsData();

  // Use real-time data only; show empty list while loading (no mock fallback)
  const topics: Topic[] = realtimeTopics;

  const isLocked = plan === 'free' && !FREE_CATEGORIES.includes(activeCategory);

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const showLoadingIndicator = isLoading && realtimeTopics.length === 0;

  const handlePrev = () => {
    const newIndex = currentIndex <= 0 ? topics.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    scrollToCard(newIndex);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    const newIndex = currentIndex >= topics.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
    scrollToCard(newIndex);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const currentTopic = topics[currentIndex];
  const dataSource = realtimeTopics.length > 0 ? source : isLoading ? '取得中...' : 'オフライン';

  const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
  const ITEM_WIDTH = CARD_WIDTH + 16; // card + marginHorizontal*2 (8 each side)
  // No paddingHorizontal on contentContainer: offset = index * ITEM_WIDTH exactly

  // Scroll to a specific index
  const scrollToCard = (index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_WIDTH,
      animated: true,
    });
  };

  useEffect(() => {
    if (realtimeTopics.length > 0) {
      console.log(`[HomeScreen] ${realtimeTopics.length}件のトピックを取得: ${source}`);
    } else if (error) {
      console.log(`[HomeScreen] データ取得エラー: ${error}`);
    }
  }, [realtimeTopics, source, error]);

  const tc = themeConfig.colors;

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tc.border, backgroundColor: tc.background }]}>
        <PixelText variant="h1" color="primary">{t('app.title', 'SWELL')}</PixelText>
        <Text style={[styles.tagline, { color: tc.muted }]}>
          {t('app.tagline', '波を読む')} · {dataSource}
        </Text>
      </View>

      {/* Wave Ranking Widget */}
      <WaveRankingWidget
        topics={newsTopics}
        onTopicPress={(topic) => {
          setActiveCategory('NEWS');
          const idx = newsTopics.findIndex((t: Topic) => t.id === topic.id);
          if (idx >= 0) {
            setCurrentIndex(idx);
            scrollToCard(idx);
          }
        }}
      />

      {/* Category Tabs */}
      <CategoryTab
        categories={CATEGORIES}
        activeCategory={activeCategory}
        plan={plan}
        onSelect={handleCategorySelect}
      />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Loading indicator */}
        {showLoadingIndicator && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tc.primary} />
            <Text style={[styles.loadingText, { color: tc.muted }]}>
              {activeCategory === 'NEWS' ? '日本語ニュースを取得中...' :
               activeCategory === 'SOCIAL' ? 'トレンド動画を取得中...' :
               '市況データを取得中...'}
            </Text>
          </View>
        )}

        {/* Topic FlatList */}
        {!showLoadingIndicator && (
          <View style={styles.cardArea}>
            <FlatList
              ref={flatListRef}
              data={topics}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ITEM_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={styles.flatListContent}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              renderItem={({ item }) => {
                // SOCIAL カテゴリで動画データがある場合は VideoCard を使用
                const isVideoItem = activeCategory === 'SOCIAL' && item.videoType;
                return (
                  <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
                    {isVideoItem ? (
                      <VideoCard topic={item} cardWidth={CARD_WIDTH} />
                    ) : (
                      <TopicCard
                        topic={item}
                        onPress={() => {
                          setSelectedTopic(item);
                          router.push({ pathname: '/topic/[id]', params: { id: item.id } });
                        }}
                      />
                    )}
                  </View>
                );
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
            />

            {/* Lock Overlay */}
            {isLocked && (
              <LockOverlay
                category={activeCategory}
                onUnlockPress={() => setShowPremiumSheet(true)}
              />
            )}
          </View>
        )}

        {/* Navigation Controls - outside cardArea so LockOverlay cannot block it */}
        {!showLoadingIndicator && (
          <View style={[styles.navRow, { zIndex: 20 }]}>
            <PixelArrow
              direction="left"
              onPress={handlePrev}
              disabled={topics.length === 0}
              size={36}
            />
            <PageIndicator
              current={currentIndex}
              total={topics.length}
              color={
                currentTopic?.waveSentiment === 'blue' ? '#3B82F6' :
                currentTopic?.waveSentiment === 'green' ? '#10B981' :
                currentTopic?.waveSentiment === 'yellow' ? '#F59E0B' :
                '#EF4444'
              }
            />
            <PixelArrow
              direction="right"
              onPress={handleNext}
              disabled={topics.length === 0}
              size={36}
            />
          </View>
        )}
      </View>

      {/* Tutorial (first launch) */}
      {!tutorialDone && <Tutorial />}

      {/* Premium Sheet */}
      {showPremiumSheet && (
        <PremiumSheet onClose={() => setShowPremiumSheet(false)} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  tagline: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  cardArea: {
    position: 'relative',
    flex: 1,
    justifyContent: 'center',
  },
  flatListContent: {
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
});
