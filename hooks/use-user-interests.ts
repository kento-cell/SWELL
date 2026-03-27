import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserInterest {
  category: string;
  clickCount: number;
  viewDuration: number; // milliseconds
  lastInteractedAt: number; // timestamp
}

export interface UserInterestData {
  interests: Record<string, UserInterest>;
  lastUpdated: number;
}

const STORAGE_KEY = 'swell_user_interests';
const DEFAULT_INTERESTS: UserInterestData = {
  interests: {
    NEWS: { category: 'NEWS', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
    SOCIAL: { category: 'SOCIAL', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
    MARKET: { category: 'MARKET', clickCount: 0, viewDuration: 0, lastInteractedAt: 0 },
  },
  lastUpdated: Date.now(),
};

/**
 * Initialize user interests from AsyncStorage or create default
 */
export async function initializeUserInterests(): Promise<UserInterestData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load user interests:', error);
  }
  
  // Create default interests
  await saveUserInterests(DEFAULT_INTERESTS);
  return DEFAULT_INTERESTS;
}

/**
 * Save user interests to AsyncStorage
 */
export async function saveUserInterests(data: UserInterestData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save user interests:', error);
  }
}

/**
 * Record user interaction (click/view)
 */
export async function recordUserInteraction(
  category: string,
  viewDuration: number = 0
): Promise<void> {
  try {
    const data = await initializeUserInterests();
    
    if (!data.interests[category]) {
      data.interests[category] = {
        category,
        clickCount: 0,
        viewDuration: 0,
        lastInteractedAt: 0,
      };
    }
    
    const interest = data.interests[category];
    interest.clickCount += 1;
    interest.viewDuration += viewDuration;
    interest.lastInteractedAt = Date.now();
    data.lastUpdated = Date.now();
    
    await saveUserInterests(data);
  } catch (error) {
    console.error('Failed to record user interaction:', error);
  }
}

/**
 * Calculate personalization score for a category (0-1)
 * Based on click count and view duration
 */
export async function getPersonalizationScore(category: string): Promise<number> {
  try {
    const data = await initializeUserInterests();
    const interest = data.interests[category];
    
    if (!interest) return 0;
    
    // Score formula: (clickCount * 0.6 + viewDuration / 1000 * 0.4) / max
    // Normalize to 0-1 range
    const clickScore = Math.min(interest.clickCount / 10, 1); // Max 10 clicks
    const viewScore = Math.min(interest.viewDuration / 60000, 1); // Max 60 seconds
    
    return clickScore * 0.6 + viewScore * 0.4;
  } catch (error) {
    console.error('Failed to get personalization score:', error);
    return 0;
  }
}

/**
 * Sort items by personalization score
 */
export async function sortByPersonalization<T extends { category: string }>(
  items: T[]
): Promise<T[]> {
  try {
    const scores = await Promise.all(
      items.map(async (item) => ({
        item,
        score: await getPersonalizationScore(item.category),
      }))
    );
    
    return scores
      .sort((a, b) => b.score - a.score)
      .map((s) => s.item);
  } catch (error) {
    console.error('Failed to sort by personalization:', error);
    return items;
  }
}

/**
 * React hook for managing user interests
 */
export function useUserInterests() {
  const [interests, setInterests] = useState<UserInterestData | null>(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const data = await initializeUserInterests();
        setInterests(data);
      } catch (error) {
        console.error('Failed to initialize interests:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const recordInteraction = async (category: string, viewDuration: number = 0) => {
    await recordUserInteraction(category, viewDuration);
    const data = await initializeUserInterests();
    setInterests(data);
  };

  const getScore = async (category: string): Promise<number> => {
    return getPersonalizationScore(category);
  };

  return {
    interests,
    loading,
    recordInteraction,
    getScore,
  };
}
