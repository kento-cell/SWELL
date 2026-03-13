import { Topic, WaveLevel, WaveSentiment } from './types';

interface RSSFeed {
  url: string;
  name: string;
  category: 'NEWS' | 'SOCIAL' | 'MARKET';
}

/**
 * Popular RSS feeds for different categories
 * All are free and don't require authentication
 */
export const POPULAR_RSS_FEEDS: RSSFeed[] = [
  // NEWS
  { url: 'https://feeds.bloomberg.com/markets/news.rss', name: 'Bloomberg Markets', category: 'NEWS' },
  { url: 'https://feeds.reuters.com/reuters/businessNews', name: 'Reuters Business', category: 'NEWS' },
  { url: 'https://feeds.cnbc.com/cnbc/financials', name: 'CNBC Financials', category: 'NEWS' },
  { url: 'https://www.techcrunch.com/feed/', name: 'TechCrunch', category: 'NEWS' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', category: 'NEWS' },

  // MARKET
  { url: 'https://feeds.bloomberg.com/markets/commodities.rss', name: 'Bloomberg Commodities', category: 'MARKET' },
  { url: 'https://feeds.cnbc.com/cnbc/world_markets', name: 'CNBC World Markets', category: 'MARKET' },
  { url: 'https://feeds.bloomberg.com/markets/stocks.rss', name: 'Bloomberg Stocks', category: 'MARKET' },

  // SOCIAL (News about social trends)
  { url: 'https://feeds.theverge.com/theverge/index.xml', name: 'The Verge', category: 'SOCIAL' },
  { url: 'https://feeds.wired.com/wired/index', name: 'Wired', category: 'SOCIAL' },
];

/**
 * Simple XML parser for RSS feeds
 * Extracts title, description, link, and pubDate from RSS items
 */
function parseRSSXML(xmlText: string): Array<{
  title: string;
  description: string;
  link: string;
  pubDate: string;
}> {
  const items: Array<{ title: string; description: string; link: string; pubDate: string }> = [];

  try {
    // Simple regex-based parsing (not a full XML parser)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(itemContent);
      const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/.exec(itemContent);
      const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/.exec(itemContent);

      if (titleMatch) {
        items.push({
          title: stripHTML(titleMatch[1]),
          description: stripHTML(descMatch?.[1] ?? ''),
          link: stripHTML(linkMatch?.[1] ?? ''),
          pubDate: pubDateMatch?.[1] ?? new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('RSS parsing error:', error);
  }

  return items;
}

/**
 * Remove HTML tags from text
 */
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

/**
 * Estimate wave level based on text length and keywords
 */
function estimateWaveLevel(title: string, description: string): WaveLevel {
  const text = (title + ' ' + description).toLowerCase();
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;

  const intensity = exclamationCount + questionCount * 0.5;

  if (intensity > 3) return 'high';
  if (intensity > 1) return 'medium';
  return 'low';
}

/**
 * Estimate wave sentiment based on keywords
 */
function estimateWaveSentiment(title: string): WaveSentiment {
  const lower = title.toLowerCase();

  // Negative keywords
  if (/crash|fail|bug|error|security|breach|hack|exploit|downtime|outage|loss|decline|drop/.test(lower)) {
    return 'red';
  }

  // Positive keywords
  if (/launch|release|announce|new|feature|improve|growth|success|record|milestone|gain|rise|surge/.test(lower)) {
    return 'green';
  }

  // Controversial keywords
  if (/debate|discuss|vs|versus|controversy|disagree|concern|warning|alert|caution/.test(lower)) {
    return 'yellow';
  }

  // Default to neutral
  return 'blue';
}

/**
 * Fetch and parse a single RSS feed
 */
export async function fetchRSSFeed(feedUrl: string, feedName: string, category: 'NEWS' | 'SOCIAL' | 'MARKET'): Promise<Topic[]> {
  try {
    // Use CORS proxy to avoid CORS issues
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
    const response = await fetch(corsProxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.status}`);
    }

    const xmlText = await response.text();
    const items = parseRSSXML(xmlText);

    const topics: Topic[] = items.slice(0, 5).map((item, index) => {
      const waveLevel = estimateWaveLevel(item.title, item.description);
      const waveSentiment = estimateWaveSentiment(item.title);

      return {
        id: `rss-${feedName}-${index}-${Date.now()}`,
        category,
        title: item.title,
        summary: item.description.substring(0, 100) + (item.description.length > 100 ? '...' : ''),
        detail: item.description || item.title,
        waveLevel,
        waveSentiment,
        source: feedName,
        sourceUrl: item.link,
        publishedAt: item.pubDate,
        tags: ['rss', feedName.toLowerCase()],
      };
    });

    return topics;
  } catch (error) {
    console.error(`Failed to fetch RSS feed from ${feedName}:`, error);
    return [];
  }
}

/**
 * Fetch multiple RSS feeds in parallel
 */
export async function fetchMultipleRSSFeeds(feeds: RSSFeed[]): Promise<Topic[]> {
  const promises = feeds.map((feed) => fetchRSSFeed(feed.url, feed.name, feed.category));
  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * Fetch RSS feeds by category
 */
export async function fetchRSSFeedsByCategory(category: 'NEWS' | 'SOCIAL' | 'MARKET'): Promise<Topic[]> {
  const categoryFeeds = POPULAR_RSS_FEEDS.filter((f) => f.category === category);
  return fetchMultipleRSSFeeds(categoryFeeds);
}
