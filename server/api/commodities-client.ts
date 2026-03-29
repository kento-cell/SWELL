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
 */

const COMMODITY_SYMBOLS = [
  { symbol: 'GC=F', name: '金（Gold）', unit: 'oz', category: 'precious-metal' },
  { symbol: 'SI=F', name: '銀（Silver）', unit: 'oz', category: 'precious-metal' },
  { symbol: 'PL=F', name: 'プラチナ（Platinum）', unit: 'oz', category: 'precious-metal' },
  { symbol: 'CL=F', name: '原油（WTI）', unit: 'barrel', category: 'energy' },
  { symbol: 'NG=F', name: '天然ガス', unit: 'MMBtu', category: 'energy' },
];

export async function getCommodities(): Promise<Commodity[]> {
  try {
    const commodities: Commodity[] = [];

    for (const commodityInfo of COMMODITY_SYMBOLS) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v7/finance/chart/${commodityInfo.symbol}`,
          {
            params: {
              interval: '1d',
              range: '1d',
            },
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        const result = response.data?.chart?.result?.[0];
        if (!result) {
          continue;
        }

        const meta = result.meta;
        const regularMarketPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;

        if (!regularMarketPrice || !previousClose) {
          continue;
        }

        const change = regularMarketPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        commodities.push({
          symbol: commodityInfo.symbol,
          name: commodityInfo.name,
          price: regularMarketPrice,
          change,
          changePercent,
          unit: commodityInfo.unit,
          category: commodityInfo.category,
        });
      } catch (err) {
        console.error(`Failed to fetch ${commodityInfo.symbol}:`, err);
        // Continue to next commodity on error
      }
    }

    return commodities;
  } catch (error) {
    console.error('[Commodities] Failed to fetch commodities:', error);
    return [];
  }
}
