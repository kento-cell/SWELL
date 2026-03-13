import AsyncStorage from '@react-native-async-storage/async-storage';
import { Topic, Category } from './types';
import { MOCK_TOPICS, getTopicsByCategory as getMockTopicsByCategory } from './mock-data';
import { fetchHackerNewsTopics, fetchHackerNewsByCategory } from './hackernews-client';
import { fetchRSSFeedsByCategory, POPULAR_RSS_FEEDS } from './rss-client';

export type DataSource = 'mock' | 'hackernews' | 'rss';

const DATA_SOURCE_KEY = 'swell_data_source';
const CACHE_KEY_PREFIX = 'swell_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: Topic[];
  timestamp: number;
}

/**
 * Get the currently selected data source
 */
export async function getCurrentDataSource(): Promise<DataSource> {
  try {
    const stored = await AsyncStorage.getItem(DATA_SOURCE_KEY);
    return (stored as DataSource) || 'mock';
  } catch {
    return 'mock';
  }
}

/**
 * Set the data source
 */
export async function setDataSource(source: DataSource): Promise<void> {
  await AsyncStorage.setItem(DATA_SOURCE_KEY, source);
}

/**
 * Check if cache is still valid
 */
function isCacheValid(entry: CacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Get cache key for a category
 */
function getCacheKey(source: DataSource, category: Category): string {
  return `${CACHE_KEY_PREFIX}${source}_${category}`;
}

/**
 * Get topics from cache if available
 */
async function getFromCache(source: DataSource, category: Category): Promise<Topic[] | null> {
  try {
    const key = getCacheKey(source, category);
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry = JSON.parse(cached);
    if (isCacheValid(entry)) {
      return entry.data;
    }

    // Cache expired, remove it
    await AsyncStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Save topics to cache
 */
async function saveToCache(source: DataSource, category: Category, topics: Topic[]): Promise<void> {
  try {
    const key = getCacheKey(source, category);
    const entry: CacheEntry = {
      data: topics,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Failed to save cache:', error);
  }
}

/**
 * Get topics from the selected data source
 */
export async function getTopicsByCategory(
  category: Category,
  source?: DataSource,
): Promise<Topic[]> {
  const dataSource = source || (await getCurrentDataSource());

  // Check cache first
  const cached = await getFromCache(dataSource, category);
  if (cached && cached.length > 0) {
    return cached;
  }

  let topics: Topic[] = [];

  try {
    switch (dataSource) {
      case 'hackernews':
        topics = await fetchHackerNewsByCategory('top', 15);
        break;

      case 'rss':
        topics = await fetchRSSFeedsByCategory(category);
        break;

      case 'mock':
      default:
        topics = getMockTopicsByCategory(category);
        break;
    }
  } catch (error) {
    console.error(`Failed to fetch topics from ${dataSource}:`, error);
    // Fallback to mock data on error
    topics = getMockTopicsByCategory(category);
  }

  // Save to cache
  if (topics.length > 0) {
    await saveToCache(dataSource, category, topics);
  }

  return topics;
}

/**
 * Get all topics from the selected data source
 */
export async function getAllTopics(source?: DataSource): Promise<Topic[]> {
  const dataSource = source || (await getCurrentDataSource());
  const categories: Category[] = ['NEWS', 'SOCIAL', 'MARKET'];

  const promises = categories.map((cat) => getTopicsByCategory(cat, dataSource));
  const results = await Promise.all(promises);

  return results.flat();
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Get available data sources
 */
export function getAvailableDataSources(): Array<{ id: DataSource; label: string; description: string }> {
  return [
    {
      id: 'mock',
      label: 'モックデータ',
      description: 'サンプルデータ（オフライン対応）',
    },
    {
      id: 'hackernews',
      label: 'HackerNews',
      description: 'テック系ニュース（リアルタイム）',
    },
    {
      id: 'rss',
      label: 'RSS フィード',
      description: '複数の主要メディア（リアルタイム）',
    },
  ];
}

/**
 * Get RSS feed list
 */
export function getRSSFeedList() {
  return POPULAR_RSS_FEEDS;
}
