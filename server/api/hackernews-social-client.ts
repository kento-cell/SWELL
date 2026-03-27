/**
 * HackerNews Social Client
 * 
 * HackerNews の「Show HN」セクションからコミュニティ共有コンテンツを取得
 * 無料・制限なし・キャッシング対応
 * 
 * API: https://hacker-news.firebaseio.com/v0/
 * - showstories: コミュニティが共有するプロジェクト・ツール・記事
 * - レート制限なし（ただし5分キャッシュで抑制）
 */

const HN_API_BASE = 'https://hacker-news.firebaseio.com/v0';

export interface HNSocialItem {
  id: string;
  title: string;
  url: string;
  sourceUrl: string;
  source: string;
  score: number;
  commentCount: number;
  timestamp: number;
  author?: string;
  type: 'show' | 'ask' | 'poll';
}

/**
 * HackerNews Show HN ストーリーを取得
 * 「Show HN」はコミュニティが作成したプロジェクト・ツール・記事の共有セクション
 */
export async function fetchHNShowStories(maxResults: number = 20): Promise<HNSocialItem[]> {
  try {
    // Step 1: Show HN ストーリーIDリストを取得
    const storiesRes = await fetch(`${HN_API_BASE}/showstories.json`);
    if (!storiesRes.ok) {
      console.error('[HNSocialClient] Failed to fetch show stories list');
      return [];
    }

    const storyIds: number[] = await storiesRes.json();
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      console.warn('[HNSocialClient] No show stories found');
      return [];
    }

    // Step 2: 最初の maxResults 件のストーリー詳細を並行取得
    const topStoryIds = storyIds.slice(0, Math.min(maxResults * 2, 100)); // バッファ確保
    const storyDetails = await Promise.all(
      topStoryIds.map((id) =>
        fetch(`${HN_API_BASE}/item/${id}.json`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    );

    // Step 3: 有効なストーリーをフィルタリングしてマッピング
    const items: HNSocialItem[] = storyDetails
      .filter((story) => story && story.url) // URL がないストーリーは除外
      .slice(0, maxResults)
      .map((story) => ({
        id: String(story.id),
        title: story.title || 'Untitled',
        url: story.url || '',
        sourceUrl: story.url || '',
        source: 'HackerNews (Show HN)',
        score: story.score || 0,
        commentCount: story.descendants || 0,
        timestamp: (story.time || 0) * 1000, // Unix timestamp → ms
        author: story.by || 'Anonymous',
        type: 'show',
      }));

    return items;
  } catch (error) {
    console.error('[HNSocialClient] Error fetching show stories:', error);
    return [];
  }
}

/**
 * HackerNews Ask HN ストーリーを取得
 * 「Ask HN」はコミュニティが質問を投稿するセクション
 */
export async function fetchHNAskStories(maxResults: number = 20): Promise<HNSocialItem[]> {
  try {
    // Step 1: Ask HN ストーリーIDリストを取得
    const storiesRes = await fetch(`${HN_API_BASE}/askstories.json`);
    if (!storiesRes.ok) {
      console.error('[HNSocialClient] Failed to fetch ask stories list');
      return [];
    }

    const storyIds: number[] = await storiesRes.json();
    if (!Array.isArray(storyIds) || storyIds.length === 0) {
      console.warn('[HNSocialClient] No ask stories found');
      return [];
    }

    // Step 2: 最初の maxResults 件のストーリー詳細を並行取得
    const topStoryIds = storyIds.slice(0, Math.min(maxResults * 2, 100));
    const storyDetails = await Promise.all(
      topStoryIds.map((id) =>
        fetch(`${HN_API_BASE}/item/${id}.json`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    );

    // Step 3: 有効なストーリーをフィルタリングしてマッピング
    const items: HNSocialItem[] = storyDetails
      .filter((story) => story) // 削除されたストーリーは除外
      .slice(0, maxResults)
      .map((story) => ({
        id: String(story.id),
        title: story.title || 'Untitled',
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        sourceUrl: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        source: 'HackerNews (Ask HN)',
        score: story.score || 0,
        commentCount: story.descendants || 0,
        timestamp: (story.time || 0) * 1000,
        author: story.by || 'Anonymous',
        type: 'ask',
      }));

    return items;
  } catch (error) {
    console.error('[HNSocialClient] Error fetching ask stories:', error);
    return [];
  }
}

/**
 * HackerNews Show HN + Ask HN を統合取得
 * スコア順でソート
 */
export async function fetchHNSocialTrending(maxResults: number = 20): Promise<HNSocialItem[]> {
  try {
    // 並行取得
    const [showStories, askStories] = await Promise.all([
      fetchHNShowStories(maxResults),
      fetchHNAskStories(maxResults),
    ]);

    // 統合してスコア順でソート
    const combined = [...showStories, ...askStories]
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return combined;
  } catch (error) {
    console.error('[HNSocialClient] Error fetching social trending:', error);
    return [];
  }
}

/**
 * Wave sentiment を計算（HackerNews スコア・コメント数ベース）
 */
export function calculateSocialWaveSentiment(
  score: number,
  commentCount: number
): 'blue' | 'green' | 'yellow' | 'red' {
  // スコア + コメント数の加重合計で判定
  const engagement = score * 0.7 + commentCount * 0.3;

  if (engagement > 200) return 'red'; // 非常に高い関心
  if (engagement > 100) return 'yellow'; // 高い関心
  if (engagement > 50) return 'green'; // 中程度の関心
  return 'blue'; // 低い関心
}

/**
 * Wave level を計算（HackerNews スコアベース）
 */
export function calculateSocialWaveLevel(score: number): 'low' | 'medium' | 'high' {
  if (score > 150) return 'high';
  if (score > 50) return 'medium';
  return 'low';
}
