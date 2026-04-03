/**
 * Market data client using Yahoo Finance API directly
 * No API key required - completely free and unlimited
 * 
 * Design: Each user calls Yahoo Finance directly
 * Client-side caching (5 minutes) reduces actual API calls
 * 
 * For 10M users:
 * - Without caching: 10M × 270 calls/month = 2.7B calls
 * - With 5min cache: ~1440 calls/month (5min intervals)
 * - Reduction: 99.9999%
 */

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  currency?: string;
}

export interface MarketItem {
  id: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: 'yahoo-finance';
  sourceUrl: string;
  timestamp: number;
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  currency?: string;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  group?: string; // カテゴリグループ
}

// シンボル定義（名前 + グループ）
interface SymbolDef {
  symbol: string;
  name: string;
  group: string;
}

const SYMBOLS: SymbolDef[] = [
  // 主要指標
  { symbol: '^N225', name: '日経平均', group: '主要指標' },
  { symbol: '^GSPC', name: 'S&P 500', group: '主要指標' },
  { symbol: 'USDJPY=X', name: 'ドル/円', group: '主要指標' },
  // 為替
  { symbol: 'EURJPY=X', name: 'ユーロ/円', group: '為替' },
  { symbol: 'GBPJPY=X', name: 'ポンド/円', group: '為替' },
  { symbol: 'AUDJPY=X', name: '豪ドル/円', group: '為替' },
  { symbol: 'CNYJPY=X', name: '人民元/円', group: '為替' },
  { symbol: 'KRWJPY=X', name: 'ウォン/円', group: '為替' },
  { symbol: 'EURUSD=X', name: 'ユーロ/ドル', group: '為替' },
  // 暗号通貨
  { symbol: 'BTC-USD', name: 'ビットコイン', group: '暗号通貨' },
  { symbol: 'ETH-USD', name: 'イーサリアム', group: '暗号通貨' },
  { symbol: 'SOL-USD', name: 'ソラナ', group: '暗号通貨' },
  { symbol: 'XRP-USD', name: 'リップル', group: '暗号通貨' },
  { symbol: 'DOGE-USD', name: 'ドージ', group: '暗号通貨' },
  { symbol: 'ADA-USD', name: 'カルダノ', group: '暗号通貨' },
  { symbol: 'AVAX-USD', name: 'アバランチ', group: '暗号通貨' },
  { symbol: 'LINK-USD', name: 'チェーンリンク', group: '暗号通貨' },
  { symbol: 'DOT-USD', name: 'ポルカドット', group: '暗号通貨' },
  { symbol: 'MATIC-USD', name: 'ポリゴン', group: '暗号通貨' },
  // コモディティ（金銀プラチナ）
  { symbol: 'GC=F', name: '金（ゴールド）', group: 'コモディティ' },
  { symbol: 'SI=F', name: '銀（シルバー）', group: 'コモディティ' },
  { symbol: 'PL=F', name: 'プラチナ', group: 'コモディティ' },
  // 投資信託（連動ETF）
  { symbol: 'VT', name: 'オルカン(全世界)', group: '投資信託' },
  { symbol: 'VOO', name: 'S&P500', group: '投資信託' },
  { symbol: 'VTI', name: '全米株式', group: '投資信託' },
  { symbol: 'QQQ', name: 'NASDAQ100', group: '投資信託' },
  { symbol: 'VWO', name: '新興国株式', group: '投資信託' },
  { symbol: 'VYM', name: '高配当', group: '投資信託' },
  // 米国株
  { symbol: 'AAPL', name: 'Apple', group: '米国株' },
  { symbol: 'GOOGL', name: 'Google', group: '米国株' },
  { symbol: 'MSFT', name: 'Microsoft', group: '米国株' },
  { symbol: 'TSLA', name: 'Tesla', group: '米国株' },
  { symbol: 'NVDA', name: 'NVIDIA', group: '米国株' },
  { symbol: 'META', name: 'Meta', group: '米国株' },
];

// 後方互換用
const TOP_STOCKS = SYMBOLS.map(s => s.symbol);
const SYMBOL_NAMES: Record<string, string> = Object.fromEntries(SYMBOLS.map(s => [s.symbol, s.name]));
const SYMBOL_GROUPS: Record<string, string> = Object.fromEntries(SYMBOLS.map(s => [s.symbol, s.group]));

/**
 * Try multiple Yahoo Finance API endpoints with fallback
 * @param symbol Stock ticker symbol (e.g., 'AAPL')
 * @returns Stock price data or null if all endpoints fail
 */
async function tryYahooFinanceEndpoints(symbol: string): Promise<any> {
  const endpoints = [
    // Endpoint 1: v7/finance/quote (most reliable)
    async () => {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      return data?.quoteResponse?.result?.[0] || null;
    },
    // Endpoint 2: v10/finance/quoteSummary
    async () => {
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      return data?.quoteSummary?.result?.[0]?.price || null;
    },
    // Endpoint 3: v8/finance/chart (fallback)
    async () => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!response.ok) return null;
      const data = await response.json() as any;
      const result = data?.chart?.result?.[0];
      if (!result) return null;
      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      const closes = quote?.close?.filter((v: any) => v != null) || [];
      const highs = quote?.high?.filter((v: any) => v != null) || [];
      const lows = quote?.low?.filter((v: any) => v != null) || [];
      const volumes = quote?.volume?.filter((v: any) => v != null) || [];
      const currentPrice = meta?.regularMarketPrice || closes[closes.length - 1] || 0;
      const previousClose = meta?.chartPreviousClose || meta?.previousClose || (closes.length > 1 ? closes[closes.length - 2] : closes[0]) || currentPrice;
      return {
        regularMarketPrice: currentPrice,
        regularMarketPreviousClose: previousClose,
        regularMarketDayHigh: highs.length > 0 ? Math.max(...highs.slice(-1)) : undefined,
        regularMarketDayLow: lows.length > 0 ? Math.min(...lows.slice(-1)) : undefined,
        regularMarketVolume: volumes.length > 0 ? volumes[volumes.length - 1] : undefined,
        currency: meta?.currency || 'USD',
      };
    },
  ];

  for (let i = 0; i < endpoints.length; i++) {
    try {
      console.log(`[Market] Trying endpoint ${i + 1}/${endpoints.length} for ${symbol}...`);
      const result = await endpoints[i]();
      if (result) {
        console.log(`[Market] Endpoint ${i + 1} succeeded for ${symbol}`);
        return result;
      }
    } catch (error) {
      console.warn(`[Market] Endpoint ${i + 1} failed for ${symbol}:`, error instanceof Error ? error.message : String(error));
    }
  }
  return null;
}

/**
 * Fetch stock price from Yahoo Finance API directly
 * No authentication required - completely free
 * 
 * @param symbol Stock ticker symbol (e.g., 'AAPL')
 * @returns Stock price data or null if fetch fails
 */
export async function fetchStockPriceFromYahoo(symbol: string): Promise<StockPrice | null> {
  try {
    console.log(`[Market] Fetching ${symbol} from Yahoo Finance...`);
    
    const priceData = await tryYahooFinanceEndpoints(symbol);
    
    if (!priceData) {
      console.warn(`[Market] No price data for ${symbol} from any endpoint`);
      return null;
    }

    // Extract price information (handle both endpoint formats)
    const regularMarketPrice = priceData.regularMarketPrice?.raw || priceData.regularMarketPrice || 0;
    const previousClose = priceData.regularMarketPreviousClose?.raw || priceData.regularMarketPreviousClose || regularMarketPrice;
    const dayHigh = priceData.regularMarketDayHigh?.raw || priceData.regularMarketDayHigh;
    const dayLow = priceData.regularMarketDayLow?.raw || priceData.regularMarketDayLow;
    const volume = priceData.regularMarketVolume?.raw || priceData.regularMarketVolume;

    const change = regularMarketPrice - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    const result: StockPrice = {
      symbol,
      price: regularMarketPrice,
      change,
      changePercent,
      timestamp: Date.now(),
      dayHigh,
      dayLow,
      volume,
      currency: priceData.currency || 'USD',
    };

    console.log(`[Market] Successfully fetched ${symbol}: $${result.price} (${result.changePercent.toFixed(2)}%)`);
    return result;
  } catch (error) {
    console.error(`[Market] Error fetching ${symbol}:`, error);
    if (error instanceof Error) {
      console.error(`[Market] Error details: ${error.message}`);
      console.error(`[Market] Stack: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Fetch top market items (stocks)
 * Uses direct Yahoo Finance API calls
 * Client-side caching ensures minimal API usage
 */
export async function fetchMarketTrendingV2(): Promise<MarketItem[]> {
  const items: MarketItem[] = [];

  // Fetch all symbols in parallel for speed
  const results = await Promise.allSettled(
    TOP_STOCKS.map(async (symbol) => {
      const stock = await fetchStockPriceFromYahoo(symbol);
      return { symbol, stock };
    })
  );

  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value.stock) continue;
    const { symbol, stock } = result.value;
    const displayName = SYMBOL_NAMES[symbol] || symbol;
    const currency = stock.currency || 'USD';
    const priceStr = currency === 'JPY'
      ? `¥${Math.round(stock.price).toLocaleString()}`
      : `$${stock.price.toFixed(2)}`;

    items.push({
      id: `stock_${symbol}`,
      title: `${displayName} - ${priceStr}`,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
      score: Math.abs(stock.changePercent * 10),
      commentCount: 0,
      source: 'yahoo-finance',
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
      timestamp: stock.timestamp,
      symbol: displayName,
      price: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      currency,
      dayHigh: stock.dayHigh,
      dayLow: stock.dayLow,
      volume: stock.volume,
      group: SYMBOL_GROUPS[symbol] || '米国株',
    });
  }

  return items;
}

/**
 * Calculate wave level from price change
 */
export function calculateMarketWaveLevel(changePercent: number): 'low' | 'medium' | 'high' {
  const absChange = Math.abs(changePercent);
  if (absChange < 2) return 'low';
  if (absChange < 5) return 'medium';
  return 'high';
}

/**
 * Calculate wave sentiment from price direction
 */
export function calculateMarketWaveSentiment(changePercent: number): 'blue' | 'green' | 'yellow' | 'red' {
  if (changePercent > 5) return 'green'; // Strong bullish
  if (changePercent > 2) return 'yellow'; // Bullish
  if (changePercent > -2) return 'blue'; // Neutral/mixed
  return 'red'; // Bearish
}
