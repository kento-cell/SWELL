/**
 * Japan News Service
 * 日本語ニュースを RSS フィードから取得し、LLM で要約する
 */

import { invokeLLM } from "../_core/llm";

interface RawNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface SummarizedNewsItem {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  source: string;
  publishedAt: string;
  category: string;
  waveLevel: "low" | "medium" | "high";
  sentiment: "positive" | "neutral" | "negative";
}

// 日本語ニュース RSS フィード一覧
const JAPAN_NEWS_FEEDS = [
  {
    url: "https://www3.nhk.or.jp/rss/news/cat0.xml",
    source: "NHK",
    category: "総合",
  },
  {
    url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf",
    source: "朝日新聞",
    category: "総合",
  },
  {
    url: "https://mainichi.jp/rss/etc/mainichi-flash.rss",
    source: "毎日新聞",
    category: "総合",
  },
  {
    url: "https://news.livedoor.com/topics/rss/top.xml",
    source: "livedoor",
    category: "総合",
  },
  {
    url: "https://news.yahoo.co.jp/rss/topics/top-picks.xml",
    source: "Yahoo!ニュース",
    category: "総合",
  },
];

// RSS XML をパースして記事リストを取得
function parseRSS(xml: string, source: string): RawNewsItem[] {
  const items: RawNewsItem[] = [];

  // <item> タグを抽出
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    const getTag = (tag: string): string => {
      const tagRegex = new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      );
      const m = tagRegex.exec(itemXml);
      if (m) return (m[1] || m[2] || "").trim();
      return "";
    };

    const title = getTag("title");
    const link = getTag("link") || getTag("guid");
    const description = getTag("description");
    const pubDate = getTag("pubDate") || getTag("dc:date");

    if (title && link) {
      items.push({
        title,
        link,
        description: description.replace(/<[^>]+>/g, "").trim(),
        pubDate,
        source,
      });
    }
  }

  return items.slice(0, 5); // 各ソースから最大5件
}

// RSS フィードを取得
async function fetchFeed(
  url: string,
  source: string
): Promise<RawNewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SwellNewsBot/1.0; +https://swell.app)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];
    const xml = await response.text();
    return parseRSS(xml, source);
  } catch {
    return [];
  }
}

// LLM で記事を日本語要約
async function summarizeWithLLM(
  items: RawNewsItem[]
): Promise<SummarizedNewsItem[]> {
  if (items.length === 0) return [];

  // バッチで要約（コスト削減のため複数記事をまとめて処理）
  const articlesText = items
    .map(
      (item, i) =>
        `[記事${i + 1}] タイトル: ${item.title}\n概要: ${item.description || "（概要なし）"}\nソース: ${item.source}`
    )
    .join("\n\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `あなたは日本語ニュースの要約専門家です。
与えられた記事を以下のJSON形式で要約してください。
必ず日本語で回答してください。
各記事について:
- summary: 2〜3文で要点をまとめた日本語要約
- category: 政治/経済/社会/国際/テクノロジー/スポーツ/エンタメ のいずれか
- waveLevel: 話題の盛り上がり度 (low/medium/high)
- sentiment: ニュースのトーン (positive/neutral/negative)`,
        },
        {
          role: "user",
          content: `以下の記事を要約してください:\n\n${articlesText}`,
        },
      ],
      response_format: {
        type: "json_object",
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : "{}";
    const parsed = JSON.parse(content);
    const summaries = parsed.articles || parsed.items || parsed.results || [];

    return items.map((item, i) => {
      const s = summaries[i] || {};
      return {
        id: `japan-${Date.now()}-${i}`,
        title: item.title,
        summary: s.summary || item.description?.slice(0, 100) || item.title,
        sourceUrl: item.link,
        source: item.source,
        publishedAt: item.pubDate || new Date().toISOString(),
        category: s.category || "総合",
        waveLevel: (s.waveLevel as "low" | "medium" | "high") || "medium",
        sentiment:
          (s.sentiment as "positive" | "neutral" | "negative") || "neutral",
      };
    });
  } catch {
    // LLM 失敗時はそのまま返す
    return items.map((item, i) => ({
      id: `japan-${Date.now()}-${i}`,
      title: item.title,
      summary: item.description?.slice(0, 150) || item.title,
      sourceUrl: item.link,
      source: item.source,
      publishedAt: item.pubDate || new Date().toISOString(),
      category: "総合",
      waveLevel: "medium" as const,
      sentiment: "neutral" as const,
    }));
  }
}

// キャッシュ（5分）
let cache: { data: SummarizedNewsItem[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

// メイン関数: 日本語ニュースを取得して要約
export async function fetchJapanNews(): Promise<SummarizedNewsItem[]> {
  // キャッシュチェック
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  // 全フィードを並列取得
  const feedResults = await Promise.allSettled(
    JAPAN_NEWS_FEEDS.map((feed) => fetchFeed(feed.url, feed.source))
  );

  const allItems: RawNewsItem[] = [];
  feedResults.forEach((result) => {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  });

  if (allItems.length === 0) {
    return getFallbackNews();
  }

  // 最新順にソートして上位15件を要約
  const topItems = allItems.slice(0, 15);
  const summarized = await summarizeWithLLM(topItems);

  // キャッシュ更新
  cache = { data: summarized, timestamp: Date.now() };
  return summarized;
}

// フォールバック（RSS 取得失敗時）
function getFallbackNews(): SummarizedNewsItem[] {
  return [
    {
      id: "fallback-1",
      title: "ニュースを読み込んでいます...",
      summary: "最新のニュースを取得中です。しばらくお待ちください。",
      sourceUrl: "https://news.yahoo.co.jp",
      source: "Yahoo!ニュース",
      publishedAt: new Date().toISOString(),
      category: "総合",
      waveLevel: "low",
      sentiment: "neutral",
    },
  ];
}
