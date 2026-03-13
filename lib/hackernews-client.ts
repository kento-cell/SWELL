import { Topic, WaveLevel, WaveSentiment } from './types';

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  kids?: number[];
  type: string;
}

/**
 * Estimate wave level based on HN score and comment count
 * Low: 0-50 points
 * Medium: 50-200 points
 * High: 200+ points
 */
function estimateWaveLevel(score: number, commentCount: number): WaveLevel {
  const totalActivity = score + commentCount * 2;
  if (totalActivity > 200) return 'high';
  if (totalActivity > 50) return 'medium';
  return 'low';
}

/**
 * Estimate wave sentiment based on keywords in title
 * This is a simple heuristic; in production you'd use NLP
 */
function estimateWaveSentiment(title: string): WaveSentiment {
  const lower = title.toLowerCase();

  // Negative keywords
  if (/crash|fail|bug|error|security|breach|hack|exploit|downtime|outage/.test(lower)) {
    return 'red';
  }

  // Positive keywords
  if (/launch|release|announce|new|feature|improve|growth|success|record|milestone/.test(lower)) {
    return 'green';
  }

  // Controversial keywords
  if (/debate|discuss|vs|versus|controversy|disagree|concern|warning/.test(lower)) {
    return 'yellow';
  }

  // Default to neutral
  return 'blue';
}

/**
 * Fetch top stories from HackerNews
 * Returns up to `limit` stories converted to Topic format
 * Uses cache to avoid hitting API too frequently
 */
export async function fetchHackerNewsTopics(limit: number = 15): Promise<Topic[]> {
  try {
    // Fetch top story IDs
    const topStoriesRes = await fetch(`${HN_API_BASE}/topstories.json`, {
      method: 'GET',
    });

    if (!topStoriesRes.ok) {
      throw new Error(`HN API error: ${topStoriesRes.status}`);
    }

    const storyIds: number[] = await topStoriesRes.json();
    const topIds = storyIds.slice(0, limit * 2); // Fetch extra to filter

    // Fetch story details in parallel
    const storyPromises = topIds.map((id) =>
      fetch(`${HN_API_BASE}/item/${id}.json`).then((res) => res.json() as Promise<HNStory>),
    );

    const stories = await Promise.all(storyPromises);

    // Convert to Topic format
    const topics: Topic[] = stories
      .filter((story) => story && story.type === 'story' && story.title)
      .slice(0, limit)
      .map((story, index) => {
        const commentCount = story.kids?.length ?? 0;
        const waveLevel = estimateWaveLevel(story.score, commentCount);
        const waveSentiment = estimateWaveSentiment(story.title);

        return {
          id: `hn-${story.id}`,
          category: 'NEWS',
          title: story.title,
          summary: `${story.score} points · ${commentCount} comments`,
          detail: `From HackerNews: ${story.title}\n\nScore: ${story.score}\nComments: ${commentCount}\nPosted by: ${story.by}`,
          waveLevel,
          waveSentiment,
          source: 'HackerNews',
          sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          publishedAt: new Date(story.time * 1000).toISOString(),
          tags: ['tech', 'news', 'hackernews'],
        };
      });

    return topics;
  } catch (error) {
    console.error('Failed to fetch HackerNews topics:', error);
    return [];
  }
}

/**
 * Fetch stories from a specific HN category
 * Valid categories: top, new, best, ask, show, job
 */
export async function fetchHackerNewsByCategory(
  category: 'top' | 'new' | 'best' | 'ask' | 'show' | 'job' = 'top',
  limit: number = 15,
): Promise<Topic[]> {
  try {
    const endpoint = `${HN_API_BASE}/${category}stories.json`;
    const res = await fetch(endpoint);

    if (!res.ok) {
      throw new Error(`HN API error: ${res.status}`);
    }

    const storyIds: number[] = await res.json();
    const topIds = storyIds.slice(0, limit * 2);

    const storyPromises = topIds.map((id) =>
      fetch(`${HN_API_BASE}/item/${id}.json`).then((res) => res.json() as Promise<HNStory>),
    );

    const stories = await Promise.all(storyPromises);

    const topics: Topic[] = stories
      .filter((story) => story && story.type === 'story' && story.title)
      .slice(0, limit)
      .map((story) => {
        const commentCount = story.kids?.length ?? 0;
        const waveLevel = estimateWaveLevel(story.score, commentCount);
        const waveSentiment = estimateWaveSentiment(story.title);

        return {
          id: `hn-${story.id}`,
          category: 'NEWS',
          title: story.title,
          summary: `${story.score} points · ${commentCount} comments`,
          detail: `From HackerNews (${category}): ${story.title}\n\nScore: ${story.score}\nComments: ${commentCount}\nPosted by: ${story.by}`,
          waveLevel,
          waveSentiment,
          source: `HackerNews (${category})`,
          sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          publishedAt: new Date(story.time * 1000).toISOString(),
          tags: ['tech', 'news', 'hackernews', category],
        };
      });

    return topics;
  } catch (error) {
    console.error(`Failed to fetch HackerNews ${category} stories:`, error);
    return [];
  }
}
