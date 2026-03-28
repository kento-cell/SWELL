import axios from 'axios';

export interface MutualFund {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: string; // 'balanced' | 'growth' | 'fixed-income' | 'international'
  aum?: number; // Assets under management
}

/**
 * 投資信託データ取得クライアント
 * Yahoo Finance API を使用して日本の投資信託データを取得
 */

const MUTUAL_FUND_SYMBOLS = [
  '0318010C.T', // eMAXIS Slim 全世界株式
  '0321010C.T', // eMAXIS Slim 先進国株式
  '0320010C.T', // eMAXIS Slim 新興国株式
  '0311010C.T', // eMAXIS Slim バランス
  '0331010C.T', // ニッセイ日経225インデックスファンド
  '0332010C.T', // ニッセイ外国株式インデックスファンド
  '0333010C.T', // ニッセイ新興国株式インデックスファンド
  '0341010C.T', // 三井住友・DCつみたてNISA・全海外株式
  '0342010C.T', // 三井住友・DCつみたてNISA・全世界株式
  '0343010C.T', // 三井住友・DCつみたてNISA・日本株
];

const FUND_CATEGORIES: Record<string, string> = {
  '0318010C.T': 'growth',
  '0321010C.T': 'growth',
  '0320010C.T': 'growth',
  '0311010C.T': 'balanced',
  '0331010C.T': 'growth',
  '0332010C.T': 'international',
  '0333010C.T': 'international',
  '0341010C.T': 'international',
  '0342010C.T': 'growth',
  '0343010C.T': 'balanced',
};

export async function getMutualFunds(): Promise<MutualFund[]> {
  try {
    const funds: MutualFund[] = [];

    for (const symbol of MUTUAL_FUND_SYMBOLS.slice(0, 10)) {
      try {
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`,
          {
            params: {
              modules: 'price,summaryDetail',
            },
            timeout: 5000,
          }
        );

        const priceData = response.data?.quoteSummary?.result?.[0]?.price;
        const summaryData = response.data?.quoteSummary?.result?.[0]?.summaryDetail;

        if (priceData) {
          funds.push({
            symbol,
            name: priceData.longName || symbol,
            price: priceData.regularMarketPrice?.raw || 0,
            change: priceData.regularMarketChange?.raw || 0,
            changePercent: priceData.regularMarketChangePercent?.raw || 0,
            category: FUND_CATEGORIES[symbol] || 'balanced',
            aum: summaryData?.marketCap?.raw,
          });
        }
      } catch (err) {
        console.log(`[MutualFunds] ${symbol} 取得失敗:`, err);
        continue;
      }
    }

    return funds;
  } catch (error) {
    console.error('[MutualFunds] エラー:', error);
    return [];
  }
}

/**
 * Wave sentiment・Wave level を計算
 */
export function calculateWaveMetrics(funds: MutualFund[]) {
  return funds.map((fund) => {
    const absChange = Math.abs(fund.changePercent);
    const waveLevel =
      absChange > 3 ? 'high' : absChange > 1 ? 'medium' : 'low';

    const waveSentiment =
      fund.changePercent > 1 ? 'hot' : fund.changePercent < -1 ? 'cold' : 'neutral';

    return {
      ...fund,
      waveLevel,
      waveSentiment,
    };
  });
}
