/**
 * ユーザー興味ジャンル管理フック
 *
 * 初回起動時に選択した興味ジャンルを保存し、
 * NEWS/SOCIALのフィード表示優先順位に反映する。
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'swell_user_interests';
const ONBOARDING_KEY = 'swell_onboarding_done';

export interface InterestCategory {
  id: string;
  label: string;
  emoji: string;
  group: 'news' | 'social' | 'market';
}

export const AVAILABLE_INTERESTS: InterestCategory[] = [
  // NEWS系
  { id: 'politics', label: '政治', emoji: '🏛️', group: 'news' },
  { id: 'economy', label: '経済', emoji: '📊', group: 'news' },
  { id: 'international', label: '国際', emoji: '🌏', group: 'news' },
  { id: 'tech', label: 'テクノロジー', emoji: '💻', group: 'news' },
  { id: 'science', label: '科学', emoji: '🔬', group: 'news' },
  { id: 'society', label: '社会', emoji: '🏘️', group: 'news' },
  { id: 'sports', label: 'スポーツ', emoji: '⚽', group: 'news' },
  { id: 'entertainment', label: 'エンタメ', emoji: '🎬', group: 'news' },
  // SOCIAL/バズ系
  { id: 'viral', label: 'バズ・炎上', emoji: '🔥', group: 'social' },
  { id: 'life', label: '生活・ライフハック', emoji: '💡', group: 'social' },
  { id: 'food', label: 'グルメ・料理', emoji: '🍜', group: 'social' },
  { id: 'anime', label: 'アニメ・マンガ', emoji: '🎮', group: 'social' },
  { id: 'money', label: 'お金・投資', emoji: '💰', group: 'social' },
  { id: 'relationship', label: '恋愛・人間関係', emoji: '💬', group: 'social' },
];

export function useInterests() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [onboardingDone, setOnboardingDoneState] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [stored, done] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      if (stored) setSelectedIds(JSON.parse(stored));
      setOnboardingDoneState(done === 'true');
      setIsLoaded(true);
    })();
  }, []);

  const saveInterests = useCallback(async (ids: string[]) => {
    setSelectedIds(ids);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const completeOnboarding = useCallback(async (ids: string[]) => {
    await saveInterests(ids);
    setOnboardingDoneState(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }, [saveInterests]);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  return {
    selectedIds,
    onboardingDone,
    isLoaded,
    toggle,
    saveInterests,
    completeOnboarding,
    interests: AVAILABLE_INTERESTS,
  };
}
