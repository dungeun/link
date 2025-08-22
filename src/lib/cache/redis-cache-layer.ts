/**
 * Redis 캐싱 레이어 - 10만 동접 대응
 * 모든 DB 쿼리를 Redis로 캐싱
 */

import { Redis } from "ioredis";
import { logger } from "@/lib/logger";

// Redis 클라이언트 초기화
const redis = new Redis(process.env.REDIS_URL || "", {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  lazyConnect: false,
});

// 캐시 TTL 설정 (초 단위)
const TTL = {
  LANGUAGE_PACKS: 86400, // 24시간 - 거의 변경 없음
  CAMPAIGNS: 60, // 1분 - 실시간성 필요
  UI_SECTIONS: 3600, // 1시간
  CATEGORIES: 1800, // 30분
  USER_PROFILE: 300, // 5분
  STATIC_CONTENT: 86400, // 24시간
  DEFAULT: 300, // 기본 5분
} as const;

export class RedisCacheLayer {
  private static instance: RedisCacheLayer;
  private hitCount = 0;
  private missCount = 0;

  static getInstance(): RedisCacheLayer {
    if (!this.instance) {
      this.instance = new RedisCacheLayer();
    }
    return this.instance;
  }

  /**
   * 캐시 조회 또는 설정
   * Cache-Aside 패턴 구현
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = TTL.DEFAULT,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      // 1. 캐시 조회
      const cached = await redis.get(key);

      if (cached) {
        this.hitCount++;
        const hitRate =
          (this.hitCount / (this.hitCount + this.missCount)) * 100;

        // 성능 로깅 (1000번마다)
        if ((this.hitCount + this.missCount) % 1000 === 0) {
          logger.info(
            `Cache stats - Hit rate: ${hitRate.toFixed(2)}%, Hits: ${this.hitCount}, Misses: ${this.missCount}`,
          );
        }

        return JSON.parse(cached);
      }

      // 2. 캐시 미스 - DB 조회
      this.missCount++;
      const fresh = await factory();

      // 3. 캐시 저장 (비동기로 처리하여 응답 지연 방지)
      redis.setex(key, ttl, JSON.stringify(fresh)).catch((err) => {
        logger.error(`Failed to cache ${key}: ${err}`);
      });

      const duration = Date.now() - startTime;
      if (duration > 100) {
        logger.warn(`Slow cache operation for ${key}: ${duration}ms`);
      }

      return fresh;
    } catch (error) {
      logger.error(`Cache error for ${key}: ${error}`);
      // 캐시 실패 시 DB 직접 조회
      return factory();
    }
  }

  /**
   * 다중 키 조회 (파이프라인)
   */
  async getMany<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const pipeline = redis.pipeline();
      keys.forEach((key) => pipeline.get(key));

      const results = await pipeline.exec();

      return (
        results?.map(([err, value]) => {
          if (err || !value) return null;
          try {
            return JSON.parse(value as string);
          } catch {
            return null;
          }
        }) || []
      );
    } catch (error) {
      logger.error(`Multi-get cache error: ${error}`);
      return keys.map(() => null);
    }
  }

  /**
   * 캐시 무효화
   */
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(
          `Invalidated ${keys.length} cache keys matching ${pattern}`,
        );
      }
    } catch (error) {
      logger.error(`Cache invalidation error for ${pattern}: ${error}`);
    }
  }

  /**
   * 패턴별 캐시 무효화
   */
  async invalidateByType(
    type: "campaigns" | "users" | "categories" | "all",
  ): Promise<void> {
    const patterns = {
      campaigns: "cache:campaigns:*",
      users: "cache:users:*",
      categories: "cache:categories:*",
      all: "cache:*",
    };

    await this.invalidate(patterns[type]);
  }

  /**
   * 캐시 워밍업 (서버 시작 시)
   */
  async warmup(): Promise<void> {
    logger.info("Starting cache warmup...");

    try {
      // 자주 사용되는 데이터 미리 로드
      const warmupTasks = [
        this.warmupCampaigns(),
        this.warmupCategories(),
        this.warmupUISections(),
      ];

      await Promise.all(warmupTasks);
      logger.info("Cache warmup completed");
    } catch (error) {
      logger.error(`Cache warmup failed: ${error}`);
    }
  }

  private async warmupCampaigns(): Promise<void> {
    // 구현은 실제 쿼리 로직 참조
    logger.info("Warming up campaigns cache...");
  }

  private async warmupCategories(): Promise<void> {
    logger.info("Warming up categories cache...");
  }

  private async warmupUISections(): Promise<void> {
    logger.info("Warming up UI sections cache...");
  }

  /**
   * 캐시 상태 조회
   */
  async getStats(): Promise<{
    hitRate: number;
    hits: number;
    misses: number;
    memory: string;
    keys: number;
  }> {
    const info = await redis.info("memory");
    const dbSize = await redis.dbsize();

    return {
      hitRate: (this.hitCount / (this.hitCount + this.missCount)) * 100,
      hits: this.hitCount,
      misses: this.missCount,
      memory: info.match(/used_memory_human:(.+)/)?.[1] || "unknown",
      keys: dbSize,
    };
  }

  /**
   * 연결 상태 확인
   */
  async healthCheck(): Promise<boolean> {
    try {
      const pong = await redis.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 export
export const cacheLayer = RedisCacheLayer.getInstance();

// 캐시 키 생성 헬퍼
export const CacheKeys = {
  campaign: (id: string) => `cache:campaigns:${id}`,
  campaigns: (page: number = 1) => `cache:campaigns:list:${page}`,
  user: (id: string) => `cache:users:${id}`,
  profile: (userId: string) => `cache:profiles:${userId}`,
  category: (id: string) => `cache:categories:${id}`,
  categories: () => `cache:categories:all`,
  uiSection: (type: string) => `cache:ui:${type}`,
  stats: (type: string) => `cache:stats:${type}`,
  languagePack: (lang: string) => `cache:lang:${lang}`,
};
