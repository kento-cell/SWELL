/**
 * Japanese News Client
 * 日本語ニュースを RSS フィードから取得し、LLM で AI 要約する
 * ゼロコスト設計: NHK・朝日・毎日・Yahoo!ニュース・livedoor の無料 RSS を使用
 */

import { invokeLLM } from '../_core/llm';
import { Topic, WaveLevel, WaveSentiment } from '@/lib/types';

interface RawNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

// 日本語ニュース RSS フィード一覧
const JAPAN_NEWS_FEEDS = [
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    source: 'NHK',
  },
  {
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    source: '朝日新聞',
  },
  {
    url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss',
    source: '毎日新聞',
  },
  {
    url: 'https://news.livedoor.com/topics/rss/top.xml',
    source: 'livedoor',
  },
  {
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    source: 'Yahoo!ニュース',
  },
];

// RSS XML をパースして記事リストを取得
function parseRSS(xml: string, source: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];

  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
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
      items.push({
        title: title.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'),
        link: link.replace(/&amp;/g, '&'),
        description: description.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
        pubDate,
        source,
      });
    }
  }

  return items.slice(0, 5); // 各ソースから最大5件
}

// RSS フィードを取得
async function fetchFeed(url: string, source: string): Promise<RawNewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SwellNewsBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[JapanNews] ${source}: HTTP ${response.status}`);
      return [];
    }
    const xml = await response.text();
    const items = parseRSS(xml, source);
    console.log(`[JapanNews] ${source}: ${items.length} items fetched`);
    return items;
  } catch (err) {
    console.warn(`[JapanNews] ${source}: fetch failed`, err);
    return [];
  }
}

// LLM で記事を日本語要約
async function summarizeWithLLM(items: RawNewsItem[]): Promise<Topic[]> {
  if (items.length === 0) return [];

  const articlesText = items
    .map(
      (item, i) =>
        `[記事${i + 1}]\nタイトル: ${item.title}\n概要: ${item.description?.slice(0, 200) || 'なし'}\nソース: ${item.source}`
    )
    .join('\n\n');

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `あなたは日本語ニュースの要約専門家です。
与えられた記事リストを分析し、以下のJSON形式で返してください。
必ず日本語で回答し、articles配列に各記事の情報を含めてください。

{
  "articles": [
    {
      "summary": "2〜3文の日本語要約",
      "category": "政治|経済|社会|国際|テクノロジー|スポーツ|エンタメ|科学",
      "waveLevel": "low|medium|high",
      "sentiment": "positive|neutral|negative",
      "tags": ["タグ1", "タグ2"]
    }
  ]
}

waveLevel の基準:
- high: 重大ニュース、速報、大きな社会的影響
- medium: 一般的なニュース
- low: 軽微なニュース、特集記事

sentiment の基準:
- positive: 良いニュース、成功、発展
- negative: 事件、事故、問題、批判
- neutral: 中立的な報道`,
        },
        {
          role: 'user',
          content: `以下の${items.length}件の記事を要約してください:\n\n${articlesText}`,
        },
      ],
      response_format: {
        type: 'json_object',
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent : '{}';
    const parsed = JSON.parse(content);
    const summaries: Array<{
      summary?: string;
      category?: string;
      waveLevel?: string;
      sentiment?: string;
      tags?: string[];
    }> = parsed.articles || [];

    return items.map((item, i) => {
      const s = summaries[i] || {};
      const waveLevel = (s.waveLevel as WaveLevel) || 'medium';
      const sentiment = s.sentiment || 'neutral';

      // sentiment → waveSentiment マッピング
      const waveSentiment: WaveSentiment =
        sentiment === 'positive' ? 'green' :
        sentiment === 'negative' ? 'red' :
        'blue';

      return {
        id: `japan-${Date.now()}-${i}`,
        category: 'NEWS' as const,
        title: item.title,
        summary: s.summary || item.description?.slice(0, 100) || item.title,
        detail: item.description || item.title,
        waveLevel,
        waveSentiment,
        source: item.source,
        sourceUrl: item.link,
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        tags: s.tags || [s.category || '総合'],
      };
    });
  } catch (err) {
    console.error('[JapanNews] LLM summarization failed:', err);
    // LLM 失敗時はそのまま返す（要約なし）
    return items.map((item, i) => ({
      id: `japan-${Date.now()}-${i}`,
      category: 'NEWS' as const,
      title: item.title,
      summary: item.description?.slice(0, 150) || item.title,
      detail: item.description || item.title,
      waveLevel: 'medium' as WaveLevel,
      waveSentiment: 'blue' as WaveSentiment,
      source: item.source,
      sourceUrl: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      tags: ['総合'],
    }));
  }
}

// キャッシュ（5分）
let cache: { data: Topic[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * メイン関数: 日本語ニュースを取得して AI 要約
 */
export async function fetchJapaneseNews(): Promise<Topic[]> {
  // キャッシュチェック
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    console.log('[JapanNews] Returning cached data');
    return cache.data;
  }

  console.log('[JapanNews] Fetching from RSS feeds...');

  // 全フィードを並列取得
  const feedResults = await Promise.allSettled(
    JAPAN_NEWS_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  );

  const allItems: RawNewsItem[] = [];
  feedResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  console.log(`[JapanNews] Total items fetched: ${allItems.length}`);

  if (allItems.length === 0) {
    console.warn('[JapanNews] No items fetched, returning fallback');
    return getFallbackTopics();
  }

  // 最新順にソートして上位15件を要約
  const topItems = allItems.slice(0, 15);
  console.log(`[JapanNews] Summarizing ${topItems.length} items with LLM...`);
  const summarized = await summarizeWithLLM(topItems);

  // キャッシュ更新
  cache = { data: summarized, timestamp: Date.now() };
  console.log(`[JapanNews] Done. ${summarized.length} items ready.`);
  return summarized;
}

// フォールバック（RSS 取得失敗時）
function getFallbackTopics(): Topic[] {
  return [
    {
      id: 'fallback-japan-1',
      category: 'NEWS',
      title: 'ニュースを読み込んでいます...',
      summary: '最新の日本語ニュースを取得中です。しばらくお待ちください。',
      detail: 'ネットワーク接続を確認してください。',
      waveLevel: 'low',
      waveSentiment: 'blue',
      source: 'SWELL',
      sourceUrl: 'https://news.yahoo.co.jp',
      publishedAt: new Date().toISOString(),
      tags: ['読み込み中'],
    },
  ];
}
