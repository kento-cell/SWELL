import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback } from 'react';

export interface UserInterests {
  interests: string[]; // e.g., ['tech', 'finance', 'entertainment']
  viewedItems: string[]; // e.g., ['AAPL', 'TSLA'] - latest 10
  clickCount: Record<string, number>; // e.g., { 'tech': 5, 'finance': 3 }
  lastUpdated: number; // timestamp
}

const STORAGE_KEY = 'swell_user_interests';
const MAX_VIEWED_ITEMS = 10;

/**
 * Initialize user interests with default values
 */
export async function initializeUserInterests(): Promise<UserInterests> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[useUserInterests] Failed to load interests:', error);
  }

  // Default interests
  const defaults: UserInterests = {
    interests: ['news', 'market', 'social'],
    viewedItems: [],
    clickCount: {},
    lastUpdated: Date.now(),
  };

  await saveUserInterests(defaults);
  return defaults;
}

/**
 * Save user interests to AsyncStorage
 */
export async function saveUserInterests(interests: UserInterests): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(interests));
  } catch (error) {
    console.error('[useUserInterests] Failed to save interests:', error);
  }
}

/**
 * Record user interaction with content
 */
export async function recordUserInteraction(
  category: string,
  itemId?: string
): Promise<void> {
  try {
    const interests = await initializeUserInterests();

    // Add category to interests if not present
    if (!interests.interests.includes(category)) {
      interests.interests.push(category);
    }

    // Increment click count for category
    interests.clickCount[category] = (interests.clickCount[category] || 0) + 1;

    // Add item to viewed items if provided
    if (itemId) {
      interests.viewedItems = [
        itemId,
        ...interests.viewedItems.filter(id => id !== itemId),
      ].slice(0, MAX_VIEWED_ITEMS);
    }

    interests.lastUpdated = Date.now();
    await saveUserInterests(interests);

    console.log('[useUserInterests] Recorded interaction:', { category, itemId });
  } catch (error) {
    console.error('[useUserInterests] Failed to record interaction:', error);
  }
}

/**
 * Get user interests hook
 */
export function useUserInterests() {
  const [interests, setInterests] = useState<UserInterests | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInterests = async () => {
      try {
        const data = await initializeUserInterests();
        setInterests(data);
      } catch (error) {
        console.error('[useUserInterests] Failed to load interests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInterests();
  }, []);

  const recordInteraction = useCallback(
    async (category: string, itemId?: string) => {
      await recordUserInteraction(category, itemId);
      // Reload interests after recording
      const updated = await initializeUserInterests();
      setInterests(updated);
    },
    []
  );

  return {
    interests,
    isLoading,
    recordInteraction,
  };
}

/**
 * Get personalization score for content
 * Higher score = more relevant to user
 */
export function getPersonalizationScore(
  contentCategory: string,
  userInterests: UserInterests | null
): number {
  if (!userInterests) return 0;

  let score = 0;

  // Score based on category interest
  if (userInterests.interests.includes(contentCategory)) {
    score += 10;
  }

  // Score based on click count
  const clickCount = userInterests.clickCount[contentCategory] || 0;
  score += Math.min(clickCount, 10); // Cap at 10

  return score;
}

/**
 * Sort content by personalization relevance
 */
export function sortByPersonalization<T extends { category?: string }>(
  items: T[],
  userInterests: UserInterests | null
): T[] {
  if (!userInterests) return items;

  return [...items].sort((a, b) => {
    const scoreA = getPersonalizationScore(a.category || '', userInterests);
    const scoreB = getPersonalizationScore(b.category || '', userInterests);
    return scoreB - scoreA;
  });
}
