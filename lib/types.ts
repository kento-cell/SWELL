// ============================================================
// Swell — Core Data Models
// ============================================================

export type Category = 'NEWS' | 'SOCIAL' | 'MARKET';

export type WaveLevel = 'low' | 'medium' | 'high';

export type WaveSentiment = 'blue' | 'green' | 'yellow' | 'red';

export interface Topic {
  id: string;
  category: Category;
  title: string;
  summary: string;       // 1〜2行の短い要約
  detail: string;        // 詳細画面用の長い説明
  waveLevel: WaveLevel;
  waveSentiment: WaveSentiment;
  source: string;        // ソース名
  sourceUrl?: string;    // 元記事URL（モックでは空）
  publishedAt: string;   // ISO 8601
  tags: string[];
  // 動画コンテンツ（SOCIAL カテゴリ用）
  videoId?: string;       // YouTube video ID または TikTok aweme_id
  videoType?: 'youtube' | 'tiktok';
  thumbnail?: string;    // サムネイル画像URL
  views?: string;        // 再生数
  duration?: string;     // 動画長さ
  // マーケットデータ（MARKET カテゴリ用）
  marketPrice?: number;
  marketChange?: number;
  marketChangePercent?: number;
  marketCurrency?: string;
  marketSymbol?: string;
  marketDayHigh?: number;
  marketDayLow?: number;
  marketVolume?: number;
  marketGroup?: string;
}

export type PlanType = 'free' | 'premium';

export interface UserPlan {
  type: PlanType;
}

// 波の高さラベル
export const WAVE_LEVEL_LABEL: Record<WaveLevel, string> = {
  low: '小波',
  medium: '通常波',
  high: '高波',
};

// 波の色ラベル
export const WAVE_SENTIMENT_LABEL: Record<WaveSentiment, string> = {
  blue: '中立',
  green: '好意的',
  yellow: '賛否割れ',
  red: '反対・炎上',
};

// カテゴリラベル
export const CATEGORY_LABEL: Record<Category, string> = {
  NEWS: 'NEWS',
  SOCIAL: 'SOCIAL',
  MARKET: 'MARKET',
};

// Freeプランでアクセス可能なカテゴリ
export const FREE_CATEGORIES: Category[] = ['NEWS', 'MARKET'];
export const PREMIUM_CATEGORIES: Category[] = ['SOCIAL'];
