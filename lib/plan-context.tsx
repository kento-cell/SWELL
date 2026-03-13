import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlanType } from './types';

const PLAN_KEY = 'swell_user_plan';
const TUTORIAL_KEY = 'swell_tutorial_done';

interface PlanContextValue {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  tutorialDone: boolean;
  setTutorialDone: () => void;
}

const PlanContext = createContext<PlanContextValue>({
  plan: 'free',
  setPlan: () => {},
  tutorialDone: false,
  setTutorialDone: () => {},
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = useState<PlanType>('free');
  const [tutorialDone, setTutorialDoneState] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedPlan, storedTutorial] = await Promise.all([
        AsyncStorage.getItem(PLAN_KEY),
        AsyncStorage.getItem(TUTORIAL_KEY),
      ]);
      if (storedPlan === 'premium') setPlanState('premium');
      if (storedTutorial === 'true') setTutorialDoneState(true);
    })();
  }, []);

  const setPlan = async (newPlan: PlanType) => {
    setPlanState(newPlan);
    await AsyncStorage.setItem(PLAN_KEY, newPlan);
  };

  const setTutorialDone = async () => {
    setTutorialDoneState(true);
    await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
  };

  return (
    <PlanContext.Provider value={{ plan, setPlan, tutorialDone, setTutorialDone }}>
      {children}
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
