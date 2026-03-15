import { publicProcedure, router } from '../_core/trpc';
import { fetchNewsData, fetchSocialData, fetchMarketData, fetchAllCategoryData, fetchJapaneseNewsData, fetchVideosData } from './data-router';
import { fetchJapaneseNews } from './japanese-news-client';
import { z } from 'zod';

/**
 * TRPC data router for real-time data fetching
 * Provides access to NEWS, SOCIAL, and MARKET category data
 */
export const dataRouter = router({
  /**
   * Fetch NEWS category data (HackerNews)
   */
  getNews: publicProcedure.query(async () => {
    try {
      const data = await fetchNewsData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching news data:', error);
      return {
        success: false,
        error: 'Failed to fetch news data',
        data: {
          category: 'NEWS' as const,
          items: [],
          lastUpdated: Date.now(),
          source: 'Error',
        },
      };
    }
  }),

  /**
   * Fetch SOCIAL category data (RSS feeds from Medium, Product Hunt)
   */
  getSocial: publicProcedure.query(async () => {
    try {
      const data = await fetchSocialData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching social data:', error);
      return {
        success: false,
        error: 'Failed to fetch social data',
        data: {
          category: 'SOCIAL' as const,
          items: [],
          lastUpdated: Date.now(),
          source: 'Error',
        },
      };
    }
  }),

  /**
   * Fetch Japanese news data
   */
  getJapaneseNews: publicProcedure.query(async () => {
    try {
      const data = await fetchJapaneseNewsData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching Japanese news:', error);
      return {
        success: false,
        error: 'Failed to fetch Japanese news',
        data: {
          category: 'NEWS' as const,
          items: [],
          lastUpdated: Date.now(),
          source: 'Error',
        },
      };
    }
  }),

  /**
   * Fetch trending videos (YouTube + TikTok)
   */
  getVideos: publicProcedure.query(async () => {
    try {
      const data = await fetchVideosData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching videos:', error);
      return {
        success: false,
        error: 'Failed to fetch videos',
        data: [],
      };
    }
  }),

  /**
   * Fetch MARKET category data (Alpha Vantage stocks & crypto)
   */
  getMarket: publicProcedure.query(async () => {
    try {
      const data = await fetchMarketData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return {
        success: false,
        error: 'Failed to fetch market data',
        data: {
          category: 'MARKET' as const,
          items: [],
          lastUpdated: Date.now(),
          source: 'Error',
        },
      };
    }
  }),

  /**
   * Fetch all category data in parallel
   */
  getAll: publicProcedure.query(async () => {
    try {
      const data = await fetchAllCategoryData();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching all data:', error);
      return {
        success: false,
        error: 'Failed to fetch all data',
        data: {
          NEWS: {
            category: 'NEWS' as const,
            items: [],
            lastUpdated: Date.now(),
            source: 'Error',
          },
          SOCIAL: {
            category: 'SOCIAL' as const,
            items: [],
            lastUpdated: Date.now(),
            source: 'Error',
          },
          MARKET: {
            category: 'MARKET' as const,
            items: [],
            lastUpdated: Date.now(),
            source: 'Error',
          },
        },
      };
    }
  }),

  /**
   * Fetch specific category
   */
  getByCategory: publicProcedure
    .input(z.enum(['NEWS', 'SOCIAL', 'MARKET']))
    .query(async ({ input: category }) => {
      try {
        let data;
        switch (category) {
          case 'NEWS':
            // 日本語ニュース（RSS + LLM 要約）を優先、失敗時は HackerNews にフォールバック
            try {
              const japaneseTopics = await fetchJapaneseNews();
              if (japaneseTopics.length > 0) {
                data = {
                  category: 'NEWS' as const,
                  items: japaneseTopics.map((t) => ({
                    id: t.id,
                    title: t.title,
                    url: t.sourceUrl || '',
                    sourceUrl: t.sourceUrl || '',
                    source: t.source,
                    waveLevel: t.waveLevel,
                    waveSentiment: t.waveSentiment,
                    timestamp: new Date(t.publishedAt).getTime(),
                    description: t.summary,
                  })),
                  lastUpdated: Date.now(),
                  source: '日本語ニュース (NHK・朝日・毎日・Yahoo)',
                };
              } else {
                data = await fetchNewsData();
              }
            } catch {
              data = await fetchNewsData();
            }
            break;
          case 'SOCIAL':
            const socialData = await fetchSocialData();
            const videosData = await fetchVideosData();
            data = {
              ...socialData,
              items: [
                ...(socialData.items || []),
                ...(videosData.items || []),
              ],
            };
            break;
          case 'MARKET':
            data = await fetchMarketData();
            break;
        }
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error(`Error fetching ${category} data:`, error);
        return {
          success: false,
          error: `Failed to fetch ${category} data`,
          data: {
            category,
            items: [],
            lastUpdated: Date.now(),
            source: 'Error',
          },
        };
      }
    }),
});

export type DataRouter = typeof dataRouter;
