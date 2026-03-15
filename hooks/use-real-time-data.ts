import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { Topic, Category } from '@/lib/types';

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
  };
}

/**
 * Hook to fetch real-time NEWS data
 */
export function useNewsData() {
  const query = trpc.data.getNews.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const topics = query.data?.data?.items?.map((item) => convertToTopic(item, 'NEWS')) || [];

  return {
    topics,
    isLoading: query.isLoading,
    error: query.error,
    source: query.data?.data?.source || 'Unknown',
  };
}

/**
 * Hook to fetch real-time SOCIAL data
 */
export function useSocialData() {
  const query = trpc.data.getSocial.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const topics = query.data?.data?.items?.map((item) => convertToTopic(item, 'SOCIAL')) || [];

  return {
    topics,
    isLoading: query.isLoading,
    error: query.error,
    source: query.data?.data?.source || 'Unknown',
  };
}

/**
 * Hook to fetch real-time MARKET data
 */
export function useMarketData() {
  const query = trpc.data.getMarket.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const topics = query.data?.data?.items?.map((item) => convertToTopic(item, 'MARKET')) || [];

  return {
    topics,
    isLoading: query.isLoading,
    error: query.error,
    source: query.data?.data?.source || 'Unknown',
  };
}

/**
 * Hook to fetch specific category data
 */
export function useCategoryData(category: Category) {
  const query = trpc.data.getByCategory.useQuery(category, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const topics = query.data?.data?.items?.map((item) => convertToTopic(item, category)) || [];

  return {
    topics,
    isLoading: query.isLoading,
    error: query.error,
    source: query.data?.data?.source || 'Unknown',
  };
}

/**
 * Hook to fetch all category data
 */
export function useAllData() {
  const query = trpc.data.getAll.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  const newsTopics = query.data?.data?.NEWS?.items?.map((item) => convertToTopic(item, 'NEWS')) || [];
  const socialTopics = query.data?.data?.SOCIAL?.items?.map((item) => convertToTopic(item, 'SOCIAL')) || [];
  const marketTopics = query.data?.data?.MARKET?.items?.map((item) => convertToTopic(item, 'MARKET')) || [];

  return {
    NEWS: {
      topics: newsTopics,
      source: query.data?.data?.NEWS?.source || 'Unknown',
    },
    SOCIAL: {
      topics: socialTopics,
      source: query.data?.data?.SOCIAL?.source || 'Unknown',
    },
    MARKET: {
      topics: marketTopics,
      source: query.data?.data?.MARKET?.source || 'Unknown',
    },
    isLoading: query.isLoading,
    error: query.error,
  };
}
