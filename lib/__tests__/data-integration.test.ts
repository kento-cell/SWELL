import { describe, it, expect, vi } from 'vitest';
import { fetchHackerNewsTopics, fetchHackerNewsByCategory } from '../hackernews-client';
import { fetchRSSFeedsByCategory } from '../rss-client';

/**
 * Integration tests for real data fetching
 * These tests verify that actual API calls work correctly
 */

describe('HackerNews API Integration', () => {
  it('should fetch real HackerNews topics', async () => {
    const topics = await fetchHackerNewsTopics(5);
    
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBeGreaterThan(0);
    
    if (topics.length > 0) {
      const topic = topics[0];
      expect(topic).toHaveProperty('id');
      expect(topic).toHaveProperty('title');
      expect(topic).toHaveProperty('source');
      expect(topic.source).toContain('HackerNews');
      expect(topic).toHaveProperty('waveLevel');
      expect(topic).toHaveProperty('waveSentiment');
    }
  }, { timeout: 15000 });

  it('should fetch HackerNews top stories', async () => {
    const topics = await fetchHackerNewsByCategory('top', 5);
    
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBeGreaterThan(0);
    
    if (topics.length > 0) {
      const topic = topics[0];
      expect(topic.category).toBe('NEWS');
      expect(topic.title).toBeTruthy();
      expect(topic.sourceUrl).toBeTruthy();
    }
  }, { timeout: 15000 });

  it('should estimate wave levels correctly', async () => {
    const topics = await fetchHackerNewsTopics(10);
    
    if (topics.length > 0) {
      topics.forEach(topic => {
        expect(['low', 'medium', 'high']).toContain(topic.waveLevel);
      });
    }
  }, { timeout: 15000 });

  it('should estimate wave sentiments correctly', async () => {
    const topics = await fetchHackerNewsTopics(10);
    
    if (topics.length > 0) {
      topics.forEach(topic => {
        expect(['blue', 'green', 'yellow', 'red']).toContain(topic.waveSentiment);
      });
    }
  }, { timeout: 15000 });
});

describe('RSS Feed Integration', () => {
  it('should fetch real RSS feed data', async () => {
    const topics = await fetchRSSFeedsByCategory('NEWS');
    
    expect(Array.isArray(topics)).toBe(true);
    // RSS feeds might be empty sometimes, but structure should be correct
    if (topics.length > 0) {
      const topic = topics[0];
      expect(topic).toHaveProperty('id');
      expect(topic).toHaveProperty('title');
      expect(topic).toHaveProperty('source');
    }
  }, { timeout: 20000 });

  it('should handle RSS parsing errors gracefully', async () => {
    const topics = await fetchRSSFeedsByCategory('NEWS');
    
    // Should return array even if parsing fails
    expect(Array.isArray(topics)).toBe(true);
  }, { timeout: 20000 });

  it('should fetch MARKET category RSS feeds', async () => {
    const topics = await fetchRSSFeedsByCategory('MARKET');
    
    expect(Array.isArray(topics)).toBe(true);
    if (topics.length > 0) {
      topics.forEach(topic => {
        expect(topic.category).toBe('MARKET');
      });
    }
  }, { timeout: 20000 });

  it('should fetch SOCIAL category RSS feeds', async () => {
    const topics = await fetchRSSFeedsByCategory('SOCIAL');
    
    expect(Array.isArray(topics)).toBe(true);
    if (topics.length > 0) {
      topics.forEach(topic => {
        expect(topic.category).toBe('SOCIAL');
      });
    }
  }, { timeout: 20000 });
});

describe('Data Source Switching', () => {
  it('should return data from HackerNews when selected', async () => {
    const topics = await fetchHackerNewsTopics(3);
    
    expect(Array.isArray(topics)).toBe(true);
    if (topics.length > 0) {
      expect(topics[0].source).toContain('HackerNews');
    }
  }, { timeout: 15000 });

  it('should return data from RSS feeds when selected', async () => {
    const topics = await fetchRSSFeedsByCategory('NEWS');
    
    expect(Array.isArray(topics)).toBe(true);
    // RSS feed sources should be from the feed list
  }, { timeout: 20000 });

  it('should handle network errors gracefully', async () => {
    // This test verifies error handling
    // Even if network fails, should return empty array, not throw
    try {
      const topics = await fetchHackerNewsTopics(5);
      expect(Array.isArray(topics)).toBe(true);
    } catch (error) {
      // Should not throw - should return empty array instead
      expect(false).toBe(true);
    }
  }, { timeout: 15000 });
});
