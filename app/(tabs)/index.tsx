import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
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
import { PixelArrow } from '@/components/pixel-arrow';
import { PageIndicator } from '@/components/page-indicator';
import { LockOverlay } from '@/components/lock-overlay';
import { Tutorial } from '@/components/tutorial';
import { PremiumSheet } from '@/components/premium-sheet';
import { WaveRankingWidget } from '@/components/wave-ranking-widget';
import { PixelText } from '@/components/pixel-text';
import { usePlan } from '@/lib/plan-context';
import { getTopicsByCategory, MOCK_TOPICS } from '@/lib/mock-data';
import { Category, FREE_CATEGORIES } from '@/lib/types';
import { useCategoryData } from '@/hooks/use-real-time-data';
import { useTopicContext } from '@/lib/topic-context';
import { useColors } from '@/hooks/use-colors';
import { useLocalization } from '@/lib/localization-context';

const CATEGORIES: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { plan, tutorialDone } = usePlan();
  const { setSelectedTopic } = useTopicContext();
  const colors = useColors();
  const { t } = useLocalization();
  const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch real-time data from server
  const { topics: realtimeTopics, isLoading, error, source } = useCategoryData(activeCategory);
  
  // For SOCIAL category, also fetch videos
  const [videos, setVideos] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  
  useEffect(() => {
    if (activeCategory === 'SOCIAL') {
      setVideosLoading(true);
      // Fetch videos from server
      // This will be implemented via TRPC call
      setVideosLoading(false);
    }
  }, [activeCategory]);
  
  // Determine displayed topics
  const topics = realtimeTopics.length > 0 ? realtimeTopics : getTopicsByCategory(activeCategory);
  
  // For SOCIAL category, mix articles and videos
  const displayTopics = activeCategory === 'SOCIAL' && videos.length > 0 
    ? [...topics.slice(0, Math.ceil(topics.length / 2)), ...videos.slice(0, 2)]
    : topics;

  const isLocked = plan === 'free' && !FREE_CATEGORIES.includes(activeCategory);

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  };

  // Show loading indicator when fetching real-time data
  const showLoadingIndicator = isLoading && realtimeTopics.length === 0;

  const handlePrev = () => {
    if (currentIndex <= 0) {
      // Loop to last
      const newIndex = topics.length - 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    } else {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    if (currentIndex >= topics.length - 1) {
      // Loop to first
      setCurrentIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    } else {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
    }
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
  const dataSource = realtimeTopics.length > 0 ? source : 'Mock Data';

  const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);

  // Log data source for debugging
  useEffect(() => {
    if (realtimeTopics.length > 0) {
      console.log(`[HomeScreen] Loaded ${realtimeTopics.length} topics from ${source}`);
    } else if (error) {
      console.log(`[HomeScreen] Error loading data: ${error}`);
    }
  }, [realtimeTopics, source, error]);

  const styles = createStyles(colors);
  
  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <PixelText variant="h1" color="primary">{t('app.title')}</PixelText>
        <PixelText variant="caption" color="muted" style={{ marginTop: 4 }}>{dataSource}</PixelText>
      </View>

      {/* Wave Ranking Widget */}
      <WaveRankingWidget
        topics={MOCK_TOPICS}
        onTopicPress={(topic) => {
          setActiveCategory(topic.category);
          const categoryTopics = getTopicsByCategory(topic.category);
          const idx = categoryTopics.findIndex((t) => t.id === topic.id);
          if (idx >= 0) {
            setCurrentIndex(idx);
            flatListRef.current?.scrollToIndex({ index: idx, animated: true });
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
        {/* Topic FlatList */}
        <View style={styles.cardArea}>
          <FlatList
            ref={flatListRef}
            data={topics}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 16}
            snapToAlignment="center"
            decelerationRate="fast"
            contentContainerStyle={[
              styles.flatListContent,
              { paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 },
            ]}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item }) => {
              // Check if item is a video or topic
              const isVideo = 'source' in item && (item.source === 'youtube' || item.source === 'tiktok');
              
              return (
                <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
                  {isVideo ? (
                    // Video card - open in browser
                    <Pressable
                      onPress={() => {
                        // Open video URL in browser
                        // This will be implemented with expo-web-browser
                      }}
                    >
                      <View style={{ backgroundColor: '#1F2937', borderRadius: 12, padding: 12 }}>
                        <Text style={{ color: '#ECEDEE', fontSize: 14, fontWeight: '600' }}>
                          {item.title}
                        </Text>
                      </View>
                    </Pressable>
                  ) : (
                    // Topic card
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
              length: CARD_WIDTH + 16,
              offset: (CARD_WIDTH + 16) * index,
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

        {/* Navigation Controls */}
        <View style={styles.navRow}>
          <PixelArrow
            direction="left"
            onPress={handlePrev}
            locked={isLocked}
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
            locked={isLocked}
            size={36}
          />
        </View>
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

// Create dynamic styles that use theme colors
const createStyles = (colors: any) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    color: '#E8EDF5',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 6,
  },
  tagline: {
    color: '#374151',
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
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
