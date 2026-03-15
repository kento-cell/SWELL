import { fetchHackerNewsTopStories, calculateWaveLevel, calculateWaveSentiment } from './news-client';
import { fetchAllSocialTrending, calculateSocialWaveSentiment } from './rss-social-client';
import { fetchMarketTrendingV2, calculateMarketWaveLevel, calculateMarketWaveSentiment } from './market-client-v2';
import { cacheService, CACHE_CONFIG } from './cache-service';

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
}

export interface CategoryData {
  category: 'NEWS' | 'SOCIAL' | 'MARKET';
  items: TopicData[];
  lastUpdated: number;
  source: string;
}

/**
 * Fetch NEWS category data
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
    const stories = await fetchHackerNewsTopStories();

    const items: TopicData[] = stories.map((story) => ({
      id: story.id,
      title: story.title,
      url: story.url,
      sourceUrl: story.sourceUrl,
      source: 'HackerNews',
      waveLevel: calculateWaveLevel(story.score),
      waveSentiment: calculateWaveSentiment(story.score, story.commentCount),
      timestamp: story.timestamp,
      score: story.score,
      commentCount: story.commentCount,
    }));

    const result: CategoryData = {
      category: 'NEWS',
      items,
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
 * Fetch SOCIAL category data
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
      source: 'RSS Feeds (rate limited)',
    };
  }

  try {
    const items = await fetchAllSocialTrending();

    const topicItems: TopicData[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      sourceUrl: item.sourceUrl,
      source: item.source === 'medium' ? 'Medium' : 'Product Hunt',
      waveLevel: item.score > 60 ? 'high' : item.score > 30 ? 'medium' : 'low',
      waveSentiment: calculateSocialWaveSentiment(item.score, item.commentCount),
      timestamp: item.timestamp,
      score: item.score,
      commentCount: item.commentCount,
      description: item.description,
    }));

    const result: CategoryData = {
      category: 'SOCIAL',
      items: topicItems,
      lastUpdated: Date.now(),
      source: 'RSS Feeds (Medium, Product Hunt)',
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
      source: 'RSS Feeds (error)',
    };
  }
}

/**
 * Fetch MARKET category data
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
      source: 'YahooFinance (rate limited)',
    };
  }

  try {
    const items = await fetchMarketTrendingV2();

    const topicItems: TopicData[] = items.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      sourceUrl: item.sourceUrl,
      source: 'YahooFinance',
      waveLevel: calculateMarketWaveLevel(item.change ?? 0),
      waveSentiment: calculateMarketWaveSentiment(item.change ?? 0),
      timestamp: item.timestamp,
      score: item.score,
      commentCount: item.commentCount,
      description: `Price: $${item.price?.toFixed(2)} (${(item.change ?? 0) > 0 ? '+' : ''}${(item.change ?? 0).toFixed(2)}%)`,
    }));

    const result: CategoryData = {
      category: 'MARKET',
      items: topicItems,
      lastUpdated: Date.now(),
      source: 'YahooFinance API',
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
      source: 'YahooFinance API (error)',
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
