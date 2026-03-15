import { parseStringPromise } from 'xml2js';
import { Topic } from '@/lib/types';

/**
 * Japanese News Client
 * Fetches news from Japanese sources: NHK, Asahi Shimbun, Yahoo News
 */

interface JapaneseNewsSource {
  name: string;
  url: string;
  language: string;
}

const JAPANESE_NEWS_SOURCES: JapaneseNewsSource[] = [
  {
    name: 'NHK News',
    url: 'https://www3.nhk.or.jp/rss/news/top.xml',
    language: 'ja',
  },
  {
    name: 'Asahi Shimbun',
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rss',
    language: 'ja',
  },
  {
    name: 'Yahoo News Japan',
    url: 'https://news.yahoo.co.jp/rss/topics/top.xml',
    language: 'ja',
  },
];

/**
 * Fetch Japanese news from RSS feeds
 */
export async function fetchJapaneseNews(): Promise<Topic[]> {
  const topics: Topic[] = [];

  for (const source of JAPANESE_NEWS_SOURCES) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${source.name}: ${response.statusText}`);
        continue;
      }

      const xml = await response.text();
      const parsed = await parseStringPromise(xml);

      // Handle different RSS formats
      const items = parsed.rss?.channel?.[0]?.item || [];

      for (const item of items.slice(0, 5)) {
        // Limit to 5 items per source
        try {
          const title = item.title?.[0] || 'No title';
          const description = item.description?.[0] || '';
          const pubDate = item.pubDate?.[0] || new Date().toISOString();
          const link = item.link?.[0] || '';

          // Parse publish date
          const publishedAt = new Date(pubDate).toISOString();

          // Generate topic ID
          const id = `ja-news-${Buffer.from(link).toString('base64').slice(0, 16)}`;

          // Determine wave level based on content
          const waveLevel = determineWaveLevel(description);
          const sentiment = determineSentiment(description);

          topics.push({
            id,
            category: 'NEWS',
            title: cleanText(title),
            summary: cleanText(description).slice(0, 100),
            detail: cleanText(description),
            waveLevel,
            waveSentiment: sentiment,
            source: source.name,
            sourceUrl: link,
            publishedAt,
            tags: extractTags(title),
          });
        } catch (error) {
          console.warn('Error parsing RSS item:', error);
          continue;
        }
      }
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error);
      continue;
    }
  }

  return topics;
}

/**
 * Determine wave level based on content sentiment
 */
function determineWaveLevel(text: string): 'low' | 'medium' | 'high' {
  const keywords = {
    high: ['緊急', '速報', '大型', '重大', '衝撃', '歴史的'],
    medium: ['新しい', '発表', '開始', '実施', '決定'],
  };

  const lowerText = text.toLowerCase();

  for (const keyword of keywords.high) {
    if (lowerText.includes(keyword)) return 'high';
  }

  for (const keyword of keywords.medium) {
    if (lowerText.includes(keyword)) return 'medium';
  }

  return 'low';
}

/**
 * Determine sentiment based on content
 */
function determineSentiment(text: string): 'blue' | 'green' | 'yellow' | 'red' {
  const keywords = {
    green: ['成功', '好調', '上昇', '達成', '改善', '利益'],
    red: ['失敗', '低迷', '下落', '損失', '問題', '危機'],
    yellow: ['懸念', '議論', '検討', '予定', '予想'],
  };

  const lowerText = text.toLowerCase();

  for (const keyword of keywords.green) {
    if (lowerText.includes(keyword)) return 'green';
  }

  for (const keyword of keywords.red) {
    if (lowerText.includes(keyword)) return 'red';
  }

  for (const keyword of keywords.yellow) {
    if (lowerText.includes(keyword)) return 'yellow';
  }

  return 'blue';
}

/**
 * Extract tags from title
 */
function extractTags(title: string): string[] {
  // Simple tag extraction - could be enhanced with NLP
  const words = title.split(/\s+/).filter((w) => w.length > 2);
  return words.slice(0, 3);
}

/**
 * Clean HTML/XML text
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}
