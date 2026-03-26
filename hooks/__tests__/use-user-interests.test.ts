import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initializeUserInterests,
  saveUserInterests,
  recordUserInteraction,
  getPersonalizationScore,
  sortByPersonalization,
  UserInterests,
} from '../use-user-interests';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('useUserInterests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeUserInterests', () => {
    it('should return default interests when none are stored', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const result = await initializeUserInterests();

      expect(result.interests).toEqual(['news', 'market', 'social']);
      expect(result.viewedItems).toEqual([]);
      expect(result.clickCount).toEqual({});
      expect(result.lastUpdated).toBeGreaterThan(0);
    });

    it('should return stored interests if they exist', async () => {
      const stored: UserInterests = {
        interests: ['tech', 'finance'],
        viewedItems: ['AAPL', 'TSLA'],
        clickCount: { tech: 5, finance: 3 },
        lastUpdated: 1234567890,
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(stored));

      const result = await initializeUserInterests();

      expect(result).toEqual(stored);
    });
  });

  describe('saveUserInterests', () => {
    it('should save interests to AsyncStorage', async () => {
      const interests: UserInterests = {
        interests: ['tech'],
        viewedItems: ['AAPL'],
        clickCount: { tech: 1 },
        lastUpdated: Date.now(),
      };

      await saveUserInterests(interests);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'swell_user_interests',
        JSON.stringify(interests)
      );
    });
  });

  describe('recordUserInteraction', () => {
    it('should add new category to interests', async () => {
      const stored: UserInterests = {
        interests: ['news'],
        viewedItems: [],
        clickCount: {},
        lastUpdated: 1234567890,
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(stored));

      await recordUserInteraction('finance', 'AAPL');

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(
        (AsyncStorage.setItem as any).mock.calls[0][1]
      );

      expect(savedData.interests).toContain('finance');
      expect(savedData.clickCount.finance).toBe(1);
      expect(savedData.viewedItems).toContain('AAPL');
    });

    it('should increment click count for existing category', async () => {
      const stored: UserInterests = {
        interests: ['tech'],
        viewedItems: [],
        clickCount: { tech: 3 },
        lastUpdated: 1234567890,
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(stored));

      await recordUserInteraction('tech', 'GOOGL');

      const savedData = JSON.parse(
        (AsyncStorage.setItem as any).mock.calls[0][1]
      );

      expect(savedData.clickCount.tech).toBe(4);
    });

    it('should maintain max 10 viewed items', async () => {
      const viewedItems = Array.from({ length: 10 }, (_, i) => `ITEM${i}`);
      const stored: UserInterests = {
        interests: ['tech'],
        viewedItems,
        clickCount: { tech: 1 },
        lastUpdated: 1234567890,
      };

      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(stored));

      await recordUserInteraction('tech', 'NEWITEM');

      const savedData = JSON.parse(
        (AsyncStorage.setItem as any).mock.calls[0][1]
      );

      expect(savedData.viewedItems.length).toBe(10);
      expect(savedData.viewedItems[0]).toBe('NEWITEM');
      expect(savedData.viewedItems).not.toContain('ITEM9');
    });
  });

  describe('getPersonalizationScore', () => {
    it('should return 0 when interests are null', () => {
      const score = getPersonalizationScore('tech', null);
      expect(score).toBe(0);
    });

    it('should return higher score for interested categories', () => {
      const interests: UserInterests = {
        interests: ['tech', 'finance'],
        viewedItems: [],
        clickCount: { tech: 5, finance: 2 },
        lastUpdated: Date.now(),
      };

      const techScore = getPersonalizationScore('tech', interests);
      const financeScore = getPersonalizationScore('finance', interests);
      const otherScore = getPersonalizationScore('sports', interests);

      expect(techScore).toBeGreaterThan(financeScore);
      expect(financeScore).toBeGreaterThan(otherScore);
      expect(otherScore).toBe(0);
    });

    it('should cap click count at 10', () => {
      const interests: UserInterests = {
        interests: ['tech'],
        viewedItems: [],
        clickCount: { tech: 100 },
        lastUpdated: Date.now(),
      };

      const score = getPersonalizationScore('tech', interests);

      // Base score (10) + capped click count (10) = 20
      expect(score).toBe(20);
    });
  });

  describe('sortByPersonalization', () => {
    it('should sort items by personalization score', () => {
      const interests: UserInterests = {
        interests: ['tech', 'finance'],
        viewedItems: [],
        clickCount: { tech: 5, finance: 2 },
        lastUpdated: Date.now(),
      };

      const items = [
        { id: '1', category: 'sports' },
        { id: '2', category: 'tech' },
        { id: '3', category: 'finance' },
      ];

      const sorted = sortByPersonalization(items, interests);

      expect(sorted[0].category).toBe('tech');
      expect(sorted[1].category).toBe('finance');
      expect(sorted[2].category).toBe('sports');
    });

    it('should return original items when interests are null', () => {
      const items = [
        { id: '1', category: 'tech' },
        { id: '2', category: 'finance' },
      ];

      const sorted = sortByPersonalization(items, null);

      expect(sorted).toEqual(items);
    });
  });
});
