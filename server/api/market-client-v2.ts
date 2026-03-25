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

// Mock stock data for testing
const MOCK_STOCK_DATA: Record<string, StockPrice> = {
  AAPL: { symbol: 'AAPL', price: 251.49, change: -2.46, changePercent: -0.97, timestamp: Date.now() },
  GOOGL: { symbol: 'GOOGL', price: 302.06, change: -0.55, changePercent: -0.18, timestamp: Date.now() },
  MSFT: { symbol: 'MSFT', price: 383.00, change: -3.21, changePercent: -0.83, timestamp: Date.now() },
  TSLA: { symbol: 'TSLA', price: 380.85, change: -3.58, changePercent: -0.93, timestamp: Date.now() },
  AMZN: { symbol: 'AMZN', price: 210.14, change: -3.84, changePercent: -1.80, timestamp: Date.now() },
  NVDA: { symbol: 'NVDA', price: 175.64, change: 2.01, changePercent: 1.16, timestamp: Date.now() },
  META: { symbol: 'META', price: 604.06, change: 2.20, changePercent: 0.37, timestamp: Date.now() },
  NFLX: { symbol: 'NFLX', price: 93.38, change: 1.30, changePercent: 1.41, timestamp: Date.now() },
};

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
        includeAdjustedClose: 'true',
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
 * Fetch top market items (stocks) - using mock data to avoid API rate limits
 */
export async function fetchMarketTrendingV2(): Promise<MarketItem[]> {
  const items: MarketItem[] = [];

  // Use mock data instead of API to avoid rate limiting
  for (const symbol of TOP_STOCKS) {
    const stock = MOCK_STOCK_DATA[symbol];
    if (stock) {
      items.push({
        id: `stock_${symbol}`,
        title: `${symbol} - $${stock.price.toFixed(2)}`,
        url: `https://finance.yahoo.com/quote/${symbol}`,
        score: Math.abs(stock.changePercent * 10),
        commentCount: 0,
        source: 'yahoo-finance',
        sourceUrl: `https://finance.yahoo.com/quote/${symbol}`,
        timestamp: stock.timestamp,
        symbol,
        price: stock.price,
        change: stock.changePercent,
      });
    }
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
