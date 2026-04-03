/**
 * MARKET銘柄アイコンマップ
 * アプリ本体・ウィジェット両方で使用
 */

export interface MarketIcon {
  emoji: string;
  bg: string;
}

export const SYMBOL_ICONS: Record<string, MarketIcon> = {
  // 指標
  '日経平均': { emoji: '🇯🇵', bg: '#DC2626' },
  'S&P 500': { emoji: '📊', bg: '#2563EB' },
  'ドル/円': { emoji: '💱', bg: '#7C3AED' },
  // 暗号通貨
  'ビットコイン': { emoji: '₿', bg: '#F7931A' },
  'イーサリアム': { emoji: 'Ξ', bg: '#627EEA' },
  'ソラナ': { emoji: '◎', bg: '#9945FF' },
  'リップル': { emoji: '✕', bg: '#0085C0' },
  'ドージ': { emoji: '🐕', bg: '#C2A633' },
  'カルダノ': { emoji: '◆', bg: '#0033AD' },
  'アバランチ': { emoji: '🔺', bg: '#E84142' },
  'チェーンリンク': { emoji: '⬡', bg: '#2A5ADA' },
  'ポルカドット': { emoji: '●', bg: '#E6007A' },
  'ポリゴン': { emoji: '⬟', bg: '#8247E5' },
  // コモディティ
  '金（ゴールド）': { emoji: '🥇', bg: '#D97706' },
  '銀（シルバー）': { emoji: '🥈', bg: '#6B7280' },
  'プラチナ': { emoji: '🥉', bg: '#78716C' },
  // 為替
  'ユーロ/円': { emoji: '€', bg: '#2563EB' },
  'ポンド/円': { emoji: '£', bg: '#1D4ED8' },
  '豪ドル/円': { emoji: 'A$', bg: '#059669' },
  '人民元/円': { emoji: '¥', bg: '#DC2626' },
  'ウォン/円': { emoji: '₩', bg: '#4338CA' },
  'ユーロ/ドル': { emoji: '€$', bg: '#7C3AED' },
  // 投資信託
  'オルカン(全世界)': { emoji: '🌍', bg: '#059669' },
  'S&P500': { emoji: '🇺🇸', bg: '#2563EB' },
  '全米株式': { emoji: '🦅', bg: '#1D4ED8' },
  'NASDAQ100': { emoji: '💻', bg: '#7C3AED' },
  '新興国株式': { emoji: '🌏', bg: '#D97706' },
  '高配当': { emoji: '💰', bg: '#059669' },
  // 米国株
  'Apple': { emoji: '', bg: '#A1A1AA' },
  'Google': { emoji: 'G', bg: '#4285F4' },
  'Microsoft': { emoji: '⊞', bg: '#00A4EF' },
  'Tesla': { emoji: 'T', bg: '#CC0000' },
  'NVIDIA': { emoji: '▲', bg: '#76B900' },
  'Meta': { emoji: '∞', bg: '#0081FB' },
};

export function getMarketIcon(symbol: string): MarketIcon {
  return SYMBOL_ICONS[symbol] || { emoji: symbol.charAt(0), bg: '#6366F1' };
}
