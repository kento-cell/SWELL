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

## 11. Manus向け自律運用方針（資産マージ版）

### 方針のまとめ

ユーザー規模10,000人を想定し、サーバ不要・自律運用を実現するための改善案を以下に整理する。

### 11-1. データ取得をバッチ化し静的ファイル配信へ

- 外部APIの呼び出しをサーバレス関数（GitHub Actions / Cloudflare Workers）でバッチ処理し、10〜60分おきにニュース・ソーシャル・株価・動画データを取得する。
- 取得データはJSONとして Cloudflare Pages などの静的ホスティングにアップロードする。
- Cloudflare Pages などの静的ホスティングを採用し、無料枠の範囲と最新制限を都度確認しながら1万人規模でも追加費用を抑える。
- クライアントはこのJSONを取得して表示するだけの構成にし、更新失敗時は前回JSONやフォールバックデータでアプリ停止を防ぐ。

### 11-2. 株価・動画機能の見直し

#### 株価情報

- 現状の `forgeApiKey` が必要な内部API依存を見直し、公開エンドポイント（例: `https://query1.finance.yahoo.com/v8/finance/chart`）を利用する。
- クライアント側でも取得できるロジックへ刷新し、秘密鍵不要な運用に寄せる。
- 複数銘柄を一括取得し、一定時間キャッシュしてリクエスト数を抑制する。

#### 動画トレンド

- YouTube Data API の1日10,000ユニット制限では大規模利用に耐えにくいため、利用規約順守を前提に代替データソース評価または動画機能の縮小運用を検討する。
- 代替APIが見つかる場合はそちらを優先採用する。

### 11-3. キャッシュと更新頻度の調整

- iOSウィジェットには1日あたり約40〜70回の更新予算しかない前提で設計する。
- JSONの更新間隔は長め（例: 1時間）に設定する。
- アプリ側でもローカルキャッシュを持ち、通信量と表示待ちを抑える。

### 11-4. フォールバックと監視

- 日本語ニュースクライアント同様、取得失敗時に表示するフォールバックデータを各カテゴリに用意する。
- バッチ処理失敗やAPIキー期限を監視し、自動アラートと運用Runbookでメンテナンス負荷を減らす。

### 11-5. 株価表示のデザイン提案

株価を見やすくするため、ウィジェット内にシンプルなラインチャートを表示する。

- **シンプルなライン表示**: 明るい背景にダークブルーのラインを引き、上下トレンドを直感的に把握可能にする。
- **余白と文字サイズ**: モバイルウィジェットでも読みやすいよう余白を大きめに取り、価格と日付は必要最小限を表示する。
- **トレンド強調**: 直近変動を強調するためラインの太さや色合いを調整し、必要に応じて前日比やパーセンテージを小さく表示する。
- **色覚への配慮**: 色覚バリアフリー配色（青系・オレンジ系など）を採用し、識別しやすさを確保する。

チャート描画はクライアント側ライブラリ（`react-native-svg-charts` や `SwiftUI Charts`）で実装し、静的JSONに含まれる株価配列を使って描画する。

### 11-6. まとめ

上記方針により、サーバ常時稼働をなくしながら10,000人規模ユーザーにも安定配信しやすくなる。Manusチームで進めるフロントエンド実装に対し、本資料を実装方針とデザイン共有のベースとして利用する。

---

## 参考資料
- HackerNews API: https://github.com/HackerNews/API
- Reddit API: https://www.reddit.com/dev/api
- Alpha Vantage: https://www.alphavantage.co/documentation/
