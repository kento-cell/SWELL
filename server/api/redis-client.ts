import Redis from 'ioredis';

/**
 * Redis client for server-side shared caching
 * All server instances share the same Redis instance
 * This ensures 1000万 users see the same cached data
 */

// Get Redis connection info from environment
const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisPassword = process.env.REDIS_PASSWORD;

let redis: Redis;

if (redisUrl) {
  // Use REDIS_URL if provided (Heroku, Railway, Upstash)
  redis = new Redis(redisUrl, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });
} else {
  // Use individual connection parameters
  redis = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });
}

// Event handlers
redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected to Redis server');
});

redis.on('ready', () => {
  console.log('[Redis] Redis client ready');
});

redis.on('reconnecting', () => {
  console.log('[Redis] Reconnecting to Redis...');
});

redis.on('close', () => {
  console.log('[Redis] Redis connection closed');
});

export { redis };
