// Redis Configuration
export const redisConfig = {
  enabled: process.env.REDIS_ENABLED !== 'false',
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl: parseInt(process.env.REDIS_TTL || '86400'), // 24 hours default
  connectionOptions: {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    enableReadyCheck: true,
    enableOfflineQueue: false,
  }
};

// Environment check
export const isRedisEnabled = () => redisConfig.enabled;
export const getRedisUrl = () => redisConfig.url;
export const getRedisTTL = () => redisConfig.ttl;
