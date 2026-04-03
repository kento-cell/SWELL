import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Topic, Category } from '@/lib/types';
import { getApiBaseUrl } from '@/constants/oauth';

interface TopicData {
  id: string;
  title: string;
  url: string;
  sourceUrl: string;
  source: string;
  waveLevel: 'low' | 'medium' | 'high';
  waveSentiment: 'blue' | 'green' | 'yellow' | 'red';
  timestamp: number;
  score?: number;
  commentCount?: number;
  description?: string;
  // Video fields
  videoId?: string;
  videoType?: 'youtube' | 'tiktok';
  thumbnail?: string;
  views?: string;
  duration?: string;
  // Market fields
  marketPrice?: number;
  marketChange?: number;
  marketChangePercent?: number;
  marketCurrency?: string;
  marketSymbol?: string;
  marketDayHigh?: number;
  marketDayLow?: number;
  marketVolume?: number;
  marketGroup?: string;
}

interface CategoryData {
  category: string;
  items: TopicData[];
  lastUpdated: number;
  source: string;
}

/**
 * Convert server TopicData to client Topic format
 */
function convertToTopic(data: TopicData, category: Category): Topic {
  return {
    id: data.id,
    category,
    title: data.title,
    summary: data.description?.substring(0, 100) || `${data.source} - ${data.title}`,
    detail: data.description || data.title,
    waveLevel: data.waveLevel,
    waveSentiment: data.waveSentiment,
    source: data.source,
    sourceUrl: data.sourceUrl,
    publishedAt: new Date(data.timestamp).toISOString(),
    tags: [data.source.toLowerCase()],
    // Video fields (pass through for SOCIAL)
    videoId: data.videoId,
    videoType: data.videoType,
    thumbnail: data.thumbnail,
    views: data.views,
    duration: data.duration,
    // Market fields (pass through for MARKET)
    marketPrice: data.marketPrice,
    marketChange: data.marketChange,
    marketChangePercent: data.marketChangePercent,
    marketCurrency: data.marketCurrency,
    marketSymbol: data.marketSymbol,
    marketDayHigh: data.marketDayHigh,
    marketDayLow: data.marketDayLow,
    marketVolume: data.marketVolume,
    marketGroup: data.marketGroup,
  };
}

/**
 * カテゴリ名 → 静的JSONファイル名
 */
const CATEGORY_FILE: Record<Category, string> = {
  NEWS: 'news',
  SOCIAL: 'social',
  MARKET: 'market',
};

/**
 * 静的JSONからカテゴリデータを取得
 * tRPCを経由せずCDN配信可能なJSONを直接fetch
 */
async function fetchStaticCategoryData(category: Category): Promise<CategoryData> {
  const baseUrl = getApiBaseUrl();
  const file = CATEGORY_FILE[category];
  const url = `${baseUrl}/data/${file}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Static fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Hook to fetch NEWS data
 * 静的JSON優先、失敗時はtRPCフォールバック
 */
export function useNewsData() {
  // 静的JSON取得
  const staticQuery = useQuery({
    queryKey: ['static', 'NEWS'],
    queryFn: () => fetchStaticCategoryData('NEWS'),
    refetchInterval: 2 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  // tRPCフォールバック（静的JSON失敗時のみ有効化）
  const trpcQuery = trpc.data.getByCategory.useQuery('NEWS', {
    enabled: !!staticQuery.error,
    refetchInterval: 2 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const activeData = staticQuery.data || trpcQuery.data?.data;
  const topics = activeData?.items?.map((item) => convertToTopic(item, 'NEWS')) || [];

  return {
    topics,
    isLoading: staticQuery.isLoading && trpcQuery.isLoading,
    error: staticQuery.error && trpcQuery.error ? trpcQuery.error : null,
    source: activeData?.source || 'Unknown',
  };
}

/**
 * Hook to fetch SOCIAL data
 */
export function useSocialData() {
  const staticQuery = useQuery({
    queryKey: ['static', 'SOCIAL'],
    queryFn: () => fetchStaticCategoryData('SOCIAL'),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const trpcQuery = trpc.data.getSocial.useQuery(undefined, {
    enabled: !!staticQuery.error,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const activeData = staticQuery.data || trpcQuery.data?.data;
  const topics = activeData?.items?.map((item) => convertToTopic(item, 'SOCIAL')) || [];

  return {
    topics,
    isLoading: staticQuery.isLoading && trpcQuery.isLoading,
    error: staticQuery.error && trpcQuery.error ? trpcQuery.error : null,
    source: activeData?.source || 'Unknown',
  };
}

/**
 * Hook to fetch MARKET data
 */
export function useMarketData() {
  const staticQuery = useQuery({
    queryKey: ['static', 'MARKET'],
    queryFn: () => fetchStaticCategoryData('MARKET'),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const trpcQuery = trpc.data.getMarket.useQuery(undefined, {
    enabled: !!staticQuery.error,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const activeData = staticQuery.data || trpcQuery.data?.data;
  const topics = activeData?.items?.map((item) => convertToTopic(item, 'MARKET')) || [];

  return {
    topics,
    isLoading: staticQuery.isLoading && trpcQuery.isLoading,
    error: staticQuery.error && trpcQuery.error ? trpcQuery.error : null,
    source: activeData?.source || 'Unknown',
  };
}

/**
 * Hook to fetch specific category data
 * 静的JSON優先、tRPCフォールバック
 */
export function useCategoryData(category: Category, options?: { autoRefresh?: boolean }) {
  const autoRefresh = options?.autoRefresh !== false; // デフォルトtrue
  const interval = category === 'NEWS' ? 2 * 60 * 1000 : 5 * 60 * 1000;

  const staticQuery = useQuery({
    queryKey: ['static', category],
    queryFn: () => fetchStaticCategoryData(category),
    refetchInterval: autoRefresh ? interval : false,
    staleTime: interval,
    gcTime: interval * 2,
    retry: 1,
  });

  const trpcQuery = trpc.data.getByCategory.useQuery(category, {
    enabled: !!staticQuery.error,
    refetchInterval: autoRefresh ? interval : false,
    staleTime: interval,
  });

  const activeData = staticQuery.data || trpcQuery.data?.data;
  const topics = activeData?.items?.map((item) => convertToTopic(item, category)) || [];

  return {
    topics,
    isLoading: staticQuery.isLoading && (!staticQuery.error || trpcQuery.isLoading),
    error: staticQuery.error && trpcQuery.error ? trpcQuery.error : null,
    source: activeData?.source || 'Unknown',
  };
}

/**
 * Hook to fetch all category data
 */
export function useAllData() {
  const news = useCategoryData('NEWS');
  const social = useCategoryData('SOCIAL');
  const market = useCategoryData('MARKET');

  return {
    NEWS: { topics: news.topics, source: news.source },
    SOCIAL: { topics: social.topics, source: social.source },
    MARKET: { topics: market.topics, source: market.source },
    isLoading: news.isLoading || social.isLoading || market.isLoading,
    error: news.error || social.error || market.error,
  };
}
