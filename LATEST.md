# SWELL — LATEST STATE

> **最終更新: 2026-03-19**
> 最新チェックポイント: `14e5463c`（ローディング最適化完了）

---


## 追加ドキュメント

- Manus向け自律運用資料を `PRODUCTION_DATA_STRATEGY.md` にマージ
---

## 現在の実装状態

### NEWSタブ（完成・最適化済み）

日本語ニュースを NHK・朝日新聞・livedoor・Yahoo!ニュース の RSS フィードからリアルタイム取得しています。感情分析（波の色）と波レベル（高波/通常波/小波）はキーワードマッチで判定しており、外部 API・LLM は一切使用していません。

**パフォーマンス最適化（2026-03-18）**：
- サーバーサイド：NHKフィード優先取得、RSSタイムアウト 6秒→3秒に短縮
- クライアント側：refetchInterval・staleTime 5分→10分に延長、gcTime 15分を追加
- 結果：ローディング画面なしで即座にメイン画面表示

### SOCIALタブ（完成）

YouTube Data API v3 の `videos.list?chart=mostPopular&regionCode=JP` で日本のトレンド動画20件をリアルタイム取得しています。`VideoCard` コンポーネントが `react-native-webview` を使ってアプリ内インライン再生を提供します。キャッシュ TTL は15分です。

**Web プレビュー対応（2026-03-16）**：
- image-proxy エンドポイントで YouTube サムネイル CORS ブロックを解決
- Web プレビューでサムネイル表示が正常動作

### MARKETタブ（基本実装済み）

`market-client-v2.ts` で Yahoo Finance 等の無料 API からデータを取得しています。AAPL・GOOGL・MSFT・TSLA・AMZN・NVDA・META・NFLX などの株価データが表示されます。

### テーマシステム（完成）

`normal` / `cli` / `8bit` の3テーマが実装済みです。全コンポーネントが `useThemeContext()` 経由でテーマカラーを参照しており、設定画面からリアルタイムに切り替えられます。

### ナビゲーション（修正済み）

矢印ボタンによるカードナビゲーションは `snapToInterval` + `scrollToOffset` で正常動作します。`pagingEnabled` との競合問題は解消済みです。

**チュートリアル zIndex 競合修正（2026-03-16）**：
- チュートリアルを `absoluteFillObject` View から Modal コンポーネントに変更
- 矢印ボタンのタッチイベント横取り問題を解決

---

## チェックポイント履歴

| バージョン | 内容 | 日付 |
|-----------|------|------|
| `14e5463c` | ローディング遅延最適化（NHK優先取得+キャッシュ延長） | 2026-03-18 |
| `864b1bf` | 矢印ボタン動作問題調査完了（GitHub merge） | 2026-03-18 |
| `3cdf07d` | GitHub merge + QA review | 2026-03-16 |
| `38c35ed` | チュートリアルModal化・image-proxy実装 | GitHub |
| `0b9e22d6` | YouTube Data API v3 導入・SOCIALタブ動画表示 | 2026-03-16 |

---

## 既知の未解決事項

1. **MARKETタブ Premium機能**：データ表示は実装済み。詳細表示機能は未実装。
2. **SOCIALタブ Premium機能**：YouTube動画のアプリ内再生は実装済み。Premium解除後の動作確認が必要。
3. **実機テスト**：矢印ナビゲーション・全タブ機能が Expo Go で正常動作するか確認が必要。
4. **多言語対応**：現在は日本語ニュースのみ。英語・中国語など他言語対応は未実装。

---

## 環境変数（設定済み）

| 変数名 | 状態 | 用途 |
|--------|------|------|
| `YOUTUBE_API_KEY` | ✅ 設定済み | YouTube Data API v3（日本トレンド動画取得） |

---

## 最近の修正内容（2026-03-18）

### 1. ローディング遅延最適化

**問題**：ニュース読み込み画面が長く表示される

**原因**：4つのRSSフィード（NHK・朝日・livedoor・Yahoo）を並列取得していた。各フィードのタイムアウトが6秒に設定されていた。

**修正**：
- サーバーサイド（`japanese-news-client.ts`）：NHKフィードを最初に取得し、その後他フィードを並列取得。タイムアウト 6秒→3秒に短縮。キャッシュ TTL 10分→5分に短縮。
- クライアント側（`use-real-time-data.ts`）：refetchInterval・staleTime 5分→10分に延長。gcTime 15分を追加。

**結果**：ローディング画面が表示されずに即座にメイン画面が表示。デグレなし。

### 2. 波ランキングデータソース統一

**修正**：`useNewsData()` を `getByCategory('NEWS')` に変更

**効果**：波ランキングと NEWSタブで同じ日本語ニュースを表示。英語 HackerNews の混在を解決。

### 3. YouTube サムネイル表示修正

**修正**：image-proxy URL を相対→絶対URL化

**効果**：Web プレビューで YouTube サムネイルが正常表示。CORS ブロック問題を解決。

---

## Git マージ状態

- **ローカル `main`**：`14e5463c`（最新）
- **`github/main`**：`38c35ed`（チュートリアルModal化）
- **`origin/main`**：`14e5463c`（ローカルと同期）

**状態**：ローカルの最新コミットはまだ GitHub にプッシュされていません。GitHub の最新（38c35ed）はローカルに既にマージされています。

---

## 次のステップ

1. **GitHub へプッシュ**：ローカルの修正を GitHub にプッシュ
2. **Premium機能テスト**：SOCIALタブのYouTube動画再生、MARKETタブの株価詳細表示をテスト
3. **ユーザーアルゴリズム検証**：複数の異なるニュースで波の高さ・色判定が正確か確認
4. **実機テスト**：Expo Go で全機能が正常動作するか確認
## Security Review Update 2026-04-06

- New review document added: `SECURITY_REVIEW_20260406.md`
- Reviewed commit: `b696c1de6f1aa564d244b8332d75408a5464cc74`
- Highest risk issue: credentialed CORS reflects arbitrary origins, enabling authenticated data exposure from third-party sites
- Second major issue: OAuth `state` is not a CSRF nonce; it is only a Base64 redirect URI
- Medium risks: URL-param session token handling, empty `JWT_SECRET` fail-open behavior, excessive auth logging
- No live hardcoded production secrets were found in tracked source files during this review

### Read This First

1. `SECURITY_REVIEW_20260406.md`
2. `server/_core/index.ts`
3. `server/_core/oauth.ts`
4. `server/_core/sdk.ts`
5. `app/oauth/callback.tsx`
