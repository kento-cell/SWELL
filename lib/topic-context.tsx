import React, { createContext, useContext, useState, useCallback } from 'react';
import { Topic } from './types';

interface TopicContextType {
  selectedTopic: Topic | null;
  setSelectedTopic: (topic: Topic) => void;
  clearSelectedTopic: () => void;
}

const TopicContext = createContext<TopicContextType | undefined>(undefined);

export function TopicProvider({ children }: { children: React.ReactNode }) {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleSetSelectedTopic = useCallback((topic: Topic) => {
    setSelectedTopic(topic);
  }, []);

  const handleClearSelectedTopic = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  return (
    <TopicContext.Provider
      value={{
        selectedTopic,
        setSelectedTopic: handleSetSelectedTopic,
        clearSelectedTopic: handleClearSelectedTopic,
      }}
    >
      {children}
    </TopicContext.Provider>
  );
}

export function useTopicContext() {
  const context = useContext(TopicContext);
  if (!context) {
    throw new Error('useTopicContext must be used within TopicProvider');
  }
  return context;
}
