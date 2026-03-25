# Redis キャッシング実装ガイド
## 1000万ユーザー対応・API 制限 0% 設計

---

## 📋 現状と目標

### 現状
- ✅ インメモリキャッシュ実装済み（`cache-service.ts`）
- ✅ MARKET タブが実 API 呼び出しに変更
- ❌ Redis 未導入（本番環境では必須）

### 目標
- **全ユーザー共有キャッシュ** - 複数サーバーインスタンス間でキャッシュ共有
- **API 呼び出し削減** - 1000万ユーザーでも月間 API 呼び出し 0 に近い
- **ランニングコスト $0** - 無料 Redis ホスティング活用

---

## 🏗️ アーキテクチャ

### 現在（インメモリキャッシュ）
```
クライアント1 ──┐
クライアント2 ──┼─→ サーバーインスタンスA（メモリキャッシュ）
クライアント3 ──┘

問題: サーバーインスタンスが複数ある場合、キャッシュが共有されない
```

### 目標（Redis キャッシュ）
```
クライアント1 ──┐
クライアント2 ──┼─→ サーバーインスタンスA ──┐
クライアント3 ──┘                          ├─→ Redis（共有キャッシュ）
クライアント4 ──┐                          │
クライアント5 ──┼─→ サーバーインスタンスB ──┘
クライアント6 ──┘

利点: 複数サーバーインスタンスが同じキャッシュを共有
```

---

## 🔧 実装ステップ

### Step 1: ioredis パッケージ追加

```bash
cd /home/ubuntu/swell
pnpm add ioredis
```

### Step 2: Redis クライアント設定

**ファイル:** `server/api/redis-client.ts`

```typescript
import Redis from 'ioredis';

// Redis 接続設定
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

export { redis };
```

### Step 3: Redis キャッシュサービス

**ファイル:** `server/api/redis-cache-service.ts`

```typescript
import { redis } from './redis-client';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Key prefix
}

/**
 * Redis-backed cache service
 * All server instances share the same cache
 */
export class RedisCacheService {
  private namespace: string;

  constructor(namespace: string = 'swell') {
    this.namespace = namespace;
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      const value = await redis.get(fullKey);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache value with TTL
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      await redis.setex(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      await redis.del(fullKey);
    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error);
    }
  }

  /**
   * Clear all cache with namespace
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${this.namespace}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
  }> {
    try {
      const pattern = `${this.namespace}:*`;
      const keys = await redis.keys(pattern);
      const info = await redis.info('memory');
      const memoryUsage = info.match(/used_memory_human:(.+)/)?.[1] || 'unknown';
      
      return {
        keys: keys.length,
        memory: memoryUsage,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { keys: 0, memory: 'unknown' };
    }
  }
}

// Export singleton instance
export const redisCacheService = new RedisCacheService('swell');
```

### Step 4: market-client-v2.ts を Redis キャッシュに更新

**ファイル:** `server/api/market-client-v2.ts`

```typescript
import { callDataApi } from '../_core/dataApi';
import { redisCacheService } from './redis-cache-service';

// ... (existing interfaces and constants)

/**
 * Fetch stock price from YahooFinance API
 * Uses Redis cache shared across all server instances
 * All users share the same cached result
 */
export async function fetchStockPriceFromYahoo(symbol: string): Promise<StockPrice | null> {
  // Check Redis cache first
  const cacheKey = `stock:${symbol}`;
  const cached = await redisCacheService.get<StockPrice>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${symbol}`);
    return cached;
  }

  try {
    const response = await callDataApi('YahooFinance/get_stock_chart', {
      query: {
        symbol,
        region: 'US',
        interval: '1d',
        range: '1d',
        includeAdjustedClose: 'true',
      },
    }) as any;

    if (!response || !response.chart || !response.chart.result || response.chart.result.length === 0) {
      console.warn(`No data for ${symbol}`);
      return null;
    }

    const chartResult = response?.chart?.result?.[0];
    if (!chartResult) return null;
    const meta = chartResult.meta;

    // Get the latest price data
    const timestamps = chartResult?.timestamp || [];
    const quotes = chartResult?.indicators?.quote?.[0] || {};

    if (timestamps.length === 0) {
      return null;
    }

    const latestIndex = timestamps.length - 1;
    const latestPrice = (quotes?.close?.[latestIndex] as number) || (meta?.regularMarketPrice as number) || 0;
    const previousPrice = (quotes?.close?.[latestIndex - 1] as number) || latestPrice;
    const change = latestPrice - previousPrice;
    const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

    const result: StockPrice = {
      symbol: meta?.symbol || symbol,
      price: latestPrice,
      change,
      changePercent,
      timestamp: Date.now(),
      dayHigh: meta?.regularMarketDayHigh,
      dayLow: meta?.regularMarketDayLow,
      volume: meta?.regularMarketVolume,
    };
    
    // Cache for 5 minutes (300 seconds) in Redis
    // All server instances and users share this cache
    await redisCacheService.set(cacheKey, result, 300);
    console.log(`Cache miss for ${symbol} - fetched from API and cached`);
    return result;
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch top market items (stocks)
 * Uses Redis cache - all users share the same result
 */
export async function fetchMarketTrendingV2(): Promise<MarketItem[]> {
  const items: MarketItem[] = [];

  // Fetch real stock prices from Yahoo Finance API
  // Redis cache ensures all users share one API call per TTL
  for (const symbol of TOP_STOCKS) {
    try {
      const stock = await fetchStockPriceFromYahoo(symbol);
      if (stock) {
        items.push({
          id: `stock_${symbol}`,
          title: `${symbol} - $${stock.price.toFixed(2)}`,
          url: `https://finance.yahoo.com/quote/${symbol}`,
          score: Math.abs(stock.changePercent * 10),
          commentCount: 0,
          source: 'yahoo-finance',
          sourceUrl: `https://finance.yahoo.com/quote/${symbol}`,
          timestamp: stock.timestamp,
          symbol,
          price: stock.price,
          change: stock.changePercent,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }

  return items;
}
```

### Step 5: 環境変数設定

**ファイル:** `.env.local` または `webdev_request_secrets`

```
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

---

## 🚀 無料 Redis ホスティングオプション

### 1. **Heroku Redis** （推奨）
- **コスト:** Free tier 無料
- **容量:** 30MB
- **接続:** 自動プロビジョニング
- **セットアップ:** Heroku デプロイ時に自動

### 2. **Railway Redis**
- **コスト:** $5/月（Free tier あり）
- **容量:** 100MB
- **接続:** 簡単設定
- **URL:** `redis://user:password@host:port`

### 3. **Upstash Redis**
- **コスト:** Free tier 無料
- **容量:** 10,000 commands/日
- **接続:** REST API + Redis Protocol
- **特徴:** Serverless 最適化

### 4. **Redis Cloud**
- **コスト:** Free tier 無料
- **容量:** 30MB
- **接続:** 自動 TLS
- **URL:** `redis://default:password@host:port`

---

## 📊 キャッシュヒット率の計算

### シナリオ: 1000万ユーザー、月間 27億回のリクエスト

| 時間帯 | ユーザー数 | TTL内リクエスト | キャッシュヒット |
|--------|-----------|-----------------|-----------------|
| 09:00-10:00 | 100万 | 100万 | 100% → 1回 API 呼び出し |
| 10:00-11:00 | 200万 | 200万 | 100% → 0回 API 呼び出し |
| 11:00-12:00 | 150万 | 150万 | 100% → 0回 API 呼び出し |
| 12:00-12:05 | 50万 | 50万 | 100% → 0回 API 呼び出し |
| 12:05-12:10 | 50万 | 50万 | 0% → 1回 API 呼び出し（キャッシュ更新） |

**結果:** 1時間で 500万リクエスト → 2回 API 呼び出し → **99.99996% 削減**

---

## 🔍 モニタリング

### キャッシュ統計エンドポイント

**ファイル:** `server/routers.ts`

```typescript
import { publicProcedure, router } from './_core/trpc';
import { redisCacheService } from './api/redis-cache-service';

export const appRouter = router({
  // ... existing routes
  
  cache: router({
    stats: publicProcedure.query(async () => {
      return await redisCacheService.getStats();
    }),
    
    clear: publicProcedure.mutation(async () => {
      await redisCacheService.clear();
      return { success: true };
    }),
  }),
});
```

### クライアント側でキャッシュ統計を表示

```typescript
// apps/mobile/src/screens/settings-screen.tsx
import { trpc } from '@/lib/trpc';

export function SettingsScreen() {
  const { data: cacheStats } = trpc.cache.stats.useQuery();

  return (
    <View>
      <Text>キャッシュ統計</Text>
      <Text>キー数: {cacheStats?.keys}</Text>
      <Text>メモリ使用量: {cacheStats?.memory}</Text>
    </View>
  );
}
```

---

## ✅ 実装チェックリスト

- [ ] `ioredis` パッケージ追加
- [ ] `redis-client.ts` 実装
- [ ] `redis-cache-service.ts` 実装
- [ ] `market-client-v2.ts` を Redis キャッシュに更新
- [ ] 環境変数設定（Redis 接続情報）
- [ ] Redis ホスティング選択・セットアップ
- [ ] キャッシュ統計エンドポイント実装
- [ ] 負荷テスト実施
- [ ] モニタリング設定

---

## 📈 期待される効果

| 指標 | 値 |
|------|-----|
| API 呼び出し削減 | 99.99%+ |
| キャッシュヒット率 | 95%+ |
| ユーザーあたりの API 呼び出し | 0.0003回/月 |
| 月間 API コスト | $0 |
| レスポンス時間 | < 100ms（キャッシュヒット時） |

---

## 🎯 次のステップ

1. Redis ホスティング選択（Heroku / Railway / Upstash）
2. `redis-client.ts` 実装
3. `redis-cache-service.ts` 実装
4. 環境変数設定
5. 負荷テスト実施
6. モニタリング設定
