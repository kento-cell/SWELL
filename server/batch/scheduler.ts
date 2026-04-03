/**
 * バッチスケジューラー: 静的JSONを定期生成
 *
 * サーバー起動時に即時実行し、以降は定期的に再生成する。
 * NEWS: 2分間隔、SOCIAL/MARKET: 5分間隔
 */
import { fetchNewsData, fetchSocialData, fetchMarketData } from '../api/data-router';
import { fetchJapaneseNews } from '../api/japanese-news-client';
import path from 'path';
import fs from 'fs';

const OUTPUT_DIR = path.resolve(__dirname, '../../public/data');

/**
 * 日本語ニュースのみ取得（HackerNewsフォールバック廃止）
 */
async function fetchJapaneseNewsData() {
  const topics = await fetchJapaneseNews();
  return {
    category: 'NEWS' as const,
    items: topics.map((t) => ({
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

async function generateCategory(category: string, fetcher: () => Promise<any>) {
  try {
    const data = await fetcher();
    if (data.items.length === 0) {
      console.warn(`[batch] ${category}: no items, skipping write`);
      return;
    }
    const filePath = path.join(OUTPUT_DIR, `${category.toLowerCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log(`[batch] ${category}: ${data.items.length} items updated`);
  } catch (err) {
    console.error(`[batch] ${category}: error`, err instanceof Error ? err.message : err);
  }
}

function writeMeta() {
  const meta = { generatedAt: new Date().toISOString(), timestamp: Date.now() };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'meta.json'), JSON.stringify(meta));
}

export function startBatchScheduler() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('[batch] Scheduler started — initial generation in 5s');

  // 起動後5秒で初回生成（サーバー起動を優先）
  setTimeout(async () => {
    console.log('[batch] Running initial generation...');
    await Promise.all([
      generateCategory('NEWS', fetchJapaneseNewsData),
      generateCategory('SOCIAL', fetchSocialData),
      generateCategory('MARKET', fetchMarketData),
    ]);
    writeMeta();
    console.log('[batch] Initial generation complete');
  }, 5000);

  // NEWS: 2分間隔（日本語ニュースのみ）
  setInterval(async () => {
    await generateCategory('NEWS', fetchJapaneseNewsData);
    writeMeta();
  }, 2 * 60 * 1000);

  // SOCIAL + MARKET: 5分間隔
  setInterval(async () => {
    await Promise.all([
      generateCategory('SOCIAL', fetchSocialData),
      generateCategory('MARKET', fetchMarketData),
    ]);
    writeMeta();
  }, 5 * 60 * 1000);
}
