# SWELL — PROJECT CONTEXT

> **このファイルはAIエージェントが作業開始時に最初に読む参照ドキュメントです。**
> 編集・更新は人間が行い、AIは読み取り専用で参照します。

---

## 1. プロジェクト概要

**SWELL** は「波を読む」をコンセプトにした、ウィジェット完結型のニュース・ソーシャル・マーケット情報アプリです。日本語ニュース・YouTube トレンド動画・株式市場データを1画面で閲覧でき、サブスクリプション（Free / Premium）によって機能が制限されます。

| 項目 | 内容 |
|------|------|
| **プラットフォーム** | iOS / Android / Web（Expo SDK 54） |
| **フレームワーク** | React Native 0.81 + Expo Router 6 |
| **スタイリング** | NativeWind 4（Tailwind CSS） |
| **言語** | TypeScript 5.9 |
| **バックエンド** | Express + tRPC（ポート 3000） |
| **フロントエンド開発サーバー** | Metro（ポート 8081） |
| **パッケージマネージャー** | pnpm |
| **テスト** | Vitest |

---

## 2. ディレクトリ構造

```
swell/
├── app/
│   ├── _layout.tsx              ← ルートレイアウト（全プロバイダー登録）
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← タブバー設定（WAVE / SETTINGS）
│   │   ├── index.tsx            ← ホーム画面（カテゴリ切替・カードFlatList）
│   │   └── settings.tsx         ← 設定画面（テーマ・プラン・言語）
│   ├── topic/[id].tsx           ← トピック詳細画面
│   ├── clips/widget.tsx         ← ウィジェット表示
│   └── dev/theme-lab.tsx        ← テーマ開発用ラボ
│
├── components/
│   ├── category-tab.tsx         ← カテゴリタブ（NEWS/SOCIAL/MARKET）
│   ├── topic-card.tsx           ← ニュース・マーケットカード
│   ├── video-card.tsx           ← YouTube動画カード（WebView埋め込み）
│   ├── wave-ranking-widget.tsx  ← 波ランキングウィジェット
│   ├── pixel-text.tsx           ← ドット絵フォントテキスト
│   ├── pixel-button.tsx         ← ドット絵ボタン
│   ├── pixel-arrow.tsx          ← 左右ナビゲーション矢印
│   ├── pixel-card.tsx           ← ドット絵カードベース
│   ├── tutorial.tsx             ← チュートリアルモーダル
│   ├── premium-sheet.tsx        ← プレミアムアップグレードシート
│   ├── lock-overlay.tsx         ← ロックオーバーレイ（有料コンテンツ）
│   ├── page-indicator.tsx       ← ページドット
│   ├── theme-selector.tsx       ← テーマ選択UI
│   └── screen-container.tsx     ← SafeAreaラッパー（全画面で使用）
│
├── lib/
│   ├── types.ts                 ← 全型定義（Topic, Category, WaveLevel等）
│   ├── mock-data.ts             ← フォールバック用モックデータ
│   ├── theme-provider.tsx       ← テーマコンテキスト（ThemeContext）
│   ├── theme-system.ts          ← テーマ定義（normal/cli/8bit）
│   ├── localization-context.tsx ← 多言語コンテキスト
│   ├── translations.ts          ← 翻訳辞書（日本語・英語）
│   ├── plan-context.tsx         ← プラン状態（free/premium）
│   ├── topic-context.tsx        ← 選択トピック状態
│   └── user-preferences-context.tsx ← ユーザー設定
│
├── hooks/
│   ├── use-real-time-data.ts    ← tRPC経由でサーバーからデータ取得
│   ├── use-colors.ts            ← テーマカラーフック
│   └── use-color-scheme.ts      ← ダーク/ライトモード
│
├── server/
│   ├── api/
│   │   ├── japanese-news-client.ts  ← 日本語ニュースRSS取得・感情分析
│   │   ├── video-client.ts          ← YouTube Data API v3（トレンド動画）
│   │   ├── market-client-v2.ts      ← マーケットデータ取得
│   │   ├── data-router.ts           ← 各カテゴリのデータ取得統合
│   │   ├── trpc-data-router.ts      ← tRPCルーター（getByCategory）
│   │   └── cache-service.ts         ← インメモリキャッシュ（TTL付き）
│   └── _core/
│       ├── index.ts                 ← Expressサーバーエントリ
│       ├── trpc.ts                  ← tRPCセットアップ
│       └── llm.ts                   ← LLM（使用停止・コスト削減済み）
│
├── constants/
│   └── theme.ts                 ← ランタイムカラーパレット再エクスポート
│
├── theme.config.js              ← カラートークン定義（Tailwind + ランタイム共有）
├── tailwind.config.js           ← Tailwind設定
├── app.config.ts                ← Expo設定（バンドルID・アプリ名）
├── todo.md                      ← タスク管理（チェックボックス形式）
├── CONTEXT.md                   ← 本ファイル（アーキテクチャ参照）
├── LATEST.md                    ← 最新状態スナップショット
├── SESSION.md                   ← AI作業プロトコル
└── PLAN.md                      ← 開発ロードマップ（人間が編集）
```

---

## 3. データフロー

```
[クライアント]
  useCategoryData(category)
    └─ tRPC: data.getByCategory(category)
         └─ [サーバー: trpc-data-router.ts]
              ├─ NEWS   → fetchJapaneseNewsData()
              │            └─ japanese-news-client.ts
              │                 └─ NHK/朝日/livedoor/Yahoo RSS
              │                      → キーワードマッチ感情分析（コスト0）
              ├─ SOCIAL → fetchVideosData()
              │            └─ video-client.ts
              │                 └─ YouTube Data API v3
              │                      (videos.list?chart=mostPopular&regionCode=JP)
              └─ MARKET → fetchMarketData()
                           └─ market-client-v2.ts
                                └─ Yahoo Finance等（無料API）
```

---

## 4. テーマシステム

テーマは `lib/theme-system.ts` で定義された3種類があります。

| テーマ名 | 説明 | 背景色 |
|----------|------|--------|
| `normal` | モダンダーク | `#0F172A` |
| `cli` | ターミナル風グリーン | `#0A0A0A` |
| `8bit` | ファミコン風レッド | `#1A1A2E` |

`theme.config.js` の `themeColors` はデフォルト（8bit）カラートークンです。全コンポーネントは `useThemeContext()` から `themeConfig` を取得して色を参照します。**ハードコードされた色は使用禁止**。

---

## 5. 環境変数

| 変数名 | 用途 | 取得方法 |
|--------|------|----------|
| `YOUTUBE_API_KEY` | YouTube Data API v3（SOCIALタブ） | Google Cloud Console |

---

## 6. キャッシュ設定

| カテゴリ | キャッシュキー | TTL |
|----------|---------------|-----|
| NEWS | `japanese_news` | 5分 |
| SOCIAL | `social:rss` | 15分 |
| MARKET | `market:alphavantage` | 30分 |

---

## 7. コスト方針

**ランニングコスト完全ゼロ**が設計原則です。

- **LLM（AI要約）は使用禁止** — `server/_core/llm.ts` は存在するが呼び出し禁止
- ニュース感情分析はキーワードマッチのみ（`japanese-news-client.ts`）
- YouTube API は無料枠（1日10,000クォータ）内で運用、5分キャッシュで抑制
- 翻訳APIは不使用（日本語RSSをそのまま表示）

---

## 8. サブスクリプション

| プラン | アクセス可能カテゴリ |
|--------|---------------------|
| Free | NEWS のみ |
| Premium | NEWS + SOCIAL + MARKET |

`lib/plan-context.tsx` でプラン状態を管理。`FREE_CATEGORIES = ['NEWS']`（`lib/types.ts`）。

---

## 9. 重要な実装上の注意

`Pressable` に `className` を使用すると `onPress` が発火しない（NativeWind の既知の問題）。必ず `style` プロップを使用すること。

FlatList のスナップナビゲーションは `snapToInterval=ITEM_WIDTH` + `snapToAlignment="start"` で統一。`pagingEnabled` との併用は禁止（競合する）。`scrollToOffset(index * ITEM_WIDTH)` でナビゲーションすること。

全画面コンポーネントは `ScreenContainer` を使用すること（SafeArea + 背景色の一貫性）。
