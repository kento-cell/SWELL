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
          case 'NEWS': {
            // 日本語ニュースのみ（HackerNewsフォールバック廃止）
            const japaneseTopics = await fetchJapaneseNews();
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
              source: '日本語ニュース (NHK・朝日・BBC・Yahoo)',
            };
            break;
          }
          case 'SOCIAL':
            // SOCIALタブはHackerNews Show HN/Ask HNコミュニティコンテンツを表示
            data = await fetchSocialData();
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
  /**
   * Search stock symbols via Yahoo Finance
   */
  searchSymbol: publicProcedure
    .input(z.string().min(1).max(20))
    .query(async ({ input: query }) => {
      try {
        const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&lang=ja-JP`;
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (!response.ok) return { results: [] };
        const data = await response.json() as any;
        const results = (data.quotes || [])
          .filter((q: any) => q.symbol && q.quoteType !== 'OPTION')
          .map((q: any) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            exchange: q.exchDisp || q.exchange || '',
            type: q.quoteType || '',
          }));
        return { results };
      } catch (error) {
        console.error('[Search] Error:', error);
        return { results: [] };
      }
    }),

  /**
   * Fetch custom symbol quotes (for user watchlist)
   */
  getCustomQuotes: publicProcedure
    .input(z.array(z.string()).min(1).max(30))
    .query(async ({ input: symbols }) => {
      const { fetchStockPriceFromYahoo } = await import('./market-client-v2');
      const results = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const stock = await fetchStockPriceFromYahoo(symbol);
          if (!stock) return null;
          return {
            symbol,
            price: stock.price,
            change: stock.change,
            changePercent: stock.changePercent,
            currency: stock.currency || 'USD',
            dayHigh: stock.dayHigh,
            dayLow: stock.dayLow,
            volume: stock.volume,
          };
        })
      );
      return {
        quotes: results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
          .map((r) => r.value),
      };
    }),
});

export type DataRouter = typeof dataRouter;
