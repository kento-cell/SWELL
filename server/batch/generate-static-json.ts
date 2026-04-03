/**
 * バッチスクリプト: 全カテゴリのデータを静的JSONファイルとして出力
 *
 * 実行: pnpm batch
 * 出力先: public/data/{news,social,market}.json
 *
 * Cloudflare Pages等の静的ホスティングにそのままデプロイ可能。
 * サーバーレスで100万ユーザー以上に配信できる。
 */
import { fetchNewsData, fetchSocialData, fetchMarketData } from '../api/data-router';
import { fetchJapaneseNews } from '../api/japanese-news-client';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/data');

async function generateAll() {
  console.log('[batch] Starting static JSON generation...');
  const start = Date.now();

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 日本語ニュースのみ（HackerNewsフォールバック廃止）
  async function fetchJapaneseNewsData() {
    const topics = await fetchJapaneseNews();
    return {
      category: 'NEWS' as const,
      items: topics.map((t: any) => ({
        id: t.id,
        title: t.title,
        url: t.sourceUrl || '',
        sourceUrl: t.sourceUrl || '',
        source: t.source,
        waveLevel: t.waveLevel,
        waveSentiment: t.waveSentiment,
        timestamp: new Date(t.publishedAt).getTime(),
        description: t.summary,
      })),
      lastUpdated: Date.now(),
      source: '日本語ニュース (NHK・朝日・BBC・Yahoo)',
    };
  }

  // Fetch all categories in parallel
  const [news, social, market] = await Promise.allSettled([
    fetchJapaneseNewsData(),
    fetchSocialData(),
    fetchMarketData(),
  ]);

  const results: Record<string, any> = {};

  // NEWS
  if (news.status === 'fulfilled' && news.value.items.length > 0) {
    const newsPath = path.join(OUTPUT_DIR, 'news.json');
    fs.writeFileSync(newsPath, JSON.stringify(news.value, null, 2));
    results.news = `${news.value.items.length} items`;
    console.log(`[batch] NEWS: ${news.value.items.length} items → news.json`);
  } else {
    const reason = news.status === 'rejected' ? news.reason : 'empty';
    console.warn(`[batch] NEWS: failed (${reason})`);
    results.news = 'failed';
  }

  // SOCIAL
  if (social.status === 'fulfilled' && social.value.items.length > 0) {
    const socialPath = path.join(OUTPUT_DIR, 'social.json');
    fs.writeFileSync(socialPath, JSON.stringify(social.value, null, 2));
    results.social = `${social.value.items.length} items`;
    console.log(`[batch] SOCIAL: ${social.value.items.length} items → social.json`);
  } else {
    const reason = social.status === 'rejected' ? social.reason : 'empty';
    console.warn(`[batch] SOCIAL: failed (${reason})`);
    results.social = 'failed';
  }

  // MARKET
  if (market.status === 'fulfilled' && market.value.items.length > 0) {
    const marketPath = path.join(OUTPUT_DIR, 'market.json');
    fs.writeFileSync(marketPath, JSON.stringify(market.value, null, 2));
    results.market = `${market.value.items.length} items`;
    console.log(`[batch] MARKET: ${market.value.items.length} items → market.json`);
  } else {
    const reason = market.status === 'rejected' ? market.reason : 'empty';
    console.warn(`[batch] MARKET: failed (${reason})`);
    results.market = 'failed';
  }

  // Write metadata
  const meta = {
    generatedAt: new Date().toISOString(),
    timestamp: Date.now(),
    results,
    durationMs: Date.now() - start,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2));

  console.log(`[batch] Done in ${meta.durationMs}ms`);
  return meta;
}

// CLI実行時
generateAll()
  .then((meta) => {
    console.log('[batch] Results:', JSON.stringify(meta.results));
    process.exit(0);
  })
  .catch((err) => {
    console.error('[batch] Fatal error:', err);
    process.exit(1);
  });

export { generateAll };
