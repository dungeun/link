import Redis from 'ioredis';

/**
 * Cache configuration and utilities
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

export class CacheManager {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();

  constructor() {
    // Initialize Redis if connection is available
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    } else if (process.env.REDIS_HOST) {
      this.redis = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value as string);
        }
      }

      // Fallback to memory cache
      const cached = this.memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value;
      }

      // Clean up expired entry
      if (cached) {
        this.memoryCache.delete(key);
      }

      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = 3600, tags = [] } = options; // Default 1 hour TTL

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.set(key, JSON.stringify(value), {
          ex: ttl
        });

        // Store tags for invalidation
        if (tags.length > 0) {
          for (const tag of tags) {
            await this.redis.sadd(`tag:${tag}`, key);
            await this.redis.expire(`tag:${tag}`, ttl);
          }
        }
      }

      // Store in memory cache as fallback
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + ttl * 1000
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (!this.redis) return;

    try {
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
        }
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Cache-aside pattern helper
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate value
    const value = await factory();

    // Store in cache
    await this.set(key, value, options);

    return value;
  }

  /**
   * Clean up expired memory cache entries
   */
  cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache key generators
export const cacheKeys = {
  campaign: (id: string) => `campaign:${id}`,
  campaignList: (params: any) => `campaigns:${JSON.stringify(params)}`,
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `profile:${id}`,
  revenue: (date: string) => `revenue:${date}`,
  stats: (type: string, date: string) => `stats:${type}:${date}`,
  config: (key: string) => `config:${key}`
};

// Cache tags
export const cacheTags = {
  campaigns: 'campaigns',
  users: 'users',
  revenue: 'revenue',
  stats: 'stats',
  config: 'config'
};

// Cleanup interval
if (typeof window === 'undefined') {
  setInterval(() => {
    cache.cleanupMemoryCache();
  }, 60000); // Clean up every minute
}