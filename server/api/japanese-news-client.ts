/**
 * Japanese News Client
 * 日本語ニュースを RSS フィードから取得し、キーワードベースで感情・波レベルを判定
 * コスト完全ゼロ設計: 外部 API・LLM 一切不使用
 */

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
    url: 'https://news.livedoor.com/topics/rss/top.xml',
    source: 'livedoor',
  },
  {
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    source: 'Yahoo!ニュース',
  },
];

// ============================================================
// キーワードベース感情・波レベル判定（コスト0）
// ============================================================

const NEGATIVE_KEYWORDS = [
  '死亡', '死者', '事故', '事件', '逮捕', '火災', '地震', '津波', '台風', '洪水',
  '被害', '崩壊', '爆発', '暴行', '殺人', '自殺', '倒産', '破産', '失業', '不正',
  '汚職', '詐欺', '違反', '批判', '抗議', '反発', '懸念', '危機', '警告', '緊急',
  '禁止', '中止', '延期', '撤退', '失敗', '敗北', '落下', '墜落', '衝突', '感染',
  '流行', '蔓延', 'コロナ', '訃報', '遺体', '行方不明', '捜索', '炎上', '問題',
];

const POSITIVE_KEYWORDS = [
  '成長', '達成', '成功', '優勝', '受賞', '開発', '開通', '開業', '誕生', '回復',
  '改善', '向上', '増加', '拡大', '発展', '革新', '突破', '記録', '歴史的', '初',
  '解決', '和解', '合意', '協力', '支援', '救助', '復興', '再生', '活性化', '好調',
  '黒字', '増益', '上昇', '高値', '最高', '感謝', '喜び', '祝', '祭', '快挙',
];

const HIGH_WAVE_KEYWORDS = [
  '速報', '緊急', '重大', '大規模', '最大', '史上', '歴史的', '初めて', '衝撃',
  '震度', 'M7', 'M8', '大地震', '大津波', '大火災', '大事故', '死者多数',
  '首相', '大統領', '総理', '政府', '国会', '選挙', '戦争', '核', 'ミサイル',
  '株価急落', '急騰', '暴落', '暴騰', 'ショック', 'パニック', '大停電',
];

const LOW_WAVE_KEYWORDS = [
  '特集', 'コラム', 'インタビュー', '連載', '解説', 'まとめ', 'ランキング',
  'レビュー', '紹介', 'おすすめ', 'ガイド', 'ヒント', 'コツ', 'レシピ',
];

/**
 * キーワードマッチで感情を判定（コスト0）
 */
function detectSentiment(title: string, description: string): WaveSentiment {
  const text = title + ' ' + description;

  let negScore = 0;
  let posScore = 0;

  for (const kw of NEGATIVE_KEYWORDS) {
    if (text.includes(kw)) negScore++;
  }
  for (const kw of POSITIVE_KEYWORDS) {
    if (text.includes(kw)) posScore++;
  }

  if (negScore > posScore + 1) return 'red';
  if (negScore > 0 && posScore > 0) return 'yellow'; // 賛否割れ
  if (posScore > negScore) return 'green';
  return 'blue'; // 中立
}

/**
 * キーワードマッチで波レベルを判定（コスト0）
 */
function detectWaveLevel(title: string, description: string): WaveLevel {
  const text = title + ' ' + description;

  for (const kw of HIGH_WAVE_KEYWORDS) {
    if (text.includes(kw)) return 'high';
  }
  for (const kw of LOW_WAVE_KEYWORDS) {
    if (text.includes(kw)) return 'low';
  }
  return 'medium';
}

/**
 * タグをタイトルから自動生成（コスト0）
 */
function extractTags(title: string): string[] {
  const tagMap: Record<string, string[]> = {
    '政治': ['政府', '国会', '首相', '大臣', '選挙', '自民', '立民', '公明', '維新'],
    '経済': ['株', '円', 'GDP', '物価', '景気', '企業', '業績', '上場', '倒産', '雇用'],
    '社会': ['事件', '事故', '裁判', '警察', '逮捕', '火災', '交通'],
    '国際': ['米国', '中国', '韓国', 'ロシア', '欧州', '国連', '外交', '外相'],
    'テクノロジー': ['AI', 'IT', 'デジタル', 'スマホ', 'アプリ', 'ゲーム', 'ロボット'],
    'スポーツ': ['野球', 'サッカー', 'テニス', '水泳', 'オリンピック', '優勝', '決勝'],
    'エンタメ': ['映画', '音楽', 'ドラマ', 'アニメ', '芸能', '俳優', '歌手'],
    '科学': ['研究', '発見', '宇宙', 'NASA', 'JAXA', '医療', 'ワクチン'],
    '気象': ['地震', '台風', '大雨', '豪雪', '猛暑', '気温', '天気'],
  };

  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(tagMap)) {
    for (const kw of keywords) {
      if (title.includes(kw)) {
        tags.push(tag);
        break;
      }
    }
  }

  return tags.length > 0 ? tags.slice(0, 3) : ['総合'];
}

/**
 * RSS XML をパースして記事リストを取得
 */
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
        title: title
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/<[^>]+>/g, ''),
        link: link.replace(/&amp;/g, '&'),
        description: description
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&nbsp;/g, ' ')
          .trim(),
        pubDate,
        source,
      });
    }
  }

  return items.slice(0, 6); // 各ソースから最大6件
}

/**
 * RSS フィードを取得
 */
async function fetchFeed(url: string, source: string): Promise<RawNewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SwellNewsBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(6000),
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
    console.warn(`[JapanNews] ${source}: fetch failed`, (err as Error).message);
    return [];
  }
}

/**
 * RawNewsItem → Topic 変換（コスト0・LLM不使用）
 */
function convertToTopics(items: RawNewsItem[]): Topic[] {
  return items.map((item, i) => {
    const waveLevel = detectWaveLevel(item.title, item.description);
    const waveSentiment = detectSentiment(item.title, item.description);
    const tags = extractTags(item.title);

    // description が短い/空の場合はタイトルを使用
    const summary =
      item.description && item.description.length > 10
        ? item.description.slice(0, 150) + (item.description.length > 150 ? '…' : '')
        : item.title;

    return {
      id: `japan-${Date.now()}-${i}`,
      category: 'NEWS' as const,
      title: item.title,
      summary,
      detail: item.description || item.title,
      waveLevel,
      waveSentiment,
      source: item.source,
      sourceUrl: item.link,
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      tags,
    };
  });
}

// キャッシュ（10分 — LLM不使用なので少し長めに）
let cache: { data: Topic[]; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

/**
 * メイン関数: 日本語ニュースを取得してキーワード分析（コスト0）
 */
export async function fetchJapaneseNews(): Promise<Topic[]> {
  // キャッシュチェック
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    console.log('[JapanNews] Returning cached data');
    return cache.data;
  }

  console.log('[JapanNews] Fetching from RSS feeds (zero-cost mode)...');

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

  // キーワードベース変換（LLM不使用・コスト0）
  const topics = convertToTopics(allItems.slice(0, 20));

  // キャッシュ更新
  cache = { data: topics, timestamp: Date.now() };
  console.log(`[JapanNews] Done. ${topics.length} items ready (zero-cost).`);
  return topics;
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
