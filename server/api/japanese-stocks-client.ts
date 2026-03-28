import axios from 'axios';

export interface JapaneseStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
}

/**
 * 日本株データ取得クライアント
 * Yahoo Finance API を使用して日経225・個別銘柄データを取得
 * フォールバック：モックデータを使用
 */

const MOCK_JAPANESE_STOCKS: JapaneseStock[] = [
  { symbol: '998407.J', name: '日経225', price: 32500, change: 150, changePercent: 0.46, volume: 1000000 },
  { symbol: '1301.T', name: 'TOPIX', price: 2280, change: 5, changePercent: 0.22, volume: 500000 },
  { symbol: '1570.T', name: '日本株高配当', price: 18500, change: 100, changePercent: 0.54, volume: 300000 },
  { symbol: '1577.T', name: 'NEXT FUNDS 日経平均', price: 32400, change: 140, changePercent: 0.43, volume: 200000 },
  { symbol: '2802.T', name: '味の素', price: 1850, change: 20, changePercent: 1.09, volume: 1500000 },
];

export async function getJapaneseStocks(): Promise<JapaneseStock[]> {
  try {
    const stocks: JapaneseStock[] = [];

    // Yahoo Finance API の chart エンドポイントを使用（より安定）
    for (const mockStock of MOCK_JAPANESE_STOCKS) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v7/finance/chart/${mockStock.symbol}`,
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
          stocks.push(mockStock);
          continue;
        }

        const meta = result.meta;
        const regularMarketPrice = meta.regularMarketPrice || mockStock.price;
        const previousClose = meta.previousClose || regularMarketPrice;
        const change = regularMarketPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        stocks.push({
          symbol: mockStock.symbol,
          name: mockStock.name,
          price: regularMarketPrice,
          change,
          changePercent,
          volume: meta.regularMarketVolume || mockStock.volume,
          marketCap: meta.marketCap,
          pe: meta.trailingPE,
        });
      } catch (err) {
        // Use mock data on error
        stocks.push(mockStock);
      }
    }

    return stocks.length > 0 ? stocks : MOCK_JAPANESE_STOCKS;
  } catch (err) {
    console.error('Failed to fetch Japanese stocks, using mock data:', err);
    return MOCK_JAPANESE_STOCKS;
  }
}
