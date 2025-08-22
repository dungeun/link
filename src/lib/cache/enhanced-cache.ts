import { Redis } from "ioredis";
import { logger } from "@/lib/logger";

// Redis 클라이언트 초기화
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

// 캐시 TTL 설정 (초 단위)
const CACHE_TTL = {
  SHORT: 60, // 1분
  MEDIUM: 300, // 5분
  LONG: 3600, // 1시간
  DAY: 86400, // 1일
} as const;

// 캐시 키 프리픽스
const CACHE_PREFIX = {
  CAMPAIGN: "campaign:",
  USER: "user:",
  UI_CONFIG: "ui_config:",
  LANGUAGE: "language:",
  STATS: "stats:",
} as const;

/**
 * 향상된 캐시 서비스
 */
export class EnhancedCacheService {
  private static instance: EnhancedCacheService;

  private constructor() {}

  static getInstance(): EnhancedCacheService {
    if (!EnhancedCacheService.instance) {
      EnhancedCacheService.instance = new EnhancedCacheService();
    }
    return EnhancedCacheService.instance;
  }

  /**
   * 캐시에서 데이터 가져오기
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;

    try {
      const data = await redis.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      logger.error("Cache get error:", String(error));
      return null;
    }
  }

  /**
   * 캐시에 데이터 저장
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<void> {
    if (!redis) return;

    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch (error) {
      logger.error("Cache set error:", String(error));
    }
  }

  /**
   * 캐시 삭제
   */
  async delete(pattern: string): Promise<void> {
    if (!redis) return;

    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error("Cache delete error:", String(error));
    }
  }

  /**
   * 캐시 래퍼 함수 - 캐시가 있으면 반환, 없으면 실행 후 캐시
   */
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM,
  ): Promise<T> {
    // 캐시에서 먼저 확인
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // 캐시 미스 - 데이터 가져오기
    logger.debug(`Cache miss: ${key}`);
    const data = await fetcher();

    // 캐시에 저장
    await this.set(key, data, ttl);

    return data;
  }

  /**
   * 캠페인 목록 캐싱
   */
  async getCampaigns(params: any, fetcher: () => Promise<any>): Promise<any> {
    const key = `${CACHE_PREFIX.CAMPAIGN}list:${JSON.stringify(params)}`;
    return this.withCache(key, fetcher, CACHE_TTL.SHORT);
  }

  /**
   * UI 설정 캐싱
   */
  async getUIConfig(lang: string, fetcher: () => Promise<any>): Promise<any> {
    const key = `${CACHE_PREFIX.UI_CONFIG}${lang}`;
    return this.withCache(key, fetcher, CACHE_TTL.LONG);
  }

  /**
   * 통계 데이터 캐싱
   */
  async getStats(type: string, fetcher: () => Promise<any>): Promise<any> {
    const key = `${CACHE_PREFIX.STATS}${type}`;
    return this.withCache(key, fetcher, CACHE_TTL.MEDIUM);
  }

  /**
   * 캐시 무효화
   */
  async invalidate(prefix: string): Promise<void> {
    await this.delete(`${prefix}*`);
  }

  /**
   * 전체 캐시 초기화
   */
  async flush(): Promise<void> {
    if (!redis) return;

    try {
      await redis.flushdb();
      logger.info("Cache flushed");
    } catch (error) {
      logger.error("Cache flush error:", String(error));
    }
  }
}

// 싱글톤 인스턴스 export
export const cache = EnhancedCacheService.getInstance();

// TTL 상수 export
export { CACHE_TTL, CACHE_PREFIX };
