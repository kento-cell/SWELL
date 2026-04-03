import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlanType } from './types';

const PLAN_KEY = 'swell_user_plan';
const TUTORIAL_KEY = 'swell_tutorial_done';
const INSTALL_DATE_KEY = 'swell_install_date';
const TRIAL_DAYS = 7;

interface PlanContextValue {
  /** 現在の実効プラン（トライアル中はpremium） */
  plan: PlanType;
  /** 課金済みかどうか */
  isSubscribed: boolean;
  /** トライアル中かどうか */
  isTrial: boolean;
  /** トライアル残日数（0以下ならトライアル終了） */
  trialDaysLeft: number;
  /** 課金状態を設定（RevenueCat連携用） */
  setPlan: (plan: PlanType) => void;
  /** Premium機能が使えるか（トライアル or 課金済み） */
  isPremium: boolean;
  tutorialDone: boolean;
  setTutorialDone: () => void;
}

const PlanContext = createContext<PlanContextValue>({
  plan: 'free',
  isSubscribed: false,
  isTrial: true,
  trialDaysLeft: TRIAL_DAYS,
  setPlan: () => {},
  isPremium: true,
  tutorialDone: false,
  setTutorialDone: () => {},
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [installDate, setInstallDate] = useState<Date | null>(null);
  const [tutorialDone, setTutorialDoneState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedPlan, storedTutorial, storedInstallDate] = await Promise.all([
        AsyncStorage.getItem(PLAN_KEY),
        AsyncStorage.getItem(TUTORIAL_KEY),
        AsyncStorage.getItem(INSTALL_DATE_KEY),
      ]);

      // 課金状態
      if (storedPlan === 'premium') setIsSubscribed(true);

      // チュートリアル
      if (storedTutorial === 'true') setTutorialDoneState(true);

      // インストール日（初回起動時に記録）
      if (storedInstallDate) {
        setInstallDate(new Date(storedInstallDate));
      } else {
        const now = new Date();
        await AsyncStorage.setItem(INSTALL_DATE_KEY, now.toISOString());
        setInstallDate(now);
      }

      setIsLoaded(true);
    })();
  }, []);

  // トライアル残日数を計算
  const trialDaysLeft = (() => {
    if (!installDate) return TRIAL_DAYS;
    const elapsed = Date.now() - installDate.getTime();
    const daysElapsed = Math.floor(elapsed / (24 * 60 * 60 * 1000));
    return Math.max(0, TRIAL_DAYS - daysElapsed);
  })();

  const isTrial = trialDaysLeft > 0 && !isSubscribed;
  const isPremium = isSubscribed || isTrial;
  const plan: PlanType = isPremium ? 'premium' : 'free';

  const setPlan = useCallback(async (newPlan: PlanType) => {
    const subscribed = newPlan === 'premium';
    setIsSubscribed(subscribed);
    await AsyncStorage.setItem(PLAN_KEY, newPlan);
  }, []);

  const setTutorialDone = useCallback(async () => {
    setTutorialDoneState(true);
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
  }, []);

  if (!isLoaded) return null;

  return (
    <PlanContext.Provider value={{
      plan,
      isSubscribed,
      isTrial,
      trialDaysLeft,
      setPlan,
      isPremium,
      tutorialDone,
      setTutorialDone,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
