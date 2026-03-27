/**
 * Bluesky Social Client
 * Fetches trending threads from Bluesky (decentralized Twitter alternative)
 * Completely free, no API keys required, no rate limits
 */

import type { TopicData } from "./data-router";

interface BlueskySocialItem {
  uri: string;
  cid: string;
  author: {
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  record: {
    text: string;
    createdAt: string;
  };
  likeCount?: number;
  replyCount?: number;
  repostCount?: number;
}

/**
 * Fetch trending threads from Bluesky public API
 * Uses the public feed endpoint (no authentication required)
 */
async function fetchBlueskySocialData(): Promise<BlueskySocialItem[]> {
  try {
    // Bluesky public API endpoint for timeline feed
    // This is the public, unauthenticated endpoint
    const response = await fetch("https://public.api.bsky.app/xrpc/app.bsky.feed.getPopular", {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`[Bluesky] API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as { feed?: Array<{ post?: BlueskySocialItem }> };
    return (data.feed?.map((item) => item.post).filter((item): item is BlueskySocialItem => Boolean(item)) ?? []);
  } catch (error) {
    console.error("[Bluesky] Fetch error:", error);
    return [];
  }
}

/**
 * Calculate wave sentiment from Bluesky thread engagement
 * Based on likes, replies, and reposts
 */
function calculateBlueskySentiment(item: BlueskySocialItem): "positive" | "neutral" | "negative" {
  const engagement = (item.likeCount ?? 0) + (item.replyCount ?? 0) + (item.repostCount ?? 0);

  // Analyze text for sentiment keywords (Japanese + English)
  const text = item.record.text.toLowerCase();
  const positiveKeywords = [
    "素晴らしい",
    "最高",
    "良い",
    "好き",
    "素敵",
    "amazing",
    "great",
    "love",
    "awesome",
    "excellent",
  ];
  const negativeKeywords = [
    "最悪",
    "悪い",
    "嫌い",
    "つまらない",
    "失望",
    "terrible",
    "bad",
    "hate",
    "awful",
    "disappointing",
  ];

  const positiveMatches = positiveKeywords.filter((kw) => text.includes(kw)).length;
  const negativeMatches = negativeKeywords.filter((kw) => text.includes(kw)).length;

  if (positiveMatches > negativeMatches) return "positive";
  if (negativeMatches > positiveMatches) return "negative";
  return "neutral";
}

/**
 * Calculate wave level from engagement metrics
 */
function calculateBlueskeyWaveLevel(item: BlueskySocialItem): "low" | "medium" | "high" {
  const engagement = (item.likeCount ?? 0) + (item.replyCount ?? 0) + (item.repostCount ?? 0);

  if (engagement > 500) return "high";
  if (engagement > 100) return "medium";
  return "low";
}

/**
 * Convert Bluesky item to TopicData format
 */
function convertBlueskySocialToContent(item: BlueskySocialItem): TopicData {
  const sentiment = calculateBlueskySentiment(item);
  const waveLevel = calculateBlueskeyWaveLevel(item);

  // Map sentiment to wave color
  const sentimentMap: Record<"positive" | "neutral" | "negative", "blue" | "green" | "yellow" | "red"> = {
    positive: "green",
    neutral: "blue",
    negative: "red",
  };

  return {
    id: item.uri,
    title: item.record.text.substring(0, 100),
    url: `https://bsky.app/profile/${item.author.handle}/post/${item.uri.split("/").pop()}`,
    sourceUrl: `https://bsky.app/profile/${item.author.handle}/post/${item.uri.split("/").pop()}`,
    source: "Bluesky",
    waveLevel,
    waveSentiment: sentimentMap[sentiment],
    timestamp: new Date(item.record.createdAt).getTime(),
    description: item.record.text,
    commentCount: (item.replyCount ?? 0),
    score: (item.likeCount ?? 0) + (item.repostCount ?? 0),
  };
}

/**
 * Main function to fetch and process Bluesky social content
 */
export async function getBlueskySocialContent(): Promise<TopicData[]> {
  const items = await fetchBlueskySocialData();

  // Convert to TopicData format and limit to top 12
  return items.slice(0, 12).map(convertBlueskySocialToContent);
}
