import { describe, it, expect } from 'vitest';
import { MOCK_TOPICS, getTopicsByCategory } from '../mock-data';
import { FREE_CATEGORIES, PREMIUM_CATEGORIES } from '../types';

describe('Mock Data', () => {
  it('should have 15 topics total', () => {
    expect(MOCK_TOPICS).toHaveLength(15);
  });

  it('should have 5 NEWS topics', () => {
    expect(getTopicsByCategory('NEWS')).toHaveLength(5);
  });

  it('should have 5 SOCIAL topics', () => {
    expect(getTopicsByCategory('SOCIAL')).toHaveLength(5);
  });

  it('should have 5 MARKET topics', () => {
    expect(getTopicsByCategory('MARKET')).toHaveLength(5);
  });

  it('each topic should have required fields', () => {
    for (const topic of MOCK_TOPICS) {
      expect(topic.id).toBeTruthy();
      expect(topic.title).toBeTruthy();
      expect(topic.summary).toBeTruthy();
      expect(topic.detail).toBeTruthy();
      expect(['low', 'medium', 'high']).toContain(topic.waveLevel);
      expect(['blue', 'green', 'yellow', 'red']).toContain(topic.waveSentiment);
      expect(['NEWS', 'SOCIAL', 'MARKET']).toContain(topic.category);
      expect(topic.source).toBeTruthy();
      expect(topic.tags.length).toBeGreaterThan(0);
    }
  });

  it('FREE_CATEGORIES should only include NEWS', () => {
    expect(FREE_CATEGORIES).toEqual(['NEWS']);
  });

  it('PREMIUM_CATEGORIES should include SOCIAL and MARKET', () => {
    expect(PREMIUM_CATEGORIES).toContain('SOCIAL');
    expect(PREMIUM_CATEGORIES).toContain('MARKET');
  });
});
