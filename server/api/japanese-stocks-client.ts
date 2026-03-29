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
 */

const JAPANESE_STOCK_SYMBOLS = [
  { symbol: '^N225', name: '日経225' },
  { symbol: '1301.T', name: 'TOPIX' },
  { symbol: '1570.T', name: '日本株高配当' },
  { symbol: '1577.T', name: 'NEXT FUNDS 日経平均' },
  { symbol: '2802.T', name: '味の素' },
  { symbol: '6758.T', name: 'ソニー' },
  { symbol: '9984.T', name: 'ソフトバンクグループ' },
  { symbol: '7203.T', name: 'トヨタ自動車' },
];

export async function getJapaneseStocks(): Promise<JapaneseStock[]> {
  try {
    const stocks: JapaneseStock[] = [];

    // Yahoo Finance API の chart エンドポイントを使用
    for (const stockInfo of JAPANESE_STOCK_SYMBOLS) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${stockInfo.symbol}`,
          {
            params: {
              modules: 'price,summaryDetail',
            },
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          }
        );

        const quoteSummary = response.data?.quoteSummary?.result?.[0];
        if (!quoteSummary) {
          continue;
        }

        const priceData = quoteSummary.price;
        const summaryDetail = quoteSummary.summaryDetail;

        if (!priceData || !priceData.regularMarketPrice) {
          continue;
        }

        const regularMarketPrice = priceData.regularMarketPrice.raw || 0;
        const previousClose = priceData.previousClose?.raw || regularMarketPrice;
        const change = regularMarketPrice - previousClose;
        const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

        stocks.push({
          symbol: stockInfo.symbol,
          name: stockInfo.name,
          price: regularMarketPrice,
          change,
          changePercent,
          volume: summaryDetail?.volume?.raw,
          marketCap: summaryDetail?.marketCap?.raw,
          pe: summaryDetail?.trailingPE?.raw,
        });
      } catch (err) {
        console.error(`Failed to fetch ${stockInfo.symbol}:`, err);
        // Continue to next stock on error
      }
    }

    return stocks;
  } catch (err) {
    console.error('Failed to fetch Japanese stocks:', err);
    return [];
  }
}
