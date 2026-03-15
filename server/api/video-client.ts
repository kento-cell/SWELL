import { callDataApi } from '@/server/_core/dataApi';

/**
 * Video Client
 * Fetches trending videos from YouTube and TikTok
 */

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
}

/**
 * Fetch trending videos from YouTube
 */
export async function fetchYouTubeTrendingVideos(region: string = 'JP'): Promise<VideoItem[]> {
  try {
    const result: any = await callDataApi('Youtube/search', {
      query: {
        q: 'trending',
        gl: region,
        hl: region === 'JP' ? 'ja' : 'en',
      },
    });

    if (!result || !result.contents) {
      console.warn('No YouTube results found');
      return [];
    }

    const videos: VideoItem[] = [];

    for (const content of result.contents.slice(0, 10)) {
      if (content.type === 'video' && content.video) {
        const video = content.video;
        videos.push({
          id: video.videoId || '',
          title: video.title || 'Untitled',
          description: video.descriptionSnippet || '',
          thumbnail: video.videoId ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : '',
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          views: video.viewCountText || '0 views',
          likes: '0 likes', // YouTube API doesn't provide likes in search results
          source: 'youtube',
          publishedAt: new Date().toISOString(),
          duration: video.lengthText || '',
        });
      }
    }

    return videos;
  } catch (error) {
    console.error('Error fetching YouTube trending videos:', error);
    return [];
  }
}

/**
 * Fetch trending videos from TikTok
 */
export async function fetchTikTokTrendingVideos(keyword: string = 'trending'): Promise<VideoItem[]> {
  try {
    const result: any = await callDataApi('Tiktok/search_tiktok_video_general', {
      query: {
        keyword,
      },
    });

    if (!result || !result.data) {
      console.warn('No TikTok results found');
      return [];
    }

    const videos: VideoItem[] = [];

    for (const video of result.data.slice(0, 10)) {
      const videoData = video.video || {};
      const stats = video.statistics || {};

      videos.push({
        id: video.aweme_id || '',
        title: video.desc?.slice(0, 100) || 'TikTok Video',
        description: video.desc || '',
        thumbnail: videoData.cover?.url || '',
        url: `https://www.tiktok.com/@${video.author?.unique_id}/video/${video.aweme_id}`,
        views: formatNumber(stats.play_count || 0),
        likes: formatNumber(stats.digg_count || 0),
        source: 'tiktok',
        publishedAt: new Date(
          (video.create_time || Math.floor(Date.now() / 1000)) * 1000,
        ).toISOString(),
      });
    }

    return videos;
  } catch (error) {
    console.error('Error fetching TikTok trending videos:', error);
    return [];
  }
}

/**
 * Fetch combined trending videos (YouTube + TikTok)
 */
export async function fetchTrendingVideos(region: string = 'JP'): Promise<VideoItem[]> {
  try {
    const [youtubeVideos, tiktokVideos] = await Promise.all([
      fetchYouTubeTrendingVideos(region),
      fetchTikTokTrendingVideos('トレンド'), // Japanese keyword for trending
    ]);

    // Combine and sort by recency
    const allVideos = [...youtubeVideos, ...tiktokVideos];
    allVideos.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    return allVideos.slice(0, 20); // Return top 20 videos
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    return [];
  }
}

/**
 * Format large numbers (e.g., 1000000 -> 1M)
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
