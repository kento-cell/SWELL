# SWELL — Claude Code プロジェクト設定

## セッション開始手順
1. `CONTEXT.md` → アーキテクチャ・ディレクトリ構造・制約
2. `LATEST.md` → 現在の実装状態
3. `PLAN.md` → ロードマップ・次タスク
4. `todo.md` → 細かいタスク状態

## 技術スタック
- Expo SDK 54 + React Native 0.81 + Expo Router 6
- NativeWind 4（Tailwind CSS）/ TypeScript 5.9
- バックエンド: Express + tRPC（ポート3000）
- フロント開発サーバー: Metro（ポート8081）
- ORM: Drizzle（MySQL2）
- キャッシュ: ioredis / インメモリ
- テスト: Vitest
- パッケージマネージャー: **pnpm**（npm禁止）

## コマンド
- `pnpm dev` — サーバー+Metro同時起動
- `pnpm dev:server` — バックエンドのみ
- `pnpm dev:metro` — Metroのみ
- `pnpm test` — Vitest実行
- `pnpm check` — TypeScript型チェック（tsc --noEmit）
- `pnpm lint` — ESLint
- `pnpm db:push` — Drizzle マイグレーション

## 絶対ルール
- **LLM API呼び出し禁止**（コスト0設計。server/_core/llm.ts は存在するが使用禁止）
- **色のハードコード禁止** → 必ず `useThemeContext()` 経由
- **Pressable に className 禁止** → onPress が発火しないNativeWindバグ。`style` プロップを使用
- **FlatList で pagingEnabled 禁止** → snapToInterval と競合。`snapToInterval=ITEM_WIDTH` + `snapToAlignment="start"` を使用
- **全画面で ScreenContainer 使用** → SafeArea + 背景色の一貫性
- **ランニングコスト完全ゼロ** → 有料API・クラウドサービス禁止。YouTube API は無料枠内運用

## サブスクリプション
- Free: NEWS のみ
- Premium: NEWS + SOCIAL + MARKET
- `lib/plan-context.tsx` で管理

## テーマ
- normal（モダンダーク）/ cli（ターミナル風）/ 8bit（ファミコン風・デフォルト）
- `theme.config.js` にカラートークン定義
- コンポーネントは `useThemeContext()` → `themeConfig` で色参照

## 現在のフェーズ
Phase 2 — UX改善が次の優先タスク。PLAN.md 参照。
