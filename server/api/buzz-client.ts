/**
 * 日本語バズコンテンツクライアント
 *
 * はてなブックマーク人気エントリー + Togetter話題まとめ + YouTubeトレンド
 * 全て無料RSS/API。コスト0設計。
 *
 * 「今ネットで何がバズってるか」を日本語で提供する。
 */

/**
 * HTML/XMLエンティティをデコード
 */
function decodeEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/<[^>]+>/g, '');
}

interface BuzzItem {
  id: string;
  title: string;
  url: string;
  source: string;
  description: string;
  bookmarks?: number;    // はてブ数
  timestamp: number;
}

// ============================================================
// はてなブックマーク 人気エントリー
// ============================================================
async function fetchHatenaHotentry(): Promise<BuzzItem[]> {
  try {
    const url = 'https://b.hatena.ne.jp/hotentry.rss';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwellBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseHatenaRSS(xml);
  } catch (err) {
    console.warn('[Buzz] はてブ取得失敗:', (err as Error).message);
    return [];
  }
}

function parseHatenaRSS(xml: string): BuzzItem[] {
  const items: BuzzItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag: string) => {
      const tagRegex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      const m = tagRegex.exec(itemXml);
      return m ? m[1].trim() : '';
    };

    const title = decodeEntities(getTag('title'));
    const link = getTag('link').replace(/&amp;/g, '&');
    const description = decodeEntities(getTag('description')).replace(/<[^>]+>/g, '').trim();
    const pubDate = getTag('pubDate') || getTag('dc:date');

    // はてブ数を取得（hatena:bookmarkcount）
    const bookmarkMatch = /<hatena:bookmarkcount>(\d+)<\/hatena:bookmarkcount>/i.exec(itemXml);
    const bookmarks = bookmarkMatch ? parseInt(bookmarkMatch[1]) : 0;

    if (title && link) {
      items.push({
        id: `hatena-${Date.now()}-${items.length}`,
        title,
        url: link,
        source: 'はてブ',
        description: description.slice(0, 100) || title,
        bookmarks,
        timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
      });
    }
  }

  return items.slice(0, 10);
}

// ============================================================
// Togetter 話題まとめ
// ============================================================
async function fetchTogetter(): Promise<BuzzItem[]> {
  try {
    const url = 'https://togetter.com/rss/hot';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SwellBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseTogetterRSS(xml);
  } catch (err) {
    console.warn('[Buzz] Togetter取得失敗:', (err as Error).message);
    return [];
  }
}

function parseTogetterRSS(xml: string): BuzzItem[] {
  const items: BuzzItem[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const getTag = (tag: string) => {
      const tagRegex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
      const m = tagRegex.exec(itemXml);
      return m ? m[1].trim() : '';
    };

    const title = decodeEntities(getTag('title'));
    const link = getTag('link').replace(/&amp;/g, '&');
    const description = decodeEntities(getTag('description')).replace(/<[^>]+>/g, '').trim();
    const pubDate = getTag('pubDate') || getTag('dc:date');

    if (title && link) {
      items.push({
        id: `togetter-${Date.now()}-${items.length}`,
        title,
        url: link,
        source: 'Togetter',
        description: description.slice(0, 100) || title,
        timestamp: pubDate ? new Date(pubDate).getTime() : Date.now(),
      });
    }
  }

  return items.slice(0, 10);
}

// ============================================================
// メイン: 全バズソースを統合
// ============================================================

/**
 * バズ度を計算（はてブ数ベース）
 */
function calculateBuzzLevel(bookmarks?: number): 'low' | 'medium' | 'high' {
  if (!bookmarks) return 'medium';
  if (bookmarks > 500) return 'high';
  if (bookmarks > 100) return 'medium';
  return 'low';
}

function calculateBuzzSentiment(title: string): 'blue' | 'green' | 'yellow' | 'red' {
  const controversial = ['炎上', '批判', '問題', '疑惑', '謝罪', '暴露', '衝撃', 'やばい', 'ヤバい', '闇'];
  const positive = ['最高', 'すごい', '素晴らしい', '感動', '天才', '神', '面白', '便利', '革命', '朗報'];
  const surprise = ['まさか', '衝撃', '判明', '発覚', '真相', '実は', '驚', '意外'];

  if (controversial.some(kw => title.includes(kw))) return 'red';
  if (positive.some(kw => title.includes(kw))) return 'green';
  if (surprise.some(kw => title.includes(kw))) return 'yellow';
  return 'blue';
}

export async function fetchBuzzContent(): Promise<BuzzItem[]> {
  console.log('[Buzz] Fetching Japanese buzz content...');

  const [hatena, togetter] = await Promise.allSettled([
    fetchHatenaHotentry(),
    fetchTogetter(),
  ]);

  const hatenaItems = hatena.status === 'fulfilled' ? hatena.value : [];
  const togetterItems = togetter.status === 'fulfilled' ? togetter.value : [];

  console.log(`[Buzz] はてブ: ${hatenaItems.length}, Togetter: ${togetterItems.length}`);

  // ラウンドロビンで混合
  const mixed: BuzzItem[] = [];
  const sources = [hatenaItems, togetterItems];
  let round = 0;
  while (mixed.length < 20 && round < 15) {
    for (const src of sources) {
      if (src[round]) mixed.push(src[round]);
    }
    round++;
  }

  return mixed;
}

export { BuzzItem, calculateBuzzLevel, calculateBuzzSentiment };
