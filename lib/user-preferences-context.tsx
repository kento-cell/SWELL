import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserPreferences {
  // Topic interests (0-100 score)
  interests: {
    technology: number;
    business: number;
    science: number;
    entertainment: number;
    sports: number;
    health: number;
  };
  // Preferred stocks
  favoriteStocks: string[];
  // Interaction history for algorithm
  viewedTopics: string[];
  clickedTopics: string[];
  savedTopics: string[];
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  updateInterests: (interests: Partial<UserPreferences['interests']>) => Promise<void>;
  addFavoriteStock: (symbol: string) => Promise<void>;
  removeFavoriteStock: (symbol: string) => Promise<void>;
  trackTopicView: (topicId: string) => Promise<void>;
  trackTopicClick: (topicId: string) => Promise<void>;
  saveTopicForLater: (topicId: string) => Promise<void>;
  getRecommendationScore: (topicKeywords: string[]) => number;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: UserPreferences = {
  interests: {
    technology: 50,
    business: 50,
    science: 50,
    entertainment: 50,
    sports: 50,
    health: 50,
  },
  favoriteStocks: ['AAPL', 'GOOGL', 'MSFT'],
  viewedTopics: [],
  clickedTopics: [],
  savedTopics: [],
};

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from AsyncStorage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('user_preferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await AsyncStorage.setItem('user_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  };

  const updateInterests = async (interests: Partial<UserPreferences['interests']>) => {
    const updated = {
      ...preferences,
      interests: { ...preferences.interests, ...interests },
    };
    await savePreferences(updated);
  };

  const addFavoriteStock = async (symbol: string) => {
    if (!preferences.favoriteStocks.includes(symbol)) {
      const updated = {
        ...preferences,
        favoriteStocks: [...preferences.favoriteStocks, symbol],
      };
      await savePreferences(updated);
    }
  };

  const removeFavoriteStock = async (symbol: string) => {
    const updated = {
      ...preferences,
      favoriteStocks: preferences.favoriteStocks.filter((s) => s !== symbol),
    };
    await savePreferences(updated);
  };

  const trackTopicView = async (topicId: string) => {
    const updated = {
      ...preferences,
      viewedTopics: [topicId, ...preferences.viewedTopics.slice(0, 49)], // Keep last 50
    };
    await savePreferences(updated);
  };

  const trackTopicClick = async (topicId: string) => {
    const updated = {
      ...preferences,
      clickedTopics: [topicId, ...preferences.clickedTopics.slice(0, 49)], // Keep last 50
    };
    await savePreferences(updated);
  };

  const saveTopicForLater = async (topicId: string) => {
    if (!preferences.savedTopics.includes(topicId)) {
      const updated = {
        ...preferences,
        savedTopics: [...preferences.savedTopics, topicId],
      };
      await savePreferences(updated);
    }
  };

  /**
   * Calculate recommendation score based on user interests and keywords
   * Higher score = more relevant to user
   */
  const getRecommendationScore = (topicKeywords: string[]): number => {
    let score = 50; // Base score

    const keywordLower = topicKeywords.map((k) => k.toLowerCase());

    // Technology keywords
    if (
      keywordLower.some((k) =>
        ['ai', 'machine learning', 'blockchain', 'crypto', 'tech', 'software', 'programming'].includes(k),
      )
    ) {
      score += preferences.interests.technology * 0.3;
    }

    // Business keywords
    if (
      keywordLower.some((k) =>
        ['startup', 'business', 'market', 'economy', 'finance', 'investment'].includes(k),
      )
    ) {
      score += preferences.interests.business * 0.3;
    }

    // Science keywords
    if (
      keywordLower.some((k) =>
        ['science', 'research', 'study', 'discovery', 'physics', 'biology'].includes(k),
      )
    ) {
      score += preferences.interests.science * 0.3;
    }

    // Entertainment keywords
    if (keywordLower.some((k) => ['entertainment', 'movie', 'music', 'game', 'video'].includes(k))) {
      score += preferences.interests.entertainment * 0.3;
    }

    // Sports keywords
    if (keywordLower.some((k) => ['sports', 'game', 'match', 'team', 'player'].includes(k))) {
      score += preferences.interests.sports * 0.3;
    }

    // Health keywords
    if (
      keywordLower.some((k) =>
        ['health', 'medical', 'disease', 'fitness', 'wellness', 'nutrition'].includes(k),
      )
    ) {
      score += preferences.interests.health * 0.3;
    }

    // Boost score if topic was recently clicked
    if (preferences.clickedTopics.length > 0) {
      score += 10; // Small boost for engagement
    }

    return Math.min(score, 100); // Cap at 100
  };

  if (isLoading) {
    return null; // Or return a loading screen
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updateInterests,
        addFavoriteStock,
        removeFavoriteStock,
        trackTopicView,
        trackTopicClick,
        saveTopicForLater,
        getRecommendationScore,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
