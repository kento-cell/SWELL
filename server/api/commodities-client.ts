import axios from 'axios';

export interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  category: string;
}

/**
 * コモディティデータ取得クライアント
 * Yahoo Finance API を使用して金・銀・プラチナ・原油・天然ガスデータを取得
 * フォールバック：モックデータを使用
 */

const MOCK_COMMODITIES: Commodity[] = [
  { symbol: 'GC=F', name: '金（Gold）', price: 2385, change: 15, changePercent: 0.63, unit: 'oz', category: 'precious-metal' },
  { symbol: 'SI=F', name: '銀（Silver）', price: 31.25, change: 0.5, changePercent: 1.63, unit: 'oz', category: 'precious-metal' },
  { symbol: 'PL=F', name: 'プラチナ（Platinum）', price: 1045, change: 10, changePercent: 0.97, unit: 'oz', category: 'precious-metal' },
  { symbol: 'CL=F', name: '原油（WTI）', price: 82.50, change: 1.2, changePercent: 1.48, unit: 'barrel', category: 'energy' },
  { symbol: 'NG=F', name: '天然ガス', price: 2.85, change: 0.05, changePercent: 1.79, unit: 'MMBtu', category: 'energy' },
];

export async function getCommodities(): Promise<Commodity[]> {
  try {
    const commodities: Commodity[] = [];

    for (const mockCommodity of MOCK_COMMODITIES) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v7/finance/chart/${mockCommodity.symbol}`,
          {
            params: {
              interval: '1d',
              range: '1d',
            },
            timeout: 3000,
          }
        );

        const result = response.data?.chart?.result?.[0];
        if (!result) {
          commodities.push(mockCommodity);
          continue;
        }

        const meta = result.meta;
        const regularMarketPrice = meta.regularMarketPrice || mockCommodity.price;
        const previousClose = meta.previousClose || regularMarketPrice;
        const change = regularMarketPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        commodities.push({
          symbol: mockCommodity.symbol,
          name: mockCommodity.name,
          price: regularMarketPrice,
          change,
          changePercent,
          unit: mockCommodity.unit,
          category: mockCommodity.category,
        });
      } catch (error) {
        // Use mock data on error
        commodities.push(mockCommodity);
      }
    }

    return commodities.length > 0 ? commodities : MOCK_COMMODITIES;
  } catch (error) {
    console.log('[Commodities] API 取得失敗、モックデータを使用:', error);
    return MOCK_COMMODITIES;
  }
}
