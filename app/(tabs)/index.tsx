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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { CategoryTab } from '@/components/category-tab';
import { TopicCard } from '@/components/topic-card';
import { VideoCard } from '@/components/video-card';
import { StockCard } from '@/components/stock-card';
import { MarketGroupCard } from '@/components/market-group-card';
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
import { useWatchlist } from '@/hooks/use-watchlist';
import { WatchlistModal } from '@/components/watchlist-modal';
import { TrialBanner } from '@/components/trial-banner';
import { TrialWarning } from '@/components/trial-warning';
import { Onboarding } from '@/components/onboarding';
import { useInterests } from '@/hooks/use-interests';
import { trpc } from '@/lib/trpc';

const CATEGORIES: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { plan, tutorialDone, isPremium, isTrial, trialDaysLeft } = usePlan();
  const { onboardingDone, completeOnboarding, isLoaded: interestsLoaded } = useInterests();
  const { setSelectedTopic } = useTopicContext();
  const { t } = useLocalization();
  const { themeConfig } = useThemeContext();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<Category>('NEWS');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPremiumSheet, setShowPremiumSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch real-time data from server (includes videos for SOCIAL)
  const { topics: realtimeTopics, isLoading, error, source } = useCategoryData(activeCategory, { autoRefresh: isPremium });
  // Always fetch NEWS topics for wave ranking widget (independent of active category)
  const { topics: newsTopics } = useNewsData();

  // Watchlist: ユーザー追加銘柄
  const { watchlist, isLoaded: watchlistLoaded } = useWatchlist();
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const watchlistSymbols = watchlist.map((w) => w.symbol);
  const customQuotesQuery = trpc.data.getCustomQuotes.useQuery(watchlistSymbols, {
    enabled: activeCategory === 'MARKET' && watchlistSymbols.length > 0,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  // MARKET: デフォルト銘柄 + カスタム銘柄を統合
  const allMarketTopics: Topic[] = (() => {
    if (activeCategory !== 'MARKET') return realtimeTopics;
    const base = realtimeTopics;
    if (!customQuotesQuery.data?.quotes?.length) return base;
    const customTopics: Topic[] = customQuotesQuery.data.quotes.map((q) => {
      const wl = watchlist.find((w) => w.symbol === q.symbol);
      return {
        id: `custom_${q.symbol}`,
        category: 'MARKET' as const,
        title: `${wl?.name || q.symbol}`,
        summary: '',
        detail: '',
        waveLevel: Math.abs(q.changePercent) > 5 ? 'high' : Math.abs(q.changePercent) < 1 ? 'low' : 'medium' as any,
        waveSentiment: q.changePercent > 2 ? 'green' : q.changePercent > -2 ? 'blue' : 'red' as any,
        source: wl?.exchange || 'yahoo-finance',
        publishedAt: new Date().toISOString(),
        tags: ['watchlist'],
        marketPrice: q.price,
        marketChange: q.change,
        marketChangePercent: q.changePercent,
        marketCurrency: q.currency,
        marketSymbol: wl?.name || q.symbol,
        marketDayHigh: q.dayHigh,
        marketDayLow: q.dayLow,
        marketVolume: q.volume,
        marketGroup: wl?.group || '米国株',
      };
    });
    return [...base, ...customTopics];
  })();

  // MARKET: marketGroupフィールドでグループ化（カスタム銘柄も自動分類）
  const GROUP_ORDER = ['主要指標', '為替', '投資信託', '暗号通貨', 'コモディティ', '米国株', '日本株'];
  const marketGroups: { title: string; items: Topic[] }[] = (() => {
    if (activeCategory !== 'MARKET') return [];
    const byGroup: Record<string, Topic[]> = {};
    for (const t of allMarketTopics) {
      // カスタム銘柄はwatchlistのgroupを使用、なければmarketGroupから
      const g = t.marketGroup || '米国株';
      (byGroup[g] ??= []).push(t);
    }
    // 順序通りにグループ配列を生成（Free: 主要指標のみ）
    const allowedGroups = isPremium ? GROUP_ORDER : FREE_MARKET_GROUPS;
    return allowedGroups
      .filter((g) => byGroup[g]?.length)
      .map((g) => ({ title: g, items: byGroup[g] }));
  })();

  // Free: NEWS/SOCIAL 5件制限、MARKET 主要指標のみ
  const FREE_ITEM_LIMIT = 5;
  const FREE_MARKET_GROUPS = ['主要指標'];

  // 非MARKETはそのまま、MARKETはグループをFlatListのデータとして使う
  const topics: Topic[] = (() => {
    const raw = activeCategory === 'MARKET' ? allMarketTopics : realtimeTopics;
    if (isPremium) return raw;
    // Free制限: NEWS/SOCIALは5件
    if (activeCategory !== 'MARKET') return raw.slice(0, FREE_ITEM_LIMIT);
    return raw;
  })();

  // v2以降、全カテゴリが Free で閲覧可能。
  // 差別化はアイテム数と MARKET サブカテゴリの制限で実施するため、
  // カテゴリ単位のロック表示はもう出さない。
  const isLocked = plan === 'free' && !FREE_CATEGORIES.includes(activeCategory);

  const handleCategorySelect = (cat: Category) => {
    setActiveCategory(cat);
    setCurrentIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const showLoadingIndicator = isLoading && realtimeTopics.length === 0;

  const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 400);
  const ITEM_WIDTH = CARD_WIDTH + 16; // card + marginHorizontal*2 (8 each side)

  const handlePrev = () => {
    const total = activeCategory === 'MARKET' ? marketGroups.length : topics.length;
    const newIndex = currentIndex <= 0 ? total - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    scrollToCard(newIndex);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNext = () => {
    const total = activeCategory === 'MARKET' ? marketGroups.length : topics.length;
    const newIndex = currentIndex >= total - 1 ? 0 : currentIndex + 1;
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

  // Sync page indicator when momentum scroll ends
  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / ITEM_WIDTH);
      if (index >= 0 && index < topics.length) {
        setCurrentIndex(index);
      }
    },
    [ITEM_WIDTH, topics.length],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const currentTopic = topics[currentIndex];
  const dataSource = realtimeTopics.length > 0 ? source : isLoading ? '取得中...' : 'オフライン';
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
      <View style={[styles.header, { borderBottomColor: tc.border, backgroundColor: tc.background, paddingTop: Math.max(insets.top, 8) }]}>
        <PixelText variant="h1" color="primary">{t('app.title', 'SWELL')}</PixelText>
        <Text style={[styles.tagline, { color: tc.muted }]}>
          {t('app.tagline', '波を読む')} · {dataSource}
        </Text>
      </View>

      {/* Trial / Upgrade Banner */}
      <TrialBanner onUpgradePress={() => setShowPremiumSheet(true)} />

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

        {/* Topic FlatList / Market Group Cards */}
        {!showLoadingIndicator && (
          <View style={styles.cardArea}>
            {activeCategory === 'MARKET' ? (
              /* MARKET: グループカード表示 */
              <FlatList
                ref={flatListRef}
                data={marketGroups}
                keyExtractor={(group) => group.title}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.flatListContent}
                onViewableItemsChanged={onViewableItemsChanged}
                onMomentumScrollEnd={onMomentumScrollEnd}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item: group }) => (
                  <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
                    <MarketGroupCard
                      title={group.title}
                      items={group.items}
                      onItemPress={(item) => {
                        setSelectedTopic(item);
                        router.push({ pathname: '/topic/[id]', params: { id: item.id } });
                      }}
                    />
                  </View>
                )}
                getItemLayout={(_, index) => ({
                  length: ITEM_WIDTH,
                  offset: ITEM_WIDTH * index,
                  index,
                })}
              />
            ) : (
              /* NEWS / SOCIAL: 個別カード表示 */
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
                onMomentumScrollEnd={onMomentumScrollEnd}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => {
                  const isVideoItem = activeCategory === 'SOCIAL' && item.videoType;
                  return (
                    <View style={{ width: CARD_WIDTH, marginHorizontal: 8 }}>
                      {isVideoItem ? (
                        <VideoCard topic={item} cardWidth={CARD_WIDTH} />
                      ) : (
                        <TopicCard
                          topic={item}
                          category={activeCategory}
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
            )}

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
              disabled={(activeCategory === 'MARKET' ? marketGroups.length : topics.length) === 0}
              size={36}
            />
            <PageIndicator
              current={currentIndex}
              total={activeCategory === 'MARKET' ? marketGroups.length : topics.length}
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
              disabled={(activeCategory === 'MARKET' ? marketGroups.length : topics.length) === 0}
              size={36}
            />
          </View>
        )}

        {/* MARKET: 銘柄追加ボタン */}
        {activeCategory === 'MARKET' && !showLoadingIndicator && (
          <Pressable
            onPress={() => setShowWatchlistModal(true)}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: tc.surface, borderColor: tc.border, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.addBtnText, { color: tc.accent }]}>＋ 銘柄追加</Text>
          </Pressable>
        )}
      </View>

      {/* Tutorial (first launch) */}
      {!tutorialDone && <Tutorial />}

      {/* Premium Sheet */}
      {showPremiumSheet && (
        <PremiumSheet onClose={() => setShowPremiumSheet(false)} />
      )}

      {/* Watchlist Modal */}
      <WatchlistModal
        visible={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
      />

      {/* Onboarding (初回起動時) */}
      {interestsLoaded && onboardingDone === false && (
        <Onboarding onComplete={completeOnboarding} />
      )}

      {/* Trial Warning (トライアル終了警告) */}
      <TrialWarning onUpgrade={() => setShowPremiumSheet(true)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    // paddingTop is set dynamically in JSX using useSafeAreaInsets()
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
  addBtn: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
