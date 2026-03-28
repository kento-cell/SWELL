import { fetchHackerNewsTopStories, calculateWaveLevel, calculateWaveSentiment } from './news-client';
import { fetchAllSocialTrending, calculateSocialWaveSentiment } from './rss-social-client';
import { fetchHNSocialTrending, calculateSocialWaveSentiment as calculateHNSocialWaveSentiment, calculateSocialWaveLevel as calculateHNSocialWaveLevel } from './hackernews-social-client';
import { getBlueskySocialContent } from './bluesky-social-client';
import { fetchMarketTrendingV2, calculateMarketWaveLevel, calculateMarketWaveSentiment } from './market-client-v2';
import { cacheService, CACHE_CONFIG } from './cache-service';
import { fetchJapaneseNews } from './japanese-news-client';
import { fetchTrendingVideos } from './video-client';
import { getJapaneseStocks } from './japanese-stocks-client';
import { getMutualFunds } from './mutual-funds-client';
import { getCommodities } from './commodities-client';
import { getPokemonCards, getSneakers } from './collectibles-client';

export interface TopicData {
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
  // Video fields (SOCIAL category)
  videoId?: string;
  videoType?: 'youtube' | 'tiktok';
  thumbnail?: string;
  views?: string;
  duration?: string;
}

export interface CategoryData {
  category: 'NEWS' | 'SOCIAL' | 'MARKET';
  items: TopicData[];
  lastUpdated: number;
  source: string;
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  url: string;
  views: string;
  likes: string;
  source: 'youtube' | 'tiktok';
  publishedAt: string;
  duration?: string;
}

/**
 * Fetch NEWS category data (Japanese news + HackerNews)
 */
export async function fetchNewsData(): Promise<CategoryData> {
  const config = CACHE_CONFIG.NEWS;

  // Check cache first
  const cached = cacheService.get<CategoryData>(config.key);
  if (cached) {
    return cached;
  }

  // Check rate limit
  if (!cacheService.checkRateLimit(config.key, config.rateLimit.maxRequests, config.rateLimit.windowSeconds)) {
    console.warn('NEWS: Rate limit exceeded, using stale cache or empty data');
    return {
      category: 'NEWS',
      items: [],
      lastUpdated: Date.now(),
      source: 'HackerNews API (rate limited)',
    };
  }

  try {
    const items = await fetchHackerNewsTopStories();

    const topicItems: TopicData[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      sourceUrl: item.url,
      source: item.source,
      waveLevel: calculateWaveLevel(item.score),
      waveSentiment: calculateWaveSentiment(item.score, item.commentCount),
      timestamp: item.timestamp,
      score: item.score,
      commentCount: item.commentCount,
    }));

    const result: CategoryData = {
      category: 'NEWS',
      items: topicItems,
      lastUpdated: Date.now(),
      source: 'HackerNews API',
    };

    // Cache the result
    cacheService.set(config.key, result, config.ttl);

    return result;
  } catch (error) {
    console.error('Error fetching NEWS data:', error);
    return {
      category: 'NEWS',
      items: [],
      lastUpdated: Date.now(),
      source: 'HackerNews API (error)',
    };
  }
}

/**
 * Fetch SOCIAL category data (HackerNews Show HN + Ask HN + Bluesky)
 */
export async function fetchSocialData(): Promise<CategoryData> {
  const config = CACHE_CONFIG.SOCIAL;

  // Check cache first
  const cached = cacheService.get<CategoryData>(config.key);
  if (cached) {
    return cached;
  }

  // Check rate limit
  if (!cacheService.checkRateLimit(config.key, config.rateLimit.maxRequests, config.rateLimit.windowSeconds)) {
    console.warn('SOCIAL: Rate limit exceeded, using stale cache or empty data');
    return {
      category: 'SOCIAL',
      items: [],
      lastUpdated: Date.now(),
      source: 'HackerNews (Show HN / Ask HN)',
    };
  }

  try {
    // Fetch from HackerNews (Bluesky API endpoint not implemented)
    const hnItems = await fetchHNSocialTrending(20);

    // Convert HackerNews items
    const hnTopicItems: TopicData[] = hnItems.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      sourceUrl: item.sourceUrl,
      source: item.source,
      waveLevel: calculateHNSocialWaveLevel(item.score),
      waveSentiment: calculateHNSocialWaveSentiment(item.score, item.commentCount),
      timestamp: item.timestamp,
      score: item.score,
      commentCount: item.commentCount,
    }));

    const result: CategoryData = {
      category: 'SOCIAL',
      items: hnTopicItems.slice(0, 20),
      lastUpdated: Date.now(),
      source: 'HackerNews (Show HN / Ask HN)',
    };

    // Cache the result
    cacheService.set(config.key, result, config.ttl);

    return result;
  } catch (error) {
    console.error('Error fetching SOCIAL data:', error);
    return {
      category: 'SOCIAL',
      items: [],
      lastUpdated: Date.now(),
      source: 'HackerNews + Bluesky (error)',
    };
  }
}

/**
 * Fetch MARKET category data (Stocks + Funds + Commodities + Collectibles)
 */
export async function fetchMarketData(): Promise<CategoryData> {
  const config = CACHE_CONFIG.MARKET;

  // Check cache first
  const cached = cacheService.get<CategoryData>(config.key);
  if (cached) {
    return cached;
  }

  // Check rate limit
  if (!cacheService.checkRateLimit(config.key, config.rateLimit.maxRequests, config.rateLimit.windowSeconds)) {
    console.warn('MARKET: Rate limit exceeded, using stale cache or empty data');
    return {
      category: 'MARKET',
      items: [],
      lastUpdated: Date.now(),
      source: 'Multiple APIs (rate limited)',
    };
  }

  try {
    // Fetch all market data in parallel
    const [usStocks, jpStocks, funds, commodities, pokemonCards, sneakers] = await Promise.all([
      fetchMarketTrendingV2(), // US stocks
      getJapaneseStocks(),
      getMutualFunds(),
      getCommodities(),
      getPokemonCards(),
      getSneakers(),
    ]);

    // Combine all items (stocks + collectibles)
    const allItems = [
      ...usStocks,
      ...jpStocks,
      ...funds,
      ...commodities,
      ...pokemonCards,
      ...sneakers,
    ];

    // Convert to TopicData format with calculated wave metrics
    const topicItems: TopicData[] = allItems.map((item: any) => {
      // Calculate waveLevel based on absolute price change
      const absChange = Math.abs(item.changePercent || 0);
      let waveLevel: 'low' | 'medium' | 'high' = 'medium';
      if (absChange > 5) waveLevel = 'high';
      else if (absChange < 1) waveLevel = 'low';

      // Calculate waveSentiment based on price direction
      let waveSentiment: 'blue' | 'green' | 'yellow' | 'red' = 'green';
      const changePercent = item.changePercent || 0;
      if (changePercent > 3) waveSentiment = 'green';
      else if (changePercent > 0) waveSentiment = 'yellow';
      else if (changePercent > -3) waveSentiment = 'yellow';
      else waveSentiment = 'red';

      return {
        id: item.id || `${item.symbol || item.type}-${Date.now()}`,
        title: item.title || item.name || item.symbol || 'Unknown',
        url: item.url || item.sourceUrl || '',
        sourceUrl: item.url || item.sourceUrl || '',
        source: item.source || item.type || 'Market Data',
        waveLevel,
        waveSentiment,
        timestamp: item.timestamp || Date.now(),
        score: item.score,
        commentCount: item.commentCount,
        description: item.description || `Price: ${item.price ? '$' + item.price.toFixed(2) : 'N/A'} (${(item.changePercent || 0) > 0 ? '+' : ''}${(item.changePercent || 0).toFixed(2)}%)`,
      };
    });

    const result: CategoryData = {
      category: 'MARKET',
      items: topicItems.slice(0, 50), // Limit to 50 items
      lastUpdated: Date.now(),
      source: 'Yahoo Finance + TCGPlayer + StockX',
    };

    // Cache the result
    cacheService.set(config.key, result, config.ttl);

    return result;
  } catch (error) {
    console.error('Error fetching MARKET data:', error);
    return {
      category: 'MARKET',
      items: [],
      lastUpdated: Date.now(),
      source: 'Market APIs (error)',
    };
  }
}

/**
 * Fetch all category data in parallel
 */
export async function fetchAllCategoryData() {
  const [newsData, socialData, marketData] = await Promise.all([
    fetchNewsData(),
    fetchSocialData(),
    fetchMarketData(),
  ]);

  return {
    NEWS: newsData,
    SOCIAL: socialData,
    MARKET: marketData,
  };
}

/**
 * Fetch Japanese news data
 */
export async function fetchJapaneseNewsData(): Promise<CategoryData> {
  const config = CACHE_CONFIG.NEWS;

  // Check cache first
  const cached = cacheService.get<CategoryData>('japanese_news');
  if (cached) {
    return cached;
  }

  try {
    const topics = await fetchJapaneseNews();

    const items: TopicData[] = topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      url: topic.sourceUrl || '',
      sourceUrl: topic.sourceUrl || '',
      source: topic.source,
      waveLevel: topic.waveLevel,
      waveSentiment: topic.waveSentiment,
      timestamp: new Date(topic.publishedAt).getTime(),
      description: topic.summary,
    }));

    const result: CategoryData = {
      category: 'NEWS',
      items,
      lastUpdated: Date.now(),
      source: 'Japanese News (NHK, Asahi, Yahoo)',
    };

    // Cache the result
    cacheService.set('japanese_news', result, config.ttl);

    return result;
  } catch (error) {
    console.error('Error fetching Japanese news:', error);
    return {
      category: 'NEWS',
      items: [],
      lastUpdated: Date.now(),
      source: 'Japanese News (error)',
    };
  }
}

/**
 * Fetch trending videos
 */
export async function fetchVideosData(): Promise<CategoryData> {
  const config = CACHE_CONFIG.SOCIAL;

  // Check cache first
  const cached = cacheService.get<CategoryData>('trending_videos');
  if (cached) {
    return cached;
  }

  try {
    const videos = await fetchTrendingVideos('JP');

    const items: TopicData[] = videos.map((video) => ({
      // Use a prefixed ID to avoid collision with other data sources
      id: `yt_${video.id}`,
      title: video.title,
      url: video.url,
      sourceUrl: video.url,
      source: video.channelTitle || video.source,
      waveLevel: 'medium' as const,
      waveSentiment: 'green' as const,
      timestamp: new Date(video.publishedAt).getTime(),
      description: video.description,
      // Video metadata for WebView embed — videoId is the raw YouTube video ID
      videoId: video.id,
      videoType: video.source as 'youtube' | 'tiktok',
      thumbnail: video.thumbnail,
      views: video.views,
      duration: video.duration,
    }));

    const result: CategoryData = {
      category: 'SOCIAL',
      items,
      lastUpdated: Date.now(),
      source: 'YouTube/TikTok Trending',
    };

    cacheService.set('trending_videos', result, config.ttl);

    return result;
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return {
      category: 'SOCIAL',
      items: [],
      lastUpdated: Date.now(),
      source: 'YouTube/TikTok (error)',
    };
  }
}
