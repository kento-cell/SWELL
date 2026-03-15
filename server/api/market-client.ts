import axios from 'axios';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface MarketItem {
  id: string;
  title: string;
  url: string;
  score: number;
  commentCount: number;
  source: 'alpha-vantage' | 'reddit';
  sourceUrl: string;
  timestamp: number;
  symbol?: string;
  price?: number;
  change?: number;
}

const ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Top stocks to monitor
const TOP_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
const TOP_CRYPTOS = ['BTC', 'ETH', 'SOL', 'XRP'];

/**
 * Fetch stock price from Alpha Vantage
 * Rate limit: 5 requests/minute, 500 requests/day
 */
export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    });

    const quote = response.data['Global Quote'];
    if (!quote || !quote.symbol) {
      return null;
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));

    return {
      symbol: quote.symbol,
      price,
      change,
      changePercent,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch cryptocurrency price
 */
export async function fetchCryptoPrice(
  fromCurrency: string,
  toCurrency: string = 'USD'
): Promise<StockPrice | null> {
  try {
    const response = await axios.get(ALPHA_VANTAGE_API, {
      params: {
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: fromCurrency,
        to_currency: toCurrency,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    });

    const rate = response.data['Realtime Currency Exchange Rate'];
    if (!rate) {
      return null;
    }

    const price = parseFloat(rate['5. Exchange Rate']);

    return {
      symbol: `${fromCurrency}/${toCurrency}`,
      price,
      change: 0, // Alpha Vantage doesn't provide change for crypto
      changePercent: 0,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(`Error fetching crypto price for ${fromCurrency}:`, error);
    return null;
  }
}

/**
 * Fetch top market items (stocks + crypto)
 */
export async function fetchMarketTrending(): Promise<MarketItem[]> {
  const items: MarketItem[] = [];

  // Fetch stock prices (with rate limiting)
  for (const symbol of TOP_STOCKS) {
    const stock = await fetchStockPrice(symbol);
    if (stock) {
      items.push({
        id: `stock_${symbol}`,
        title: `${symbol} - $${stock.price.toFixed(2)}`,
        url: `https://www.google.com/finance/quote/${symbol}:NASDAQ`,
        score: Math.abs(stock.change * 10), // Use change as "score"
        commentCount: 0, // Will be filled from Reddit
        source: 'alpha-vantage',
        sourceUrl: `https://www.alphavantage.co/`,
        timestamp: stock.timestamp,
        symbol,
        price: stock.price,
        change: stock.changePercent,
      });
    }

    // Rate limit: 5 requests/minute
    await new Promise((resolve) => setTimeout(resolve, 12000)); // 12 seconds between requests
  }

  // Fetch crypto prices
  for (const crypto of TOP_CRYPTOS) {
    const price = await fetchCryptoPrice(crypto);
    if (price) {
      items.push({
        id: `crypto_${crypto}`,
        title: `${crypto} - $${price.price.toFixed(2)}`,
        url: `https://www.coinmarketcap.com/currencies/${crypto.toLowerCase()}/`,
        score: Math.abs(price.change * 10),
        commentCount: 0,
        source: 'alpha-vantage',
        sourceUrl: `https://www.alphavantage.co/`,
        timestamp: price.timestamp,
        symbol: crypto,
        price: price.price,
        change: price.changePercent,
      });
    }

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 12000));
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
  if (changePercent > 5) return 'red'; // Strong bullish
  if (changePercent > 2) return 'yellow'; // Bullish
  if (changePercent > -2) return 'green'; // Neutral/mixed
  return 'blue'; // Bearish
}
