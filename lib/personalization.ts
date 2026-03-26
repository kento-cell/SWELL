import { UserInterests, sortByPersonalization } from '@/hooks/use-user-interests';

export interface PersonalizedContent {
  id: string;
  title: string;
  category: string;
  relevanceScore: number;
}

/**
 * Filter content based on user interests
 * Returns content that matches user's interests, sorted by relevance
 */
export function filterByUserInterests<T extends { category?: string; id?: string }>(
  items: T[],
  userInterests: UserInterests | null,
  options?: {
    minRelevanceScore?: number;
    maxResults?: number;
  }
): T[] {
  const { minRelevanceScore = 0, maxResults = 50 } = options || {};

  if (!userInterests || userInterests.interests.length === 0) {
    return items.slice(0, maxResults);
  }

  // Filter by user interests
  const filtered = items.filter(item => {
    const category = item.category || '';
    return (
      userInterests.interests.includes(category) ||
      userInterests.viewedItems.includes(item.id || '')
    );
  });

  // If no items match user interests, return all items
  if (filtered.length === 0) {
    return items.slice(0, maxResults);
  }

  // Sort by personalization relevance
  const sorted = sortByPersonalization(filtered, userInterests);

  return sorted.slice(0, maxResults);
}

/**
 * Get recommended categories for user based on click patterns
 */
export function getRecommendedCategories(userInterests: UserInterests): string[] {
  if (!userInterests || userInterests.interests.length === 0) {
    return ['news', 'market', 'social'];
  }

  // Sort interests by click count
  const sorted = [...userInterests.interests].sort((a, b) => {
    const countA = userInterests.clickCount[a] || 0;
    const countB = userInterests.clickCount[b] || 0;
    return countB - countA;
  });

  return sorted;
}

/**
 * Calculate user engagement level (0-100)
 */
export function calculateEngagementLevel(userInterests: UserInterests): number {
  const totalClicks = Object.values(userInterests.clickCount).reduce((a, b) => a + b, 0);
  const interestDiversity = userInterests.interests.length;

  // Engagement = (total clicks * 10) + (diversity * 5), capped at 100
  const engagement = Math.min(totalClicks * 10 + interestDiversity * 5, 100);

  return Math.round(engagement);
}

/**
 * Get personalization summary for debugging
 */
export function getPersonalizationSummary(userInterests: UserInterests | null): {
  interests: string[];
  topCategories: string[];
  engagementLevel: number;
  viewedItemsCount: number;
} {
  if (!userInterests) {
    return {
      interests: [],
      topCategories: [],
      engagementLevel: 0,
      viewedItemsCount: 0,
    };
  }

  return {
    interests: userInterests.interests,
    topCategories: getRecommendedCategories(userInterests),
    engagementLevel: calculateEngagementLevel(userInterests),
    viewedItemsCount: userInterests.viewedItems.length,
  };
}
