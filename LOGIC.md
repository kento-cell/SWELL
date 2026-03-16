# SWELL — ロジック解説書

このドキュメントは、SWELLアプリの主要なデータ処理ロジックを説明します。

---

## 1. ニュース引用元（NEWSタブ）

RSSフィードから直接取得しています。外部APIキー不要・完全無料。

| 引用元 | RSS URL | 更新頻度 |
|--------|---------|----------|
| NHK ニュース | `https://www3.nhk.or.jp/rss/news/cat0.xml` | 随時 |
| 朝日新聞 | `https://www.asahi.com/rss/asahi/newsheadlines.rdf` | 随時 |
| 毎日新聞 | `https://mainichi.jp/rss/etc/mainichi-flash.rss` | 随時 |
| livedoor ニュース | `https://news.livedoor.com/topics/rss/top.xml` | 随時 |
| Yahoo!ニュース（国内） | `https://news.yahoo.co.jp/rss/topics/domestic.xml` | 随時 |

サーバーサイドで5分間キャッシュされます。

---

## 2. ニュース要約処理（NEWSタップ時の表示）

**LLM（AI）は一切使用していません。コスト0です。**

処理フロー：

```
RSS取得
  └─ item.description を取得
       └─ HTMLタグを除去（正規表現）
            └─ 先頭150文字を切り取り → summary として表示
                 └─ 全文（description全体）→ detail として詳細画面に表示
```

`server/api/japanese-news-client.ts` の `parseRSSFeed()` 関数内で処理。

---

## 3. 波レベル（waveLevel）の決定ロジック

波の「大きさ」を表します。記事タイトル + 説明文のキーワードマッチで判定。

### 高波（high）— 重大・緊急ニュース

以下のキーワードのいずれかが含まれる場合：

```
緊急, 速報, 重大, 大規模, 震度, 津波, 台風, 爆発, 崩壊, 死亡, 死者,
被害, 警報, 避難, 危機, 崩壊, 倒産, リコール, 逮捕, 起訴, 辞任,
暴落, 急落, 大幅, 最大, 史上, 記録, 初めて
```

### 低波（low）— 軽微・日常ニュース

以下のキーワードのいずれかが含まれる場合（高波に該当しない場合）：

```
予定, 計画, 検討, 見通し, 予想, 見込み, 試験, 実験, 研究,
発表, 開催, 募集, 案内, お知らせ
```

### 通常波（medium）— それ以外

---

## 4. 波の色（waveSentiment）の決定ロジック

波の「感情・方向性」を表します。

| 色 | 意味 | 判定キーワード |
|----|------|----------------|
| 🔴 red（炎上） | 否定的・危険 | 死亡, 事故, 事件, 逮捕, 炎上, 批判, 反発, 問題, 失敗, 崩壊, 倒産, 暴落, 被害, 危険, 警告, 違反, 不正, 疑惑 |
| 🟡 yellow（賛否） | 中立・注目 | 議論, 賛否, 物議, 検討, 議会, 選挙, 投票, 政策, 規制, 法案, 改正, 問題, 課題 |
| 🟢 green（好意的） | ポジティブ | 成長, 回復, 達成, 成功, 受賞, 優勝, 記録, 新記録, 上昇, 増加, 黒字, 利益, 開発, 発明, 革新, 解決, 改善, 支援, 援助 |
| 🔵 blue（中立） | それ以外 | — |

優先順位：red > yellow > green > blue

---

## 5. 波ランキング（WaveRankingWidget）

NEWSタブのリアルタイムデータから、`waveLevel === 'high'` の記事を優先的に抽出してランキング表示します。

```typescript
// wave-ranking-widget.tsx 内の処理
const ranked = topics
  .sort((a, b) => {
    const levelScore = { high: 3, medium: 2, low: 1 };
    return levelScore[b.waveLevel] - levelScore[a.waveLevel];
  })
  .slice(0, 5); // 上位5件を表示
```

---

## 6. SOCIALタブ（YouTube動画）

**YouTube Data API v3** を使用（1日10,000クォータ無料）。

```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,statistics,contentDetails
  &chart=mostPopular
  &regionCode=JP
  &maxResults=20
  &key={YOUTUBE_API_KEY}
```

- 日本（`regionCode=JP`）のトレンド動画上位20件を取得
- サムネイル: `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`
- 再生: WebView で YouTube iframe 埋め込み（アプリ内再生）
- キャッシュ: 5分間

---

## 7. MARKETタブ

Yahoo Finance の公開API（APIキー不要）を使用。

取得銘柄：日経平均（`^N225`）、ドル円（`JPY=X`）、BTC/USD（`BTC-USD`）

---

## 8. データキャッシュ戦略

全データは `CacheService`（`server/api/cache-service.ts`）でメモリキャッシュ。

| データ種別 | TTL（有効期間） |
|-----------|----------------|
| NEWS（日本語ニュース） | 5分 |
| SOCIAL（YouTube動画） | 5分 |
| MARKET（株価・為替） | 5分 |

サーバー再起動でキャッシュはクリアされます。
