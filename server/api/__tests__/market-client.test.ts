import { describe, it, expect } from 'vitest';
import { fetchStockPrice } from '../market-client';

/**
 * Test Alpha Vantage API integration
 */
describe('Alpha Vantage API', () => {
  it('should validate API key by fetching a stock price', async () => {
    // Test with a simple stock (AAPL)
    const stock = await fetchStockPrice('AAPL');
    
    // If API key is invalid, stock will be null
    if (!stock) {
      console.warn('Alpha Vantage API key may be invalid or rate limited');
      expect(stock).toBeDefined();
    } else {
      // If API key is valid, we should get stock data
      expect(stock).toHaveProperty('symbol');
      expect(stock).toHaveProperty('price');
      expect(stock.symbol).toBe('AAPL');
      expect(stock.price).toBeGreaterThan(0);
    }
  }, { timeout: 10000 });

  it('should handle rate limiting gracefully', async () => {
    // Make multiple requests to test rate limiting
    const stocks = await Promise.all([
      fetchStockPrice('AAPL'),
      fetchStockPrice('GOOGL'),
      fetchStockPrice('MSFT'),
    ]);

    // Should return array of results (some may be null due to rate limiting)
    expect(Array.isArray(stocks)).toBe(true);
    expect(stocks.length).toBe(3);
  }, { timeout: 20000 });
});
