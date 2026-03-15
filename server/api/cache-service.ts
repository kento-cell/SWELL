/**
 * Simple in-memory cache service with TTL support
 * In production, replace with Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private rateLimiters: Map<string, number[]> = new Map();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache value with TTL (in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Check if request is within rate limit
   * Returns true if allowed, false if rate limited
   */
  checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const timestamps = this.rateLimiters.get(key) || [];

    // Remove old timestamps outside the window
    const recentTimestamps = timestamps.filter((ts) => now - ts < windowSeconds * 1000);

    if (recentTimestamps.length >= maxRequests) {
      return false; // Rate limited
    }

    recentTimestamps.push(now);
    this.rateLimiters.set(key, recentTimestamps);

    return true; // Allowed
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.rateLimiters.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      rateLimiters: this.rateLimiters.size,
    };
  }
}

export const cacheService = new CacheService();

/**
 * Cache configuration for each data source
 */
export const CACHE_CONFIG = {
  NEWS: {
    key: 'news:hackernews',
    ttl: 600, // 10 minutes
    rateLimit: { maxRequests: 1, windowSeconds: 1 }, // 1 req/sec
  },
  SOCIAL: {
    key: 'social:rss',
    ttl: 900, // 15 minutes
    rateLimit: { maxRequests: 2, windowSeconds: 60 }, // 2 req/min
  },
  MARKET: {
    key: 'market:alphavantage',
    ttl: 1800, // 30 minutes
    rateLimit: { maxRequests: 5, windowSeconds: 60 }, // 5 req/min
  },
};
