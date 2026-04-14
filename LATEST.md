# SWELL — LATEST STATE

> **最終更新: 2026-04-14**
> ブランチ: `feature/v2-major-upgrade` / HEAD: `9464120`
> 対応 main HEAD: `c323882`（security review findings、未マージ）

---

## 現在の実装状態（v2 freemium モデル）

### NEWSタブ（完成・最適化済み）

日本語ニュースを NHK・朝日新聞・Yahoo・livedoor・NHK International・BBC Japanese の RSS フィードから取得。国内/国際ソースをラウンドロビンで混合。感情分析（波の色）と波レベル（高波/通常波/小波）は全てキーワードマッチで判定、外部 API・LLM は一切使用せず。

**配信インフラ（v2）**：バッチスケジューラが 2〜5 分ごとに `public/data/news.json` を生成、Express の静的配信で返す。クライアントは静的 JSON 優先、tRPC フォールバック。

### SOCIALタブ（完成）

**実装: はてなブックマーク人気エントリー + Togetter トレンド**（`server/api/buzz-client.ts`）。日本語バズコンテンツを提供。

> ⚠️ 注意: YouTube Data API 系インフラ (`video-client.ts`, `fetchVideosData`, `getVideos` tRPC endpoint, `VideoCard` コンポーネント) は **v2 で SOCIAL タブから切り離され、現在は dead code として残置**されている。将来の YouTube 再統合時に復活予定。

### MARKETタブ（完成）

30+ シンボルを 6 カテゴリで表示:
- **指数**: Nikkei, S&P 500, USD/JPY
- **暗号資産**: BTC, ETH, SOL, XRP, DOGE, ADA, AVAX, LINK, DOT, MATIC
- **商品**: Gold, Silver, Platinum
- **為替**: EUR/JPY, GBP/JPY, AUD/JPY, CNY/JPY, KRW/JPY, EUR/USD
- **投信 (ETF proxy)**: All Country, S&P500, VTI, QQQ, VWO, VYM
- **米国株**: AAPL, GOOGL, MSFT, TSLA, NVDA, META

全て Yahoo Finance 公開エンドポイント経由で取得（認証不要・コスト 0）。`scripts/set_today_covers.py` 系のバッチはなし、サーバ側 `scripts/batch` で静的 JSON 生成。グループカードスワイプ UI 対応、カスタムウォッチリストあり（自動カテゴリ分類）。

### Freemium モデル（v2）

**v1.0 のカテゴリロックは廃止**。3カテゴリ全てを Free でアクセス可能に変更。差別化は以下でおこなう:

- **Free**:
  - NEWS / SOCIAL / MARKET 全カテゴリ閲覧可
  - NEWS/SOCIAL は最新 5 件まで
  - MARKET は「主要指標」グループのみ（Nikkei/S&P500/USDJPY）
- **Premium (¥480/月)**:
  - アイテム数無制限
  - MARKET 全 6 カテゴリ解放
  - 広告なし、履歴無制限、トピック保存、通知
  - 初回 7 日間無料トライアル自動付与

Free/Premium カテゴリ定義: `lib/types.ts:FREE_CATEGORIES = ['NEWS','SOCIAL','MARKET']` / `PREMIUM_CATEGORIES = []`。

### テーマシステム（完成）

`normal` / `cli` / `8bit` の3テーマ実装済み。全コンポーネントが `useThemeContext()` 経由でテーマカラーを参照し、設定画面からリアルタイム切り替え可能。

### iOS Widget（v2 追加）

SwiftUI + WidgetKit で NEWS/SOCIAL/MARKET タブ切替対応。Small/Medium/Large サイズで live データ表示、トライアル警告表示、MARKET アイコンのカラーバッジ、`/dev/widget-preview` でデザインラボ提供。

### オンボーディング

興味選択 UI を追加: News 系(politics/economy/tech/sports) + Social 系(viral/food/anime/money)。フィード優先度のパーソナライズに反映。

---

## セキュリティレビュー所見（2026-04-06、main branch）

レビュー対象コミット `b696c1d`、**High 2件 / Medium 3件が未対応**で main ブランチに記録(`SECURITY_REVIEW_20260406.md`)。

| # | 重要度 | 内容 |
|---|--------|------|
| 1 | 🔴 High | CORS が `Origin` を反射 + `Allow-Credentials: true` → 悪意あるサイトから認証済みエンドポイントを読める |
| 2 | 🔴 High | OAuth `state` が base64 redirectUri のみで CSRF 防御になっていない |
| 3 | 🟡 Medium | `sessionToken` を URL クエリから受け取って保存 |
| 4 | 🟡 Medium | `JWT_SECRET` が `""` にフォールバック |
| 5 | 🟡 Medium | 認証トークン断片・ユーザー情報の過剰ログ出力 |

**この5件は本セッションでは対応していない。** 設計判断(CORS allowlist、nonce ストア方式)を伴うため別セッションで腰を据えて実施する予定。

---

## 既知の未解決事項

1. **TypeScript エラー (事前から存在)**:
   - `app/(tabs)/index.tsx:120` — `FREE_MARKET_GROUPS` が宣言前に使用 (hoisting バグ)
   - `app/(tabs)/index.tsx:388` / `components/watchlist-modal.tsx:89,120` — theme colors に存在しない `accent` プロパティ参照
2. **MARKETタブ Premium 詳細**: 株価詳細チャート未実装 (`WaveChart.tsx` で波ビジュアル予定)
3. **実機テスト**: Expo Go での全機能動作確認が未実施
4. **多言語対応**: 日本語のみ、英語・中国語は未実装
5. **Redis キャッシュ未導入**: 現状インメモリキャッシュ、複数インスタンス間共有不可
6. **ネットワーク flaky テスト**: `data-integration.test.ts > RSS feeds` が Reuters Business の 520 エラーでタイムアウトする

---

## 環境変数

| 変数名 | 状態 | 用途 |
|--------|------|------|
| `YOUTUBE_API_KEY` | ✅ 設定済み | YouTube Data API v3(現在 dead code 経路、将来復活時に使用) |
| `JWT_SECRET` | ⚠️ 要設定 | セッション署名(未設定時は空文字にフォールバック、security finding #4) |

---

## 今回のセッションで対応した内容（2026-04-14）

**衛生整備:**
- remote force-push 起点の divergent 状態を backup ブランチ取得の上で `reset --hard origin` で同期(`backup/local-20260414-sync`, `backup/main-local-20260414` 保存)
- `package-lock.json` 削除(pnpm 専用統一)
- `.gitignore` に `.claude/`, `package-lock.json`, `public/data/` を追加
- 空の入れ子 `E:\SWELL\SWELL\` 削除
- コミット `9464120` として push 済み

**仕様整合性修正:**
- `lib/types.ts`: `FREE_CATEGORIES` を ['NEWS','SOCIAL','MARKET'] に拡張、`PREMIUM_CATEGORIES` を空配列に(v2 freemium モデルに合わせる)
- `app/(tabs)/index.tsx:140`: `isLocked` のハードコード SOCIAL 除外を削除
- `components/premium-sheet.tsx`: Premium 比較表を「カテゴリ単位」から「アイテム数/MARKET範囲」ベースに書き換え
- `components/tutorial.tsx`: 「SOCIAL/MARKET は Premium」の説明文を「全カテゴリ利用可、Premium で制限解除」に変更
- `lib/__tests__/mock-data.test.ts`: テスト期待値を v2 仕様に合わせる

**バグ修正:**
- `components/pixel-arrow.tsx`: native 分岐が `<View>` + `onTouchStart` で `onPress` を呼んでいなかったバグを `Pressable` 化で修正(矢印ナビ未反応問題の根本原因)

**ドキュメント修正:**
- `server/api/data-router.ts:117`: SOCIAL データソースのコメントから存在しない `+ YouTube` を削除、dead code 注記追加
- このファイル (`LATEST.md`): 現実の v2 実装に合わせて全面改訂

---

## Git 状態

- **`feature/v2-major-upgrade`**: HEAD `9464120`(衛生整備)→ このセッションで Free/Premium 修正 + pixel-arrow 修正 + doc 刷新を追加予定
- **`main`**: HEAD `c323882`(security review findings)、feature へのマージ未実施
- **バックアップブランチ**: `backup/local-20260414-sync`, `backup/main-local-20260414`(動作確認後に削除可)

---

## 次のステップ

1. **セキュリティ修正**: High 2件 (CORS allowlist, OAuth state nonce) を別セッションで腰を据えて実施
   - 最初に読むべきファイル: `SECURITY_REVIEW_20260406.md`, `server/_core/index.ts`, `server/_core/oauth.ts`, `server/_core/sdk.ts`, `app/oauth/callback.tsx`
2. **TypeScript 事前エラーの解消**: `FREE_MARKET_GROUPS` hoisting、`accent` プロパティ欠落
3. **実機テスト**: Expo Go で全機能が動作するか確認
4. **Redis キャッシュ導入**: `REDIS_CACHING_GUIDE.md` の設計に基づいて実装
