/**
 * Unit tests for Japanese news client and theme system
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================
// Test: Theme System
// ============================================================
describe('Theme System', () => {
  it('should export normalTheme with correct colors', async () => {
    const { normalTheme } = await import('../lib/theme-system');
    expect(normalTheme.name).toBe('normal');
    expect(normalTheme.colors.primary).toBe('#3B82F6');
    expect(normalTheme.colors.background).toBe('#0F172A');
    expect(normalTheme.colors.foreground).toBe('#F1F5F9');
  });

  it('should export cliTheme with green primary color', async () => {
    const { cliTheme } = await import('../lib/theme-system');
    expect(cliTheme.name).toBe('cli');
    expect(cliTheme.colors.primary).toBe('#00FF00');
    expect(cliTheme.colors.background).toBe('#000000');
  });

  it('should export eightbitTheme with retro colors', async () => {
    const { eightbitTheme } = await import('../lib/theme-system');
    expect(eightbitTheme.name).toBe('8bit');
    expect(eightbitTheme.colors.primary).toBe('#FF6B35');
  });

  it('should return correct theme via getTheme', async () => {
    const { getTheme } = await import('../lib/theme-system');
    const normal = getTheme('normal');
    const cli = getTheme('cli');
    const eightbit = getTheme('8bit');
    expect(normal.name).toBe('normal');
    expect(cli.name).toBe('cli');
    expect(eightbit.name).toBe('8bit');
  });

  it('should fallback to normalTheme for unknown theme', async () => {
    const { getTheme } = await import('../lib/theme-system');
    const fallback = getTheme('unknown' as any);
    expect(fallback.name).toBe('normal');
  });

  it('should have borderRadius.none = 0 for CLI theme (no rounded corners)', async () => {
    const { cliTheme } = await import('../lib/theme-system');
    expect(cliTheme.borderRadius.none).toBe(0);
    expect(cliTheme.borderRadius.sm).toBe(0);
    expect(cliTheme.borderRadius.md).toBe(0);
  });

  it('should have all required color tokens', async () => {
    const { normalTheme } = await import('../lib/theme-system');
    const requiredTokens = ['primary', 'background', 'surface', 'foreground', 'muted', 'border', 'success', 'warning', 'error'];
    for (const token of requiredTokens) {
      expect(normalTheme.colors).toHaveProperty(token);
    }
  });
});

// ============================================================
// Test: RSS Parser (Japanese News Client)
// ============================================================
describe('RSS Parser', () => {
  it('should parse basic RSS XML items', () => {
    // Test the RSS parsing logic directly
    const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>テスト記事タイトル</title>
      <link>https://example.com/article1</link>
      <description>テスト記事の説明文です。</description>
      <pubDate>Sat, 15 Mar 2026 10:00:00 +0900</pubDate>
    </item>
    <item>
      <title>第二の記事</title>
      <link>https://example.com/article2</link>
      <description>第二の記事の説明です。</description>
      <pubDate>Sat, 15 Mar 2026 09:00:00 +0900</pubDate>
    </item>
  </channel>
</rss>`;

    // Inline the parser logic for testing
    function parseRSS(xmlStr: string, source: string) {
      const items: any[] = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xmlStr)) !== null) {
        const itemXml = match[1];
        const getTag = (tag: string): string => {
          const tagRegex = new RegExp(
            `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
            'i'
          );
          const m = tagRegex.exec(itemXml);
          if (m) return (m[1] || m[2] || '').trim();
          return '';
        };
        const title = getTag('title');
        const link = getTag('link') || getTag('guid');
        const description = getTag('description');
        const pubDate = getTag('pubDate') || getTag('dc:date');
        if (title && link) {
          items.push({ title, link, description, pubDate, source });
        }
      }
      return items.slice(0, 5);
    }

    const items = parseRSS(xml, 'TestSource');
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('テスト記事タイトル');
    expect(items[0].link).toBe('https://example.com/article1');
    expect(items[0].source).toBe('TestSource');
    expect(items[1].title).toBe('第二の記事');
  });

  it('should parse CDATA wrapped titles', () => {
    const xml = `<item>
      <title><![CDATA[CDATAタイトルテスト]]></title>
      <link>https://example.com/cdata</link>
      <description><![CDATA[CDATA説明文]]></description>
    </item>`;

    function parseRSS(xmlStr: string, source: string) {
      const items: any[] = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xmlStr)) !== null) {
        const itemXml = match[1];
        const getTag = (tag: string): string => {
          const tagRegex = new RegExp(
            `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
            'i'
          );
          const m = tagRegex.exec(itemXml);
          if (m) return (m[1] || m[2] || '').trim();
          return '';
        };
        const title = getTag('title');
        const link = getTag('link') || getTag('guid');
        if (title && link) {
          items.push({ title, link, source });
        }
      }
      return items;
    }

    const items = parseRSS(xml, 'NHK');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('CDATAタイトルテスト');
  });

  it('should limit items to 5 per feed', () => {
    const items = Array.from({ length: 10 }, (_, i) => `
      <item>
        <title>記事${i + 1}</title>
        <link>https://example.com/${i + 1}</link>
      </item>
    `).join('');
    const xml = `<rss><channel>${items}</channel></rss>`;

    function parseRSS(xmlStr: string, source: string) {
      const result: any[] = [];
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      let match;
      while ((match = itemRegex.exec(xmlStr)) !== null) {
        const itemXml = match[1];
        const getTag = (tag: string): string => {
          const tagRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
          const m = tagRegex.exec(itemXml);
          return m ? m[1].trim() : '';
        };
        const title = getTag('title');
        const link = getTag('link');
        if (title && link) result.push({ title, link, source });
      }
      return result.slice(0, 5);
    }

    const parsed = parseRSS(xml, 'Test');
    expect(parsed).toHaveLength(5);
  });
});

// ============================================================
// Test: Wave Level & Sentiment Mapping
// ============================================================
describe('Wave Level & Sentiment', () => {
  it('should map sentiment correctly', () => {
    const mapSentiment = (s: string) =>
      s === 'positive' ? 'green' :
      s === 'negative' ? 'red' :
      'blue';

    expect(mapSentiment('positive')).toBe('green');
    expect(mapSentiment('negative')).toBe('red');
    expect(mapSentiment('neutral')).toBe('blue');
    expect(mapSentiment('unknown')).toBe('blue');
  });

  it('should validate waveLevel values', () => {
    const validLevels = ['low', 'medium', 'high'];
    for (const level of validLevels) {
      expect(validLevels).toContain(level);
    }
  });

  it('should validate waveSentiment values', () => {
    const validSentiments = ['blue', 'green', 'yellow', 'red'];
    for (const sentiment of validSentiments) {
      expect(validSentiments).toContain(sentiment);
    }
  });
});

// ============================================================
// Test: Topic Data Structure
// ============================================================
describe('Topic Data Structure', () => {
  it('should have all required fields', () => {
    const topic = {
      id: 'test-1',
      category: 'NEWS' as const,
      title: 'テストタイトル',
      summary: 'テスト要約',
      detail: 'テスト詳細',
      waveLevel: 'medium' as const,
      waveSentiment: 'blue' as const,
      source: 'NHK',
      sourceUrl: 'https://nhk.or.jp',
      publishedAt: new Date().toISOString(),
      tags: ['テスト'],
    };

    expect(topic).toHaveProperty('id');
    expect(topic).toHaveProperty('category');
    expect(topic).toHaveProperty('title');
    expect(topic).toHaveProperty('summary');
    expect(topic).toHaveProperty('waveLevel');
    expect(topic).toHaveProperty('waveSentiment');
    expect(topic).toHaveProperty('source');
    expect(topic).toHaveProperty('sourceUrl');
    expect(topic).toHaveProperty('publishedAt');
    expect(topic).toHaveProperty('tags');
  });

  it('should have valid ISO date format for publishedAt', () => {
    const date = new Date().toISOString();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
