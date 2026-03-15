# Swell 本番運用データ取得戦略

## 概要
Swellは3つのカテゴリ（NEWS・SOCIAL・MARKET）でリアルタイムデータを提供します。各カテゴリは異なるデータソースから、利用規約を遵守しながら「グレーゾーン」で運用されます。

---

## 1. NEWS カテゴリ

### データ取得元
**HackerNews API** (https://news.ycombinator.com/api)

### 特徴
- テック・スタートアップ・ビジネス関連のニュース
- エンジニア・起業家・投資家向けコンテンツ
- リアルタイム性が高い（新着は数秒で反映）

### API仕様
```
GET /topstories.json → Top 500 story IDs
GET /item/{id}.json → Story details (title, url, score, time, by, etc.)
```

### 利用規約
- ✅ 商用利用OK
- ✅ API制限なし（無制限）
- ✅ キー不要
- ⚠️ 帰属表示推奨（"Powered by HackerNews"）
- ⚠️ 過度なスクレイピング禁止（1秒に1リクエスト以下推奨）

### キャッシング戦略
- **更新頻度**: 10分ごと（API制限なし、ユーザー体験優先）
- **キャッシュ対象**: Top 20 stories
- **キャッシュ方式**: サーバーサイド Redis/メモリ

### 表示データ項目（優先順）
1. **タイトル** — 記事の見出し
2. **波レベル** — スコア（0-100）から自動計算
3. **波感情** — コメント数・スコア比率から判定
4. **ソース** — "HackerNews"
5. **リンク** — 元記事URL

### ユーザー体験
- テック業界の「今、何が話題か」を一目で把握
- スコア＝温度感（波の高さ）として可視化
- コメント活発度＝感情傾向（波の色）として表現

---

## 2. SOCIAL カテゴリ

### データ取得元
**Reddit API** (https://www.reddit.com/api)

### 特徴
- 社会トレンド・ポップカルチャー・一般ニュース
- ユーザー生成コンテンツ（UGC）が豊富
- コミュニティの反応が即座に反映

### API仕様
```
GET /r/{subreddit}/hot.json → Trending posts
GET /r/{subreddit}/top.json?t=day → Daily top posts
```

### 対象サブレディット
- r/worldnews — 国際ニュース
- r/news — 一般ニュース
- r/technology — テクノロジー
- r/business — ビジネス
- r/science — 科学

### 利用規約
- ✅ 商用利用OK
- ✅ API制限: 60 requests/minute
- ✅ キー不要（ただしUser-Agent必須）
- ⚠️ 帰属表示必須（"via Reddit"）
- ⚠️ ユーザーデータの保存禁止
- ⚠️ 過度な自動化禁止

### キャッシング戦略
- **更新頻度**: 15分ごと（60req/分制限を考慮）
- **キャッシュ対象**: 各サブレディット Top 10
- **キャッシュ方式**: サーバーサイド Redis

### 表示データ項目（優先順）
1. **タイトル** — ポストのタイトル
2. **波レベル** — Upvotes（0-100スケール）
3. **波感情** — Upvote/Downvote比率から判定
4. **ソース** — "Reddit"
5. **リンク** — ポストURL

### ユーザー体験
- 社会全体の「今、何が議論されているか」を把握
- Upvote数＝温度感（波の高さ）
- コメント数・議論活発度＝感情傾向（波の色）

---

## 3. MARKET カテゴリ

### データ取得元
**複合戦略**

#### 3-1. 株価・市場情報
**Alpha Vantage API** (https://www.alphavantage.co/)

**特徴**
- 米国株・暗号資産の価格データ
- テック企業（AAPL, GOOGL, MSFT, TSLA等）の株価
- リアルタイム性（遅延15分）

**API仕様**
```
GET /query?function=GLOBAL_QUOTE&symbol=AAPL → Stock price
GET /query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD → Crypto
```

**利用規約**
- ✅ 商用利用OK
- ✅ 無料枠: 5 requests/minute, 500 requests/day
- ✅ キー取得必須（無料）
- ⚠️ 帰属表示推奨（"Data from Alpha Vantage"）
- ⚠️ 過度なリクエスト禁止

**キャッシング戦略**
- **更新頻度**: 30分ごと（API制限を考慮）
- **キャッシュ対象**: Top 10 stocks + 主要暗号資産
- **キャッシュ方式**: サーバーサイド Redis

#### 3-2. トレンド・市場ニュース
**Reddit r/stocks, r/investing** から抽出

**特徴**
- 投資家・トレーダーの議論
- 市場心理の反映
- リアルタイムな反応

**キャッシング戦略**
- **更新頻度**: 15分ごと
- **キャッシュ対象**: Top 5 posts

### 表示データ項目（優先順）
1. **銘柄/通貨** — AAPL, BTC等
2. **現在価格** — $150.25等
3. **波レベル** — 価格変動率（-10% ～ +10%）
4. **波感情** — 市場センチメント（Reddit議論から推定）
5. **ソース** — "Alpha Vantage" / "Reddit"
6. **リンク** — 企業ページ / Reddit ポスト

### ユーザー体験
- 「今、投資家たちが何に注目しているか」を把握
- 価格変動＝波の高さ
- 市場心理＝波の色

---

## 4. キャッシング戦略（統合）

### サーバーサイド実装
```
Cache Layer: Redis (TTL設定)
├─ NEWS: 10分 (HackerNews API)
├─ SOCIAL: 15分 (Reddit API)
└─ MARKET: 30分 (Alpha Vantage + Reddit)
```

### キャッシュミス時の動作
1. APIリクエスト実行
2. レスポンス取得
3. キャッシュに保存（TTL付き）
4. クライアントに返却

### レートリミティング
```
HackerNews: 無制限 → 1sec/req (礼儀)
Reddit: 60req/min → 1req/sec (制限内)
Alpha Vantage: 5req/min → 1req/12sec (制限内)
```

---

## 5. 利用規約遵守表記

### アプリ内表記
- **フッター**: 各データソースの帰属表示
- **設定画面**: 利用規約・プライバシーポリシーリンク
- **トピック詳細**: "Data from [Source]" バッジ

### 例
```
Powered by:
- HackerNews (https://news.ycombinator.com/)
- Reddit (https://www.reddit.com/)
- Alpha Vantage (https://www.alphavantage.co/)
```

---

## 6. ソース元リンク機能

### 実装内容
- **トピック詳細画面**: 「元記事を読む」ボタン
- **リンク先**: 各ソースの元ページ
  - HackerNews: https://news.ycombinator.com/item?id={id}
  - Reddit: https://reddit.com{permalink}
  - Alpha Vantage: 企業ページ（Google Finance等）

---

## 7. グレーゾーン運用

### 遵守する項目
- ✅ 利用規約を読み、制限を守る
- ✅ キャッシング・レートリミティングで負荷軽減
- ✅ 帰属表示・リンク提供
- ✅ ユーザーデータ保存禁止

### グレーゾーン判断
- ⚠️ **キャッシング**: 利用規約に明記されていないが、一般的な実装
- ⚠️ **データ加工**: スコア・感情判定は独自計算（二次利用）
- ⚠️ **商用利用**: 利用規約では「OK」だが、大規模化時は要相談

### リスク軽減
1. **透明性**: 全データソースを明示
2. **リンク提供**: ユーザーが元ページにアクセス可能
3. **負荷軽減**: キャッシング・レート制限で過度な利用を防止
4. **監視**: API利用状況を定期的に確認

---

## 8. 環境変数・キー管理

### 必須キー
```
HACKERNEWS_API_URL=https://hacker-news.firebaseio.com/v0
REDDIT_CLIENT_ID=<your_reddit_app_id>
REDDIT_CLIENT_SECRET=<your_reddit_app_secret>
REDDIT_USER_AGENT=Swell/1.0 (by your_username)
ALPHA_VANTAGE_API_KEY=<your_alpha_vantage_key>
REDIS_URL=redis://localhost:6379
```

### 取得方法
- **HackerNews**: キー不要（URL固定）
- **Reddit**: https://www.reddit.com/prefs/apps → Create App
- **Alpha Vantage**: https://www.alphavantage.co/api/ → Free API Key

---

## 9. 実装ロードマップ

### Phase 1: HackerNews統合
- [ ] API クライアント実装
- [ ] キャッシング設定
- [ ] テスト

### Phase 2: Reddit統合
- [ ] OAuth認証実装
- [ ] API クライアント実装
- [ ] キャッシング設定
- [ ] テスト

### Phase 3: Market統合
- [ ] Alpha Vantage API統合
- [ ] Reddit r/stocks 統合
- [ ] キャッシング設定
- [ ] テスト

### Phase 4: 本番運用
- [ ] 利用規約表記追加
- [ ] ソース元リンク機能
- [ ] 監視・ログ設定
- [ ] 本番テスト

---

## 10. 今後の拡張可能性

### グレーゾーン内での拡張
- **ニュースAPI**: NewsAPI（有料）への移行
- **Twitter/X API**: トレンド・ツイート取得
- **Bloomberg**: 市場ニュース（スクレイピング）
- **YouTube**: テック系チャンネルの動画トレンド

### 注意点
- 各APIの利用規約を必ず確認
- 商用利用時は事前に確認・許可取得
- ユーザーデータ保存は厳禁
- 過度な自動化は避ける

---

## 参考資料
- HackerNews API: https://github.com/HackerNews/API
- Reddit API: https://www.reddit.com/dev/api
- Alpha Vantage: https://www.alphavantage.co/documentation/
