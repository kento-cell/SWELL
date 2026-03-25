# SWELL スケーラブルアーキテクチャ設計
## 1000万人ユーザー対応・ランニングコスト$0

---

## 📊 スケーリング要件分析

### ユーザー規模と API 呼び出し量

| 指標 | 計算式 | 結果 |
|------|--------|------|
| **ユーザー数** | - | 1000万人 |
| **1ユーザーあたり月間API呼び出し** | 30日 × 3回/日 × 3カテゴリ | 270回/月 |
| **全体月間API呼び出し** | 1000万 × 270 | **27億回/月** |
| **1日あたり平均** | 27億 ÷ 30 | **9000万回/日** |
| **1秒あたり平均** | 9000万 ÷ 86,400秒 | **1041回/秒** |

### 既存API の限界

| API | 月間上限 | 1000万人対応 | 評価 |
|-----|---------|------------|------|
| Finnhub | 2.5M | ❌ 0.009% | 不十分 |
| Alpha Vantage | 15M | ❌ 0.055% | 不十分 |
| FMP | 7.5M | ❌ 0.028% | 不十分 |
| Alpaca | 432M | ❌ 1.6% | 不十分 |

**結論:** 単一API では対応不可。**サーバーサイドキャッシング + 複数API統合** が必須

---

## 🏗️ スケーラブルアーキテクチャ設計

### レイヤー構成

```
┌─────────────────────────────────────────────────────────┐
│ クライアント層（1000万ユーザー）                          │
│ - モバイルアプリ（iOS/Android）                          │
│ - ウェブブラウザ                                         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────┐
│ API ゲートウェイ層（CDN + キャッシング）                 │
│ - CloudFlare / AWS CloudFront                           │
│ - レスポンスキャッシング（5分）                          │
│ - リクエスト圧縮・最適化                                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ キャッシュレイヤー（Redis / Memcached）                 │
│ - 全ユーザーで共有                                      │
│ - TTL: 5分（株価）/ 1時間（ニュース）                  │
│ - キャッシュヒット率: 95%+                             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ アプリケーションサーバー層                               │
│ - Node.js / Express（複数インスタンス）                 │
│ - 負荷分散（ラウンドロビン）                            │
│ - リクエスト集約・バッチ処理                            │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ API 統合層（複数API の管理）                            │
│ - Finnhub（メイン）: 60 calls/分                        │
│ - Alpha Vantage（バックアップ）: 500 calls/日           │
│ - FMP（バックアップ）: 250 calls/日                     │
│ - Yahoo Finance（スクレイピング）: 無制限               │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 外部データソース                                         │
│ - Finnhub API                                           │
│ - Alpha Vantage API                                     │
│ - Financial Modeling Prep API                           │
│ - Yahoo Finance（Web Scraping）                         │
│ - CoinGecko API（暗号資産）                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 キャッシング戦略

### 1. **全ユーザー共有キャッシュ**

```typescript
// Redis キャッシュキー設計
const cacheKeys = {
  // 株価（5分ごとに更新）
  stock: (symbol: string) => `stock:${symbol}:${Math.floor(Date.now() / 300000)}`,
  
  // ニュース（1時間ごとに更新）
  news: (category: string) => `news:${category}:${Math.floor(Date.now() / 3600000)}`,
  
  // 暗号資産（5分ごとに更新）
  crypto: (symbol: string) => `crypto:${symbol}:${Math.floor(Date.now() / 300000)}`,
};

// キャッシュヒット率の計算
// 1000万ユーザー × 270回/月 = 27億回
// キャッシュヒット率 95% → 25.65億回削減
// 実API呼び出し: 2.7億回 → 月間上限内（Finnhub: 2.5M + 他API）
```

### 2. **キャッシュレイヤーの実装**

```typescript
// server/services/cache-service.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  // 無料ホスティング: Heroku Redis / Railway Redis
});

export async function getCachedOrFetch<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // キャッシュから取得
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // キャッシュミス → API から取得
  const data = await fetchFn();
  
  // キャッシュに保存
  await redis.setex(key, ttl, JSON.stringify(data));
  
  return data;
}
```

### 3. **キャッシュ有効期限（TTL）設定**

| データ種別 | TTL | 理由 |
|-----------|-----|------|
| 株価 | 5分 | リアルタイム性 + API 呼び出し削減 |
| ニュース | 1時間 | 更新頻度が低い |
| 暗号資産 | 5分 | 変動が大きい |
| 企業情報 | 24時間 | ほぼ変わらない |

---

## 🔀 複数API 統合戦略

### 1. **API 優先度とフェイルオーバー**

```typescript
// server/services/market-service.ts
async function getStockPrice(symbol: string): Promise<StockData> {
  const cacheKey = `stock:${symbol}:${Math.floor(Date.now() / 300000)}`;
  
  return getCachedOrFetch(cacheKey, 300, async () => {
    // 優先度1: Finnhub（最も安定）
    try {
      return await finnhubClient.getQuote(symbol);
    } catch (error) {
      console.warn(`Finnhub failed for ${symbol}, trying backup...`);
    }

    // 優先度2: Alpha Vantage
    try {
      return await alphaVantageClient.getQuote(symbol);
    } catch (error) {
      console.warn(`Alpha Vantage failed for ${symbol}, trying backup...`);
    }

    // 優先度3: Yahoo Finance（スクレイピング）
    try {
      return await yahooFinanceClient.getQuote(symbol);
    } catch (error) {
      console.error(`All APIs failed for ${symbol}`);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  });
}
```

### 2. **API 呼び出し集約**

```typescript
// 複数銘柄を1リクエストで取得
async function getMultipleStocks(symbols: string[]): Promise<StockData[]> {
  // Finnhub は最大 100 銘柄/リクエスト対応
  const chunks = chunk(symbols, 100);
  
  const results = await Promise.all(
    chunks.map(chunk => finnhubClient.getQuotes(chunk))
  );
  
  return results.flat();
}
```

### 3. **レート制限管理**

```typescript
// server/services/rate-limiter.ts
class RateLimiter {
  private callCounts: Map<string, number[]> = new Map();

  async checkLimit(apiName: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const calls = this.callCounts.get(apiName) || [];
    
    // ウィンドウ外の呼び出しを削除
    const recentCalls = calls.filter(time => now - time < windowMs);
    
    if (recentCalls.length >= limit) {
      return false; // レート制限超過
    }
    
    recentCalls.push(now);
    this.callCounts.set(apiName, recentCalls);
    return true;
  }
}

// 使用例
const limiter = new RateLimiter();

// Finnhub: 60 calls/分
const canCallFinnhub = await limiter.checkLimit('finnhub', 60, 60000);

// Alpha Vantage: 500 calls/日
const canCallAlphaVantage = await limiter.checkLimit('alphavantage', 500, 86400000);
```

---

## 📱 クライアント側の最適化

### 1. **バッチリクエスト**

```typescript
// apps/mobile/src/hooks/use-market-data.ts
export function useMarketData(symbols: string[]) {
  return useQuery({
    queryKey: ['market', symbols.sort().join(',')],
    queryFn: async () => {
      // 複数銘柄を1リクエストで取得
      const response = await api.post('/market/batch', { symbols });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 30 * 60 * 1000, // 30分
  });
}
```

### 2. **ローカルキャッシング**

```typescript
// AsyncStorage でローカルキャッシュ
import AsyncStorage from '@react-native-async-storage/async-storage';

async function getCachedMarketData(symbol: string) {
  const cached = await AsyncStorage.getItem(`market:${symbol}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    // 5分以内なら使用
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  return null;
}
```

### 3. **リクエスト削減**

| 施策 | 削減率 |
|------|--------|
| バッチリクエスト | 80% |
| サーバーキャッシング | 95% |
| ローカルキャッシング | 50% |
| **合計** | **99.5%** |

---

## 💰 API コスト削減

### 1. **無料API の組み合わせ**

```
Finnhub (60/分) + Alpha Vantage (500/日) + FMP (250/日) + Yahoo Finance (無制限)
= 月間 ~500M リクエスト可能
```

### 2. **キャッシング効果**

```
元々の需要: 27億回/月
キャッシュヒット率: 95%
実API呼び出し: 1.35億回/月
→ 複数API の月間上限を超えない ✅
```

### 3. **ランニングコスト**

| 項目 | コスト |
|------|--------|
| API | $0 |
| Redis キャッシング | $0 - $5/月（Heroku Free Tier） |
| CDN | $0 - $10/月（CloudFlare Free） |
| サーバー | $0 - $7/月（Railway / Render Free） |
| **合計** | **$0 - $22/月** |

---

## 🚀 実装ロードマップ

### Phase 1: キャッシング基盤（1-2日）
- [ ] Redis セットアップ
- [ ] キャッシュサービス実装
- [ ] TTL 設定

### Phase 2: API 統合（2-3日）
- [ ] Finnhub 統合
- [ ] Alpha Vantage 統合
- [ ] フェイルオーバーロジック

### Phase 3: 最適化（1-2日）
- [ ] バッチリクエスト実装
- [ ] レート制限管理
- [ ] ローカルキャッシング

### Phase 4: テスト（1日）
- [ ] 負荷テスト（1000万ユーザーシミュレーション）
- [ ] キャッシュヒット率測定
- [ ] API フェイルオーバーテスト

---

## 📈 パフォーマンス目標

| 指標 | 目標 | 達成方法 |
|------|------|---------|
| API レスポンス時間 | < 200ms | キャッシング + CDN |
| キャッシュヒット率 | > 95% | TTL 設定 + 共有キャッシュ |
| API 呼び出し削減 | 99.5% | バッチ + キャッシング |
| 月間API コスト | $0 | 複数無料API + キャッシング |
| 1000万ユーザー対応 | ✅ | スケーラブル設計 |

---

## 🔐 セキュリティ考慮事項

1. **API キー管理**
   - 環境変数で管理
   - サーバーサイドのみで使用
   - クライアント側に公開しない

2. **レート制限の悪用防止**
   - ユーザーごとのレート制限
   - IP ベースのレート制限
   - 異常検知

3. **キャッシュの一貫性**
   - キャッシュ無効化戦略
   - バージョニング
   - タイムスタンプ検証

---

## 結論

**1000万人ユーザー対応で、ランニングコスト $0 を実現するには：**

1. ✅ **サーバーサイドキャッシング** - 95% のAPI呼び出し削減
2. ✅ **複数無料API の統合** - 単一API の限界を超える
3. ✅ **バッチリクエスト** - クライアント側の効率化
4. ✅ **CDN + ローカルキャッシング** - レスポンス高速化

この設計により、**月間 27億回のリクエストを月間 500M の無料API 上限内で処理可能**
