import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeUserInterests,
  saveUserInterests,
  recordUserInteraction,
  getPersonalizationScore,
  sortByPersonalization,
  type UserInterestData,
} from '../use-user-interests';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('useUserInterests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeUserInterests', () => {
    it('should create default interests if none exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const result = await initializeUserInterests();

      expect(result.interests).toBeDefined();
      expect(result.interests.NEWS).toBeDefined();
      expect(result.interests.SOCIAL).toBeDefined();
      expect(result.interests.MARKET).toBeDefined();
      expect(vi.mocked(AsyncStorage.setItem)).toHaveBeenCalled();
    });

    it('should load existing interests from storage', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 5, viewDuration: 10000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const result = await initializeUserInterests();

      expect(result).toEqual(mockData);
    });
  });

  describe('saveUserInterests', () => {
    it('should save interests to AsyncStorage', async () => {
      const data: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 1, viewDuration: 5000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      await saveUserInterests(data);

      expect(vi.mocked(AsyncStorage.setItem)).toHaveBeenCalledWith(
        'swell_user_interests',
        JSON.stringify(data)
      );
    });
  });

  describe('recordUserInteraction', () => {
    it('should increment click count for a category', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: Date.now(),
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      await recordUserInteraction('NEWS', 5000);

      const savedCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);

      expect(savedData.interests.NEWS.clickCount).toBe(1);
      expect(savedData.interests.NEWS.viewDuration).toBe(5000);
    });

    it('should accumulate view duration', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 1, viewDuration: 5000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      await recordUserInteraction('NEWS', 3000);

      const savedCall = vi.mocked(AsyncStorage.setItem).mock.calls[0];
      const savedData = JSON.parse(savedCall[1]);

      expect(savedData.interests.NEWS.clickCount).toBe(2);
      expect(savedData.interests.NEWS.viewDuration).toBe(8000);
    });
  });

  describe('getPersonalizationScore', () => {
    it('should return 0 for category with no interactions', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: Date.now(),
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const score = await getPersonalizationScore('NEWS');

      expect(score).toBe(0);
    });

    it('should calculate score based on click count and view duration', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 5, viewDuration: 30000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const score = await getPersonalizationScore('NEWS');

      // clickScore = 5/10 = 0.5, viewScore = 30000/60000 = 0.5
      // score = 0.5 * 0.6 + 0.5 * 0.4 = 0.3 + 0.2 = 0.5
      expect(score).toBe(0.5);
    });

    it('should cap scores at 1.0', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 20, viewDuration: 120000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const score = await getPersonalizationScore('NEWS');

      expect(score).toBe(1);
    });
  });

  describe('sortByPersonalization', () => {
    it('should sort items by personalization score', async () => {
      const mockData: UserInterestData = {
        interests: {
          NEWS: { category: 'NEWS', clickCount: 10, viewDuration: 60000, lastInteractedAt: 123456 },
          SOCIAL: { category: 'SOCIAL', clickCount: 5, viewDuration: 30000, lastInteractedAt: 123456 },
          MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
        },
        lastUpdated: 123456,
      };

      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify(mockData));

      const items = [
        { category: 'MARKET', title: 'Market' },
        { category: 'NEWS', title: 'News' },
        { category: 'SOCIAL', title: 'Social' },
      ];

      const sorted = await sortByPersonalization(items);

      expect(sorted[0].category).toBe('NEWS');
      expect(sorted[1].category).toBe('SOCIAL');
      expect(sorted[2].category).toBe('MARKET');
    });
  });
});
