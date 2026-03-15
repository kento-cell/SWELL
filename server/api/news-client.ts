import axios from 'axios';

export interface HackerNewsStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: 'hackernews';
  sourceUrl: string;
  timestamp: number;
}

const HACKERNEWS_API = 'https://hacker-news.firebaseio.com/v0';
const TOP_STORIES_COUNT = 20;

/**
 * Fetch top stories from HackerNews
 * Rate limit: No official limit, but we respect 1 req/sec
 */
export async function fetchHackerNewsTopStories(): Promise<NewsItem[]> {
  try {
    // Get top story IDs
    const topStoriesRes = await axios.get<number[]>(
      `${HACKERNEWS_API}/topstories.json`,
      { timeout: 5000 }
    );

    const storyIds = topStoriesRes.data.slice(0, TOP_STORIES_COUNT);

    // Fetch story details in parallel
    const storyPromises = storyIds.map((id) =>
      axios.get<HackerNewsStory>(`${HACKERNEWS_API}/item/${id}.json`, {
        timeout: 5000,
      })
    );

    const storyResponses = await Promise.allSettled(storyPromises);

    const items: NewsItem[] = storyResponses
      .filter((res) => res.status === 'fulfilled' && res.value.data)
      .map((res) => {
        const story = (res as PromiseFulfilledResult<any>).value.data;
        return {
          id: `hn_${story.id}`,
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          score: story.score,
          commentCount: story.descendants || 0,
          source: 'hackernews',
          sourceUrl: `https://news.ycombinator.com/item?id=${story.id}`,
          timestamp: story.time * 1000, // Convert to milliseconds
        };
      });

    return items;
  } catch (error) {
    console.error('Error fetching HackerNews:', error);
    throw error;
  }
}

/**
 * Calculate wave level from score (0-100)
 */
export function calculateWaveLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 50) return 'low';
  if (score < 150) return 'medium';
  return 'high';
}

/**
 * Calculate wave sentiment from engagement ratio
 */
export function calculateWaveSentiment(
  score: number,
  commentCount: number
): 'blue' | 'green' | 'yellow' | 'red' {
  const engagementRatio = commentCount / Math.max(score, 1);

  // Blue: High score, low engagement (informational)
  if (score > 200 && engagementRatio < 0.3) return 'blue';

  // Green: Balanced engagement (positive discussion)
  if (engagementRatio >= 0.3 && engagementRatio < 0.6) return 'green';

  // Yellow: High engagement (controversial/trending)
  if (engagementRatio >= 0.6 && engagementRatio < 1.0) return 'yellow';

  // Red: Very high engagement (heated discussion)
  return 'red';
}
