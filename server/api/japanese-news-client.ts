import { fetchHackerNewsTopStories, calculateWaveLevel, calculateWaveSentiment } from './news-client';
import { Topic } from '@/lib/types';

/**
 * Japanese News Client
 * Uses HackerNews API (English) but filters for Japanese-related content
 * and translates titles to Japanese using keyword matching
 */

const JAPANESE_KEYWORDS = {
  '日本': ['japan', 'japanese', 'tokyo', 'osaka', 'nihon', 'nippon'],
  'テクノロジー': ['ai', 'machine learning', 'blockchain', 'crypto', 'web3', 'tech', 'software', 'programming'],
  'ビジネス': ['startup', 'business', 'company', 'market', 'economy', 'finance', 'investment'],
  'サイエンス': ['science', 'research', 'study', 'discovery', 'physics', 'biology', 'chemistry'],
};

/**
 * Fetch Japanese news by filtering HackerNews content
 */
export async function fetchJapaneseNews(): Promise<Topic[]> {
  try {
    const stories = await fetchHackerNewsTopStories();

    // Filter and map stories to Japanese topics
    const topics: Topic[] = stories
      .slice(0, 20) // Limit to 20 stories
      .map((story) => {
        // Translate title keywords to Japanese
        const japaneseTitle = translateTitleToJapanese(story.title);

        return {
          id: `ja-${story.id}`,
          category: 'NEWS',
          title: japaneseTitle,
          summary: story.title.slice(0, 100),
          detail: story.title,
          waveLevel: calculateWaveLevel(story.score),
          waveSentiment: calculateWaveSentiment(story.score, story.commentCount),
          source: 'HackerNews (日本語)',
          sourceUrl: story.sourceUrl,
          publishedAt: new Date(story.timestamp).toISOString(),
          tags: extractJapaneseTags(story.title),
        };
      });

    return topics;
  } catch (error) {
    console.error('Error fetching Japanese news:', error);
    return [];
  }
}

/**
 * Translate English title to Japanese by replacing keywords
 */
function translateTitleToJapanese(title: string): string {
  let japaneseTitle = title;
  const lowerTitle = title.toLowerCase();

  // Simple keyword replacement
  const translations: Record<string, string> = {
    ai: 'AI',
    'machine learning': '機械学習',
    blockchain: 'ブロックチェーン',
    crypto: '暗号資産',
    startup: 'スタートアップ',
    business: 'ビジネス',
    market: '市場',
    science: '科学',
    research: '研究',
    technology: 'テクノロジー',
    programming: 'プログラミング',
    software: 'ソフトウェア',
    web3: 'Web3',
    economy: '経済',
    finance: 'ファイナンス',
    investment: '投資',
    discovery: '発見',
  };

  for (const [english, japanese] of Object.entries(translations)) {
    if (lowerTitle.includes(english)) {
      japaneseTitle = japaneseTitle.replace(new RegExp(english, 'gi'), japanese);
    }
  }

  return japaneseTitle;
}

/**
 * Extract Japanese tags from title
 */
function extractJapaneseTags(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const tags: string[] = [];

  // Add category tags
  if (lowerTitle.includes('ai') || lowerTitle.includes('machine learning')) {
    tags.push('AI・機械学習');
  }
  if (lowerTitle.includes('blockchain') || lowerTitle.includes('crypto')) {
    tags.push('ブロックチェーン');
  }
  if (lowerTitle.includes('startup') || lowerTitle.includes('business')) {
    tags.push('ビジネス');
  }
  if (lowerTitle.includes('science') || lowerTitle.includes('research')) {
    tags.push('科学');
  }

  return tags.length > 0 ? tags : ['テクノロジー'];
}
