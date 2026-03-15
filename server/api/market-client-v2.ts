import { callDataApi } from '../_core/dataApi';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
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
}

// Top stocks to monitor
const TOP_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];

/**
 * Fetch stock price from YahooFinance API (no auth key required)
 */
export async function fetchStockPriceFromYahoo(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await callDataApi('YahooFinance/get_stock_chart', {
      query: {
        symbol,
        region: 'US',
        interval: '1d',
        range: '1d',
        includeAdjustedClose: true,
      },
    }) as any;

    if (!response || !response.chart || !response.chart.result || response.chart.result.length === 0) {
      console.warn(`No data for ${symbol}`);
      return null;
    }

    const result = response?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;

    // Get the latest price data
    const timestamps = result?.timestamp || [];
    const quotes = result?.indicators?.quote?.[0] || {};

    if (timestamps.length === 0) {
      return null;
    }

    const latestIndex = timestamps.length - 1;
    const latestPrice = (quotes?.close?.[latestIndex] as number) || (meta?.regularMarketPrice as number) || 0;
    const previousPrice = (quotes?.close?.[latestIndex - 1] as number) || latestPrice;
    const change = latestPrice - previousPrice;
    const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

    return {
      symbol: meta?.symbol || symbol,
      price: latestPrice,
      change,
      changePercent,
      timestamp: Date.now(),
      dayHigh: meta?.regularMarketDayHigh,
      dayLow: meta?.regularMarketDayLow,
      volume: meta?.regularMarketVolume,
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch top market items (stocks)
 */
export async function fetchMarketTrendingV2(): Promise<MarketItem[]> {
  const items: MarketItem[] = [];

  // Fetch stock prices in parallel (with some rate limiting)
  const stockPromises = TOP_STOCKS.map((symbol, index) => {
    // Stagger requests slightly to avoid rate limiting
    return new Promise<MarketItem | null>((resolve) => {
      setTimeout(async () => {
        const stock = await fetchStockPriceFromYahoo(symbol);
        if (stock) {
          resolve({
            id: `stock_${symbol}`,
            title: `${symbol} - $${stock.price.toFixed(2)}`,
            url: `https://finance.yahoo.com/quote/${symbol}`,
            score: Math.abs(stock.changePercent * 10), // Use change % as "score"
            commentCount: 0,
            source: 'yahoo-finance',
            sourceUrl: `https://finance.yahoo.com/quote/${symbol}`,
            timestamp: stock.timestamp,
            symbol,
            price: stock.price,
            change: stock.changePercent,
          });
        } else {
          resolve(null);
        }
      }, index * 200); // 200ms between requests
    });
  });

  const results = await Promise.all(stockPromises);
  return results.filter((item): item is MarketItem => item !== null);
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
