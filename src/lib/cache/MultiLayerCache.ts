/**
 * Multi-Layer Caching System
 * L1: Memory (LRU) - μs latency
 * L2: Redis - ms latency
 * L3: Database - 10-100ms latency
 */

import { LRUCache } from "lru-cache";
import Redis from "ioredis";
import { prisma } from "@/lib/prisma";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  layer?: "memory" | "redis" | "all";
  refreshOnHit?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  memoryHits: number;
  redisHits: number;
  dbHits: number;
  evictions: number;
}

export class MultiLayerCache {
  private static instance: MultiLayerCache;

  // L1: Memory Cache (LRU)
  private memoryCache: LRUCache<string, any>;

  // L2: Redis Cache
  private redis: Redis | null = null;

  // 통계
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    memoryHits: 0,
    redisHits: 0,
    dbHits: 0,
    evictions: 0,
  };

  private constructor() {
    // LRU 캐시 설정 (최대 500개 항목, 100MB)
    this.memoryCache = new LRUCache<string, any>({
      max: 500, // 최대 항목 수
      maxSize: 100 * 1024 * 1024, // 100MB
      sizeCalculation: (value) => {
        // 대략적인 크기 계산
        return JSON.stringify(value).length;
      },
      ttl: 1000 * 60 * 5, // 기본 5분 TTL
      updateAgeOnGet: true, // 접근 시 TTL 갱신
      updateAgeOnHas: false,

      // 항목 제거 시 콜백
      dispose: (value, key) => {
        this.stats.evictions++;
        console.log(`[Cache] Evicted from memory: ${key}`);
      },
    });

    // Redis 연결
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.redis.on("error", (err) => {
        console.error("[Cache] Redis error:", err);
      });

      this.redis.on("connect", () => {
        console.log("[Cache] Redis connected");
      });
    }
  }

  public static getInstance(): MultiLayerCache {
    if (!MultiLayerCache.instance) {
      MultiLayerCache.instance = new MultiLayerCache();
    }
    return MultiLayerCache.instance;
  }

  // 캐시에서 가져오기
  async get<T = any>(
    key: string,
    fetcher?: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T | null> {
    const { ttl = 300, layer = "all", refreshOnHit = false } = options;

    // L1: Memory Cache 확인
    const memoryValue = this.memoryCache.get(key);
    if (memoryValue !== undefined) {
      this.stats.hits++;
      this.stats.memoryHits++;

      console.log(`[Cache] L1 Hit: ${key}`);

      // 필요시 백그라운드에서 갱신
      if (refreshOnHit && fetcher) {
        this.refreshInBackground(key, fetcher, ttl);
      }

      return memoryValue;
    }

    // L2: Redis Cache 확인
    if (this.redis && layer !== "memory") {
      try {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          this.stats.hits++;
          this.stats.redisHits++;

          console.log(`[Cache] L2 Hit: ${key}`);

          const parsed = JSON.parse(redisValue);

          // L1에도 저장 (Write-through)
          this.memoryCache.set(key, parsed, { ttl: ttl * 1000 });

          return parsed;
        }
      } catch (error) {
        console.error(`[Cache] Redis get error for ${key}:`, error);
      }
    }

    // Cache Miss - Fetcher 실행
    if (fetcher) {
      this.stats.misses++;
      console.log(`[Cache] Miss: ${key}, fetching...`);

      try {
        const value = await fetcher();
        this.stats.dbHits++;

        // 모든 레이어에 저장
        await this.set(key, value, { ttl, layer });

        return value;
      } catch (error) {
        console.error(`[Cache] Fetcher error for ${key}:`, error);
        throw error;
      }
    }

    return null;
  }

  // 캐시에 저장
  async set<T = any>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    const { ttl = 300, layer = "all" } = options;

    // L1: Memory Cache
    if (layer === "memory" || layer === "all") {
      this.memoryCache.set(key, value, { ttl: ttl * 1000 });
    }

    // L2: Redis Cache
    if (this.redis && (layer === "redis" || layer === "all")) {
      try {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.error(`[Cache] Redis set error for ${key}:`, error);
      }
    }

    console.log(`[Cache] Set: ${key} (TTL: ${ttl}s, Layer: ${layer})`);
  }

  // 캐시 무효화
  async invalidate(pattern: string): Promise<void> {
    console.log(`[Cache] Invalidating pattern: ${pattern}`);

    // L1: Memory Cache 무효화
    let memoryCount = 0;
    for (const key of this.memoryCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.memoryCache.delete(key);
        memoryCount++;
      }
    }

    // L2: Redis Cache 무효화
    if (this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          console.log(`[Cache] Invalidated ${keys.length} Redis keys`);
        }
      } catch (error) {
        console.error(`[Cache] Redis invalidate error:`, error);
      }
    }

    console.log(`[Cache] Invalidated ${memoryCount} memory keys`);
  }

  // 특정 키 삭제
  async delete(key: string): Promise<void> {
    // L1: Memory Cache
    this.memoryCache.delete(key);

    // L2: Redis Cache
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.error(`[Cache] Redis delete error for ${key}:`, error);
      }
    }

    console.log(`[Cache] Deleted: ${key}`);
  }

  // 캐시 초기화
  async clear(): Promise<void> {
    // L1: Memory Cache
    this.memoryCache.clear();

    // L2: Redis Cache
    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.error("[Cache] Redis clear error:", error);
      }
    }

    console.log("[Cache] Cleared all caches");
  }

  // 통계 조회
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  // 통계 초기화
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      redisHits: 0,
      dbHits: 0,
      evictions: 0,
    };
  }

  // 캐시 정보
  getInfo() {
    return {
      memory: {
        size: this.memoryCache.size,
        maxSize: this.memoryCache.max,
        calculatedSize: this.memoryCache.calculatedSize,
      },
      redis: this.redis ? "connected" : "not connected",
      stats: this.getStats(),
    };
  }

  // === Private Methods ===

  // 백그라운드 갱신
  private async refreshInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number,
  ): Promise<void> {
    // 비동기로 실행 (await 하지 않음)
    fetcher()
      .then((value) => {
        this.set(key, value, { ttl });
        console.log(`[Cache] Background refresh completed: ${key}`);
      })
      .catch((error) => {
        console.error(`[Cache] Background refresh error for ${key}:`, error);
      });
  }

  // 패턴 매칭
  private matchPattern(key: string, pattern: string): boolean {
    // 간단한 와일드카드 매칭
    const regexPattern = pattern.replace(/\*/g, ".*").replace(/\?/g, ".");

    return new RegExp(`^${regexPattern}$`).test(key);
  }

  // Warming (캐시 예열)
  async warm(
    keys: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>,
  ): Promise<void> {
    console.log(`[Cache] Warming ${keys.length} keys...`);

    const promises = keys.map(({ key, fetcher, ttl = 300 }) =>
      this.get(key, fetcher, { ttl }),
    );

    await Promise.allSettled(promises);

    console.log("[Cache] Warming completed");
  }

  // 캐시 키 생성 헬퍼
  static createKey(namespace: string, ...parts: any[]): string {
    const sanitized = parts.map((p) =>
      typeof p === "object" ? JSON.stringify(p) : String(p),
    );
    return `${namespace}:${sanitized.join(":")}`;
  }
}

// 싱글톤 인스턴스 export
export const cache = MultiLayerCache.getInstance();

// 캐시 데코레이터
export function Cacheable(options: CacheOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = MultiLayerCache.createKey(
        `${target.constructor.name}:${propertyKey}`,
        ...args,
      );

      return cache.get(
        cacheKey,
        () => originalMethod.apply(this, args),
        options,
      );
    };

    return descriptor;
  };
}

// 캐시 무효화 데코레이터
export function InvalidateCache(pattern: string | ((args: any[]) => string)) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      const invalidatePattern =
        typeof pattern === "function" ? pattern(args) : pattern;

      await cache.invalidate(invalidatePattern);

      return result;
    };

    return descriptor;
  };
}
