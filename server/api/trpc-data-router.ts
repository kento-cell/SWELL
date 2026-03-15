import { publicProcedure, router } from '../_core/trpc';
import { fetchNewsData, fetchSocialData, fetchMarketData, fetchAllCategoryData } from './data-router';
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
            data = await fetchNewsData();
            break;
          case 'SOCIAL':
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
});

export type DataRouter = typeof dataRouter;
