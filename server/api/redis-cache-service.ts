import { redis } from './redis-client';

/**
 * Redis-backed cache service
 * All server instances share the same cache
 * Ensures 1000万 users see the same data without hitting API rate limits
 */
export class RedisCacheService {
  private namespace: string;

  constructor(namespace: string = 'swell') {
    this.namespace = namespace;
  }

  /**
   * Get cached value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      const value = await redis.get(fullKey);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Cache] Get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cache value with TTL (Time To Live)
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      await redis.setex(fullKey, ttl, JSON.stringify(value));
      console.log(`[Cache] Set ${key} with TTL ${ttl}s`);
    } catch (error) {
      console.error(`[Cache] Set error for ${key}:`, error);
    }
  }

  /**
   * Delete cache key
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = `${this.namespace}:${key}`;
      await redis.del(fullKey);
      console.log(`[Cache] Deleted ${key}`);
    } catch (error) {
      console.error(`[Cache] Delete error for ${key}:`, error);
    }
  }

  /**
   * Clear all cache with namespace
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${this.namespace}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache] Cleared ${keys.length} keys`);
      }
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hitRate?: number;
  }> {
    try {
      const pattern = `${this.namespace}:*`;
      const keys = await redis.keys(pattern);
      
      // Get Redis server info
      const info = await redis.info('memory');
      const memoryUsage = info.match(/used_memory_human:(.+)/)?.[1] || 'unknown';
      
      return {
        keys: keys.length,
        memory: memoryUsage,
      };
    } catch (error) {
      console.error('[Cache] Stats error:', error);
      return { keys: 0, memory: 'unknown' };
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return redis.status === 'ready';
  }

  /**
   * Get Redis connection status
   */
  getStatus(): string {
    return redis.status;
  }
}

// Export singleton instance
export const redisCacheService = new RedisCacheService('swell');
