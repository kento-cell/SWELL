/**
 * Video Client — YouTube Data API v3
 *
 * 日本のトレンド動画をYouTube Data API v3で取得します。
 * APIキー: YOUTUBE_API_KEY 環境変数
 * 無料枠: 1日10,000クォータ（videos.list = 1クォータ/リクエスト）
 * 5分キャッシュで実質1日288リクエスト以下に抑制
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface VideoItem {
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
  channelTitle?: string;
}

/**
 * ISO 8601 duration (PT4M13S) → "4:13" 形式に変換
 */
function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0');
  const m = parseInt(match[2] || '0');
  const s = parseInt(match[3] || '0');
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * 再生回数を "1.2M回" 形式にフォーマット
 */
function formatViewCount(count: string): string {
  const n = parseInt(count || '0');
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M回`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K回`;
  return `${n}回`;
}

/**
 * YouTube Data API v3 で日本のトレンド動画を取得
 */
export async function fetchYouTubeTrendingVideos(
  regionCode: string = 'JP',
  maxResults: number = 20,
): Promise<VideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[VideoClient] YOUTUBE_API_KEY not set');
    return [];
  }

  try {
    // Step 1: mostPopular チャートから動画IDリストを取得
    const listUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    listUrl.searchParams.set('part', 'snippet,contentDetails,statistics');
    listUrl.searchParams.set('chart', 'mostPopular');
    listUrl.searchParams.set('regionCode', regionCode);
    listUrl.searchParams.set('maxResults', String(maxResults));
    listUrl.searchParams.set('hl', 'ja');
    listUrl.searchParams.set('key', apiKey);

    const res = await fetch(listUrl.toString());
    if (!res.ok) {
      const err = await res.text();
      console.error('[VideoClient] YouTube API error:', err);
      return [];
    }

    const data = await res.json() as {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          publishedAt: string;
          thumbnails: {
            maxres?: { url: string };
            high?: { url: string };
            medium?: { url: string };
          };
        };
        contentDetails: { duration: string };
        statistics: { viewCount?: string; likeCount?: string };
      }>;
    };

    if (!data.items || data.items.length === 0) {
      console.warn('[VideoClient] No trending videos found');
      return [];
    }

    const videos: VideoItem[] = data.items.map((item) => {
      const thumb =
        item.snippet.thumbnails.maxres?.url ||
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description?.slice(0, 200) || '',
        thumbnail: thumb,
        url: `https://www.youtube.com/watch?v=${item.id}`,
        views: formatViewCount(item.statistics.viewCount || '0'),
        likes: formatViewCount(item.statistics.likeCount || '0'),
        source: 'youtube',
        publishedAt: item.snippet.publishedAt,
        duration: parseDuration(item.contentDetails.duration),
        channelTitle: item.snippet.channelTitle,
      };
    });

    console.log(`[VideoClient] Fetched ${videos.length} trending videos from YouTube (${regionCode})`);
    return videos;
  } catch (error) {
    console.error('[VideoClient] Error fetching YouTube trending videos:', error);
    return [];
  }
}

/**
 * 統合エントリポイント（将来的にTikTok等を追加可能）
 */
export async function fetchTrendingVideos(region: string = 'JP'): Promise<VideoItem[]> {
  return fetchYouTubeTrendingVideos(region, 20);
}

/**
 * 数値フォーマット（後方互換）
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
