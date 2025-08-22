import { redis } from "@/lib/cache/redis-client";
import { logger } from "@/lib/logger/structured-logger";

export class AdminCache {
  private static readonly CACHE_PREFIX = "admin:";
  private static readonly TTL = {
    DASHBOARD: 300, // 5분
    STATS: 300, // 5분
    USERS: 60, // 1분
    CAMPAIGNS: 60, // 1분
    PAYMENTS: 120, // 2분
    ANALYTICS: 600, // 10분
  };

  /**
   * 대시보드 통계 캐싱
   */
  static async getDashboardStats(
    key: string = "dashboard:stats",
  ): Promise<any | null> {
    try {
      if (!redis) return null;

      const cached = await redis.get(`${this.CACHE_PREFIX}${key}`);
      if (cached) {
        logger.info(`Cache hit: ${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error}`);
      return null;
    }
  }

  static async setDashboardStats(
    data: any,
    key: string = "dashboard:stats",
  ): Promise<void> {
    try {
      if (!redis) return;

      await redis.setex(
        `${this.CACHE_PREFIX}${key}`,
        this.TTL.DASHBOARD,
        JSON.stringify(data),
      );
      logger.info(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Cache set error: ${error}`);
    }
  }

  /**
   * 캠페인 목록 캐싱
   */
  static async getCampaignList(params: string): Promise<any | null> {
    try {
      if (!redis) return null;

      const key = `${this.CACHE_PREFIX}campaigns:${params}`;
      const cached = await redis.get(key);

      if (cached) {
        logger.info(`Cache hit: campaigns with params ${params}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error}`);
      return null;
    }
  }

  static async setCampaignList(data: any, params: string): Promise<void> {
    try {
      if (!redis) return;

      const key = `${this.CACHE_PREFIX}campaigns:${params}`;
      await redis.setex(key, this.TTL.CAMPAIGNS, JSON.stringify(data));
      logger.info(`Cache set: campaigns with params ${params}`);
    } catch (error) {
      logger.error(`Cache set error: ${error}`);
    }
  }

  /**
   * 사용자 목록 캐싱
   */
  static async getUserList(params: string): Promise<any | null> {
    try {
      if (!redis) return null;

      const key = `${this.CACHE_PREFIX}users:${params}`;
      const cached = await redis.get(key);

      if (cached) {
        logger.info(`Cache hit: users with params ${params}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error}`);
      return null;
    }
  }

  static async setUserList(data: any, params: string): Promise<void> {
    try {
      if (!redis) return;

      const key = `${this.CACHE_PREFIX}users:${params}`;
      await redis.setex(key, this.TTL.USERS, JSON.stringify(data));
      logger.info(`Cache set: users with params ${params}`);
    } catch (error) {
      logger.error(`Cache set error: ${error}`);
    }
  }

  /**
   * 분석 데이터 캐싱
   */
  static async getAnalytics(key: string): Promise<any | null> {
    try {
      if (!redis) return null;

      const cached = await redis.get(`${this.CACHE_PREFIX}analytics:${key}`);
      if (cached) {
        logger.info(`Cache hit: analytics:${key}`);
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      logger.error(`Cache get error: ${error}`);
      return null;
    }
  }

  static async setAnalytics(data: any, key: string): Promise<void> {
    try {
      if (!redis) return;

      await redis.setex(
        `${this.CACHE_PREFIX}analytics:${key}`,
        this.TTL.ANALYTICS,
        JSON.stringify(data),
      );
      logger.info(`Cache set: analytics:${key}`);
    } catch (error) {
      logger.error(`Cache set error: ${error}`);
    }
  }

  /**
   * 캐시 무효화
   */
  static async invalidateDashboard(): Promise<void> {
    try {
      if (!redis) return;

      const pattern = `${this.CACHE_PREFIX}dashboard:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} dashboard cache entries`);
      }
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  static async invalidateCampaigns(): Promise<void> {
    try {
      if (!redis) return;

      const pattern = `${this.CACHE_PREFIX}campaigns:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} campaign cache entries`);
      }
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  static async invalidateUsers(): Promise<void> {
    try {
      if (!redis) return;

      const pattern = `${this.CACHE_PREFIX}users:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated ${keys.length} user cache entries`);
      }
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }

  /**
   * 전체 어드민 캐시 초기화
   */
  static async invalidateAll(): Promise<void> {
    try {
      if (!redis) return;

      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Invalidated all ${keys.length} admin cache entries`);
      }
    } catch (error) {
      logger.error(`Cache invalidation error: ${error}`);
    }
  }
}

export default AdminCache;
