import React, { useCallback, useRef, useState } from 'react';
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
import { usePlan } from '@/lib/plan-context';
import { getTopicsByCategory, MOCK_TOPICS } from '@/lib/mock-data';
import { Category, FREE_CATEGORIES } from '@/lib/types';

const CATEGORIES: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { plan, tutorialDone } = usePlan();
  const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isLocked = plan === 'free' && !FREE_CATEGORIES.includes(activeCategory);
  const topics = getTopicsByCategory(activeCategory);

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    flatListRef.current?.scrollToIndex({ index: 0, animated: false });
  };

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

  const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SWELL</Text>
        <Text style={styles.tagline}>ニュースを読む前に、波を見る</Text>
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
            renderItem={({ item }) => (
              <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
                <TopicCard
                  topic={item}
                  onPress={() => router.push({ pathname: '/topic/[id]', params: { id: item.id } })}
                />
              </View>
            )}
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

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
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
