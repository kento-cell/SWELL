import axios from 'axios';
import { parseStringPromise } from 'xml2js';

export interface SocialItem {
  id: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: 'medium' | 'producthunt';
  sourceUrl: string;
  timestamp: number;
  author?: string;
  description?: string;
}

// RSS Feed URLs
const RSS_FEEDS = {
  medium: 'https://medium.com/feed/tag/technology',
  producthunt: 'https://www.producthunt.com/feed.xml',
};

/**
 * Fetch and parse RSS feed
 */
async function fetchRSSFeed(url: string): Promise<any[]> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Swell/1.0 (RSS Reader)',
      },
    });

    const parsed = await parseStringPromise(response.data);
    return parsed.rss?.channel?.[0]?.item || [];
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

/**
 * Parse Medium RSS feed
 */
export async function fetchMediumTrending(): Promise<SocialItem[]> {
  try {
    const items = await fetchRSSFeed(RSS_FEEDS.medium);

    return items.slice(0, 10).map((item: any, index: number) => {
      const title = item.title?.[0] || 'Untitled';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || new Date().toISOString();
      const description = item.description?.[0] || '';
      const creator = item['dc:creator']?.[0] || 'Anonymous';

      // Estimate engagement based on description length and recency
      const descLength = description.length;
      const score = Math.min(100, Math.floor(descLength / 50) + 10);
      const commentCount = Math.floor(score * 0.3);

      return {
        id: `medium_${index}`,
        title: title.substring(0, 100),
        url: link,
        score,
        commentCount,
        source: 'medium',
        sourceUrl: link,
        timestamp: new Date(pubDate).getTime(),
        author: creator,
        description: description.substring(0, 200),
      };
    });
  } catch (error) {
    console.error('Error fetching Medium trending:', error);
    return [];
  }
}

/**
 * Parse Product Hunt RSS feed
 */
export async function fetchProductHuntTrending(): Promise<SocialItem[]> {
  try {
    const items = await fetchRSSFeed(RSS_FEEDS.producthunt);

    return items.slice(0, 10).map((item: any, index: number) => {
      const title = item.title?.[0] || 'Untitled';
      const link = item.link?.[0] || '';
      const pubDate = item.pubDate?.[0] || new Date().toISOString();
      const description = item.description?.[0] || '';
      const creator = item['dc:creator']?.[0] || 'Anonymous';

      // Product Hunt items often have engagement info in description
      // Estimate based on position (earlier = higher engagement)
      const score = Math.max(50, 100 - index * 5);
      const commentCount = Math.floor(score * 0.4);

      return {
        id: `producthunt_${index}`,
        title: title.substring(0, 100),
        url: link,
        score,
        commentCount,
        source: 'producthunt',
        sourceUrl: link,
        timestamp: new Date(pubDate).getTime(),
        author: creator,
        description: description.substring(0, 200),
      };
    });
  } catch (error) {
    console.error('Error fetching Product Hunt trending:', error);
    return [];
  }
}

/**
 * Fetch all social trending items
 */
export async function fetchAllSocialTrending(): Promise<SocialItem[]> {
  try {
    const [mediumItems, phItems] = await Promise.all([
      fetchMediumTrending(),
      fetchProductHuntTrending(),
    ]);

    // Merge and sort by score
    const merged = [...mediumItems, ...phItems].sort((a, b) => b.score - a.score);

    return merged.slice(0, 20);
  } catch (error) {
    console.error('Error fetching all social trending:', error);
    return [];
  }
}

/**
 * Calculate wave sentiment from engagement
 */
export function calculateSocialWaveSentiment(
  score: number,
  commentCount: number
): 'blue' | 'green' | 'yellow' | 'red' {
  const engagementRatio = commentCount / Math.max(score, 1);

  if (score > 80 && engagementRatio < 0.2) return 'blue';
  if (engagementRatio >= 0.2 && engagementRatio < 0.4) return 'green';
  if (engagementRatio >= 0.4 && engagementRatio < 0.6) return 'yellow';
  return 'red';
}
