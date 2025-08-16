/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    REDIS_ENABLED: process.env.REDIS_ENABLED || 'true',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    REDIS_TTL: process.env.REDIS_TTL || '86400',
  },
};

module.exports = nextConfig;
