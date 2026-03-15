import axios from 'axios';

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  selftext?: string;
}

export interface SocialItem {
  id: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: 'reddit';
  sourceUrl: string;
  timestamp: number;
  subreddit: string;
}

const REDDIT_API = 'https://www.reddit.com/api/v1';
const REDDIT_OAUTH = 'https://oauth.reddit.com';

// Reddit OAuth credentials (from environment)
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || '';
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || '';
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'Swell/1.0';

let redditAccessToken: string = '';
let tokenExpiresAt: number = 0;

/**
 * Get Reddit OAuth access token
 */
async function getRedditAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (redditAccessToken.length > 0 && Date.now() < tokenExpiresAt) {
    return redditAccessToken;
  }

  try {
    const response = await axios.post(
      `${REDDIT_API}/access_token`,
      'grant_type=client_credentials',
      {
        auth: {
          username: REDDIT_CLIENT_ID,
          password: REDDIT_CLIENT_SECRET,
        },
        headers: {
          'User-Agent': REDDIT_USER_AGENT,
        },
        timeout: 5000,
      }
    );

    redditAccessToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    return redditAccessToken || '';
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    throw error;
  }
}

/**
 * Fetch posts from Reddit subreddit
 */
async function fetchRedditSubreddit(
  subreddit: string,
  limit: number = 10
): Promise<SocialItem[]> {
  try {
    const token = await getRedditAccessToken();

    const response = await axios.get(
      `${REDDIT_OAUTH}/r/${subreddit}/hot?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': REDDIT_USER_AGENT,
        },
        timeout: 5000,
      }
    );

    const posts: RedditPost[] = response.data.data.children.map(
      (child: any) => child.data
    );

    return posts.map((post) => ({
      id: `reddit_${post.id}`,
      title: post.title,
      url: post.url.startsWith('http') ? post.url : `https://reddit.com${post.permalink}`,
      score: post.score,
      commentCount: post.num_comments,
      source: 'reddit',
      sourceUrl: `https://reddit.com${post.permalink}`,
      timestamp: post.created_utc * 1000,
      subreddit: post.subreddit,
    }));
  } catch (error) {
    console.error(`Error fetching Reddit r/${subreddit}:`, error);
    throw error;
  }
}

/**
 * Fetch trending posts from multiple subreddits
 */
export async function fetchRedditTrending(): Promise<SocialItem[]> {
  const subreddits = ['worldnews', 'news', 'technology', 'business'];

  try {
    const allPosts = await Promise.all(
      subreddits.map((sub) => fetchRedditSubreddit(sub, 5))
    );

    // Flatten and sort by score
    const merged = allPosts.flat().sort((a, b) => b.score - a.score);

    return merged.slice(0, 20);
  } catch (error) {
    console.error('Error fetching Reddit trending:', error);
    throw error;
  }
}

/**
 * Calculate wave sentiment from Reddit engagement
 */
export function calculateRedditWaveSentiment(
  score: number,
  commentCount: number
): 'blue' | 'green' | 'yellow' | 'red' {
  const engagementRatio = commentCount / Math.max(score, 1);

  // Blue: Informational (high score, low engagement)
  if (score > 5000 && engagementRatio < 0.1) return 'blue';

  // Green: Positive discussion (balanced)
  if (engagementRatio >= 0.1 && engagementRatio < 0.3) return 'green';

  // Yellow: Trending (high engagement)
  if (engagementRatio >= 0.3 && engagementRatio < 0.6) return 'yellow';

  // Red: Controversial (very high engagement)
  return 'red';
}
