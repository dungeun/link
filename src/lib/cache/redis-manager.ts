/**
 * Redis Cache Manager - 세계 1% 수준의 캐싱 전략
 * Multi-layer caching, Circuit Breaker, Cache Warming 구현
 */

import Redis from "ioredis";
import { logger } from "@/lib/utils/logger";
import { EventEmitter } from "events";

// 캐시 전략 타입
export enum CacheStrategy {
  CACHE_ASIDE = "cache-aside",
  WRITE_THROUGH = "write-through",
  WRITE_BEHIND = "write-behind",
  REFRESH_AHEAD = "refresh-ahead",
}

// 캐시 통계
interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  evictions: number;
  hitRate: number;
}

// 캐시 옵션
interface CacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  compress?: boolean;
  tags?: string[];
  refreshAhead?: number; // TTL의 몇 %가 남았을 때 미리 갱신
}

// Circuit Breaker 상태
enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half-open",
}

/**
 * Circuit Breaker 패턴 구현
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private successCount: number = 0;

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000, // 60초
    private readonly halfOpenRequests: number = 3,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        logger.warn("Circuit breaker is OPEN, rejecting request");
        return null;
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenRequests) {
        this.state = CircuitState.CLOSED;
        logger.info("Circuit breaker recovered to CLOSED state");
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      logger.error(
        `Circuit breaker opened after ${this.failureCount} failures`,
      );
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== undefined &&
      Date.now() - this.lastFailureTime.getTime() >= this.timeout
    );
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Redis Cache Manager
 */
export class RedisCacheManager extends EventEmitter {
  private static instance: RedisCacheManager;
  private redis: Redis;
  private localCache: Map<string, { value: any; expiry: number }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    evictions: 0,
    hitRate: 0,
  };
  private circuitBreaker: CircuitBreaker;
  private warmupQueue: Set<string> = new Set();

  private constructor() {
    super();

    // Redis 클라이언트 초기화
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Circuit Breaker 초기화
    this.circuitBreaker = new CircuitBreaker();

    // Redis 이벤트 핸들러
    this.redis.on("connect", () => {
      logger.info("Redis connected successfully");
      this.emit("connected");
    });

    this.redis.on("error", (error) => {
      logger.error({ error }, "Redis connection error");
      this.stats.errors++;
      this.emit("error", error);
    });

    this.redis.on("close", () => {
      logger.warn("Redis connection closed");
      this.emit("disconnected");
    });

    // 로컬 캐시 정리 (1분마다)
    setInterval(() => this.cleanupLocalCache(), 60000);

    // 통계 리포팅 (5분마다)
    setInterval(() => this.reportStats(), 300000);

    // Cache Warming 프로세서 (30초마다)
    setInterval(() => this.processWarmupQueue(), 30000);
  }

  static getInstance(): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager();
    }
    return RedisCacheManager.instance;
  }

  /**
   * 캐시 조회 (Multi-layer)
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      // L1 캐시 (로컬 메모리) 확인
      const localData = this.getFromLocalCache(key);
      if (localData !== null) {
        this.stats.hits++;
        this.updateHitRate();
        logger.debug({ key }, "L1 cache hit");
        return localData;
      }

      // L2 캐시 (Redis) 확인
      const result = await this.circuitBreaker.execute(async () => {
        const data = await this.redis.get(key);

        if (data) {
          const parsed = this.deserialize<T>(data);

          // L1 캐시에 저장
          this.setLocalCache(key, parsed, 60000); // 1분 TTL

          // Refresh-Ahead 전략 확인
          if (options?.strategy === CacheStrategy.REFRESH_AHEAD) {
            const ttl = await this.redis.ttl(key);
            const refreshThreshold = options.refreshAhead || 0.2; // 기본 20%

            if (ttl > 0 && ttl < (options.ttl || 300) * refreshThreshold) {
              this.warmupQueue.add(key);
              logger.debug({ key, ttl }, "Scheduled for refresh-ahead");
            }
          }

          this.stats.hits++;
          this.updateHitRate();
          logger.debug({ key }, "L2 cache hit");
          return parsed;
        }

        return null;
      });

      if (result === null) {
        this.stats.misses++;
        this.updateHitRate();
      }

      return result;
    } catch (error) {
      logger.error({ error, key }, "Cache get error");
      this.stats.errors++;
      return null;
    }
  }

  /**
   * 캐시 저장
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<boolean> {
    try {
      const {
        ttl = 300,
        strategy = CacheStrategy.CACHE_ASIDE,
        tags = [],
      } = options;
      const serialized = this.serialize(value);

      // Write-Through 전략
      if (strategy === CacheStrategy.WRITE_THROUGH) {
        // 먼저 데이터 저장소에 쓰기 (구현 필요)
        // await this.writeToDataStore(key, value);
      }

      const result = await this.circuitBreaker.execute(async () => {
        // Redis에 저장
        await this.redis.setex(key, ttl, serialized);

        // 태그 처리
        if (tags.length > 0) {
          await this.addTags(key, tags);
        }

        // L1 캐시에도 저장
        this.setLocalCache(key, value, Math.min(ttl * 1000, 60000));

        return true;
      });

      // Write-Behind 전략
      if (strategy === CacheStrategy.WRITE_BEHIND) {
        // 비동기로 데이터 저장소에 쓰기 (구현 필요)
        // this.scheduleWriteBehind(key, value);
      }

      logger.debug({ key, ttl, strategy }, "Cache set");
      return result !== null;
    } catch (error) {
      logger.error({ error, key }, "Cache set error");
      this.stats.errors++;
      return false;
    }
  }

  /**
   * 캐시 삭제
   */
  async delete(pattern: string): Promise<number> {
    try {
      // 패턴 매칭으로 키 찾기
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      // Redis에서 삭제
      const deleted = await this.redis.del(...keys);

      // L1 캐시에서도 삭제
      keys.forEach((key) => this.localCache.delete(key));

      logger.info({ pattern, deleted }, "Cache deleted");
      return deleted;
    } catch (error) {
      logger.error({ error, pattern }, "Cache delete error");
      return 0;
    }
  }

  /**
   * 태그 기반 캐시 무효화
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keys = new Set<string>();

      // 각 태그와 연관된 키 찾기
      for (const tag of tags) {
        const taggedKeys = await this.redis.smembers(`tag:${tag}`);
        taggedKeys.forEach((key) => keys.add(key));
      }

      // 찾은 키들 삭제
      if (keys.size > 0) {
        await this.redis.del(...Array.from(keys));
        keys.forEach((key) => this.localCache.delete(key));

        // 태그 정리
        for (const tag of tags) {
          await this.redis.del(`tag:${tag}`);
        }
      }

      logger.info(
        { tags, invalidated: keys.size },
        "Cache invalidated by tags",
      );
    } catch (error) {
      logger.error({ error, tags }, "Tag invalidation error");
    }
  }

  /**
   * Cache Warming
   */
  async warmup(
    key: string,
    loader: () => Promise<any>,
    options?: CacheOptions,
  ): Promise<void> {
    try {
      const data = await loader();
      if (data) {
        await this.set(key, data, options);
        logger.info({ key }, "Cache warmed up");
      }
    } catch (error) {
      logger.error({ error, key }, "Cache warmup error");
    }
  }

  /**
   * Batch 조회
   */
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    try {
      // Redis에서 batch 조회
      const values = await this.redis.mget(...keys);

      keys.forEach((key, index) => {
        const value = values[index];
        if (value) {
          const parsed = this.deserialize<T>(value);
          result.set(key, parsed);
          this.setLocalCache(key, parsed, 60000);
          this.stats.hits++;
        } else {
          result.set(key, null);
          this.stats.misses++;
        }
      });

      this.updateHitRate();
    } catch (error) {
      logger.error({ error, keys }, "Batch get error");
      keys.forEach((key) => result.set(key, null));
    }

    return result;
  }

  /**
   * Batch 저장
   */
  async mset<T>(
    entries: Map<string, T>,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl || 300;

      entries.forEach((value, key) => {
        const serialized = this.serialize(value);
        pipeline.setex(key, ttl, serialized);
        this.setLocalCache(key, value, Math.min(ttl * 1000, 60000));
      });

      await pipeline.exec();

      logger.debug({ count: entries.size }, "Batch cache set");
      return true;
    } catch (error) {
      logger.error({ error }, "Batch set error");
      return false;
    }
  }

  /**
   * 로컬 캐시 조회
   */
  private getFromLocalCache(key: string): any | null {
    const cached = this.localCache.get(key);

    if (cached) {
      if (cached.expiry > Date.now()) {
        return cached.value;
      }
      this.localCache.delete(key);
    }

    return null;
  }

  /**
   * 로컬 캐시 저장
   */
  private setLocalCache(key: string, value: any, ttlMs: number): void {
    // 메모리 제한 (1000개 항목)
    if (this.localCache.size >= 1000) {
      const firstKey = this.localCache.keys().next().value;
      if (firstKey !== undefined) {
        this.localCache.delete(firstKey);
      }
      this.stats.evictions++;
    }

    this.localCache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  /**
   * 로컬 캐시 정리
   */
  private cleanupLocalCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.localCache.entries()) {
      if (cached.expiry <= now) {
        this.localCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, "Local cache cleaned up");
    }
  }

  /**
   * 태그 추가
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, 86400); // 24시간
    }

    await pipeline.exec();
  }

  /**
   * Cache Warming Queue 처리
   */
  private async processWarmupQueue(): Promise<void> {
    if (this.warmupQueue.size === 0) return;

    const keys = Array.from(this.warmupQueue);
    this.warmupQueue.clear();

    logger.info({ count: keys.length }, "Processing cache warmup queue");

    // 실제 구현에서는 각 키에 대한 데이터 로더를 호출
    // for (const key of keys) {
    //   await this.warmup(key, () => loadDataForKey(key));
    // }
  }

  /**
   * 통계 리포팅
   */
  private reportStats(): void {
    const total = this.stats.hits + this.stats.misses;

    logger.info(
      {
        stats: {
          ...this.stats,
          total,
          localCacheSize: this.localCache.size,
          circuitBreakerState: this.circuitBreaker.getState(),
        },
      },
      "Cache statistics",
    );
  }

  /**
   * Hit Rate 업데이트
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * 직렬화
   */
  private serialize(value: any): string {
    return JSON.stringify(value);
  }

  /**
   * 역직렬화
   */
  private deserialize<T>(value: string): T {
    return JSON.parse(value);
  }

  /**
   * 연결 확인
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  /**
   * 통계 조회
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 캐시 전체 삭제 (위험!)
   */
  async flush(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Cannot flush cache in production");
    }

    await this.redis.flushdb();
    this.localCache.clear();
    logger.warn("Cache flushed");
  }

  /**
   * 연결 종료
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
    this.localCache.clear();
    logger.info("Redis disconnected");
  }
}

// Singleton export
export const cacheManager = RedisCacheManager.getInstance();
