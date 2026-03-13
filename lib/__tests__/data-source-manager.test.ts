import { describe, it, expect } from 'vitest';
import { getAvailableDataSources } from '../data-source-manager';

describe('DataSourceManager', () => {
  it('should return available data sources', () => {
    const sources = getAvailableDataSources();
    expect(sources).toHaveLength(3);
    expect(sources.map((s) => s.id)).toEqual(['mock', 'hackernews', 'rss']);
  });

  it('should have proper labels for each source', () => {
    const sources = getAvailableDataSources();
    const mockSource = sources.find((s) => s.id === 'mock');
    expect(mockSource?.label).toBe('モックデータ');
    expect(mockSource?.description).toContain('サンプルデータ');
  });

  it('should have HackerNews source', () => {
    const sources = getAvailableDataSources();
    const hnSource = sources.find((s) => s.id === 'hackernews');
    expect(hnSource?.label).toBe('HackerNews');
    expect(hnSource?.description).toContain('テック');
  });

  it('should have RSS source', () => {
    const sources = getAvailableDataSources();
    const rssSource = sources.find((s) => s.id === 'rss');
    expect(rssSource?.label).toBe('RSS フィード');
    expect(rssSource?.description).toContain('複数');
  });

  it('should have descriptions for all sources', () => {
    const sources = getAvailableDataSources();
    sources.forEach((source) => {
      expect(source.description).toBeTruthy();
      expect(source.description.length).toBeGreaterThan(0);
    });
  });
});
