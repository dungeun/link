import { Redis } from "ioredis";
import { logger } from "@/lib/logger/structured-logger";

/**
 * 통일된 캐싱 시스템
 * 기존의 ResponseCache, CampaignCache, AdminCache, CategoryStatsCache를 통합
 */

interface CacheOptions {
  ttl?: number; // seconds
  prefix?: string;
  compress?: boolean;
}

interface CacheKey {
  namespace: string;
  identifier: string;
  version?: string;
}

class CacheNamespace {
  constructor(
    private namespace: string,
    private defaultTTL: number = 300, // 5분
    private redis?: Redis,
  ) {}

  private generateKey(identifier: string, version: string = "v1"): string {
    return `${this.namespace}:${version}:${identifier}`;
  }

  async get<T>(identifier: string, version?: string): Promise<T | null> {
    try {
      const key = this.generateKey(identifier, version);
      const cached = await this.redis?.get(key);

      if (!cached) return null;

      const parsed = JSON.parse(cached);
      logger.debug(`Cache hit: ${key}`);
      return parsed;
    } catch (error) {
      logger.error(
        `Cache get error for ${this.namespace}:${identifier}`,
        error instanceof Error ? error : undefined,
      );
      return null;
    }
  }

  async set<T>(
    identifier: string,
    data: T,
    options: { ttl?: number; version?: string } = {},
  ): Promise<void> {
    try {
      const { ttl = this.defaultTTL, version } = options;
      const key = this.generateKey(identifier, version);
      const serialized = JSON.stringify(data);

      await this.redis?.setex(key, ttl, serialized);
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error(
        `Cache set error for ${this.namespace}:${identifier}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async invalidate(identifier: string, version?: string): Promise<void> {
    try {
      const key = this.generateKey(identifier, version);
      await this.redis?.del(key);
      logger.debug(`Cache invalidated: ${key}`);
    } catch (error) {
      logger.error(
        `Cache invalidation error for ${this.namespace}:${identifier}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const fullPattern = `${this.namespace}:*:${pattern}`;
      const keys = await this.redis?.keys(fullPattern);

      if (keys && keys.length > 0) {
        await this.redis?.del(...keys);
        logger.debug(
          `Cache pattern invalidated: ${fullPattern} (${keys.length} keys)`,
        );
      }
    } catch (error) {
      logger.error(
        `Cache pattern invalidation error for ${this.namespace}:${pattern}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async flush(): Promise<void> {
    try {
      const pattern = `${this.namespace}:*`;
      const keys = await this.redis?.keys(pattern);

      if (keys && keys.length > 0) {
        await this.redis?.del(...keys);
        logger.info(
          `Cache namespace flushed: ${this.namespace} (${keys.length} keys)`,
        );
      }
    } catch (error) {
      logger.error(
        `Cache flush error for ${this.namespace}`,
        error instanceof Error ? error : undefined,
      );
    }
  }
}

/**
 * 통합 캐시 서비스
 */
export class UnifiedCache {
  private static redis: Redis | undefined;

  // 캐시 네임스페이스들
  static campaigns = new CacheNamespace("campaigns", 300, undefined); // 5분
  static users = new CacheNamespace("users", 600, undefined); // 10분
  static admin = new CacheNamespace("admin", 180, undefined); // 3분
  static stats = new CacheNamespace("stats", 120, undefined); // 2분
  static categories = new CacheNamespace("categories", 900, undefined); // 15분
  static responses = new CacheNamespace("responses", 300, undefined); // 5분

  static init(redis?: Redis) {
    this.redis = redis;

    // 모든 네임스페이스에 Redis 인스턴스 설정
    this.campaigns = new CacheNamespace("campaigns", 300, redis);
    this.users = new CacheNamespace("users", 600, redis);
    this.admin = new CacheNamespace("admin", 180, redis);
    this.stats = new CacheNamespace("stats", 120, redis);
    this.categories = new CacheNamespace("categories", 900, redis);
    this.responses = new CacheNamespace("responses", 300, redis);
  }

  /**
   * 캠페인 관련 캐시 헬퍼
   */
  static async getCampaignList(filters: any, pagination: any): Promise<any> {
    const key = this.generateCampaignKey(filters, pagination);
    return this.campaigns.get(key);
  }

  static async setCampaignList(
    filters: any,
    pagination: any,
    data: any,
  ): Promise<void> {
    const key = this.generateCampaignKey(filters, pagination);
    await this.campaigns.set(key, data);
  }

  static async getCampaignDetail(campaignId: string): Promise<any> {
    return this.campaigns.get(`detail:${campaignId}`);
  }

  static async setCampaignDetail(campaignId: string, data: any): Promise<void> {
    await this.campaigns.set(`detail:${campaignId}`, data, { ttl: 600 });
  }

  /**
   * 관리자 대시보드 캐시
   */
  static async getAdminDashboard(): Promise<any> {
    return this.admin.get("dashboard");
  }

  static async setAdminDashboard(data: any): Promise<void> {
    await this.admin.set("dashboard", data);
  }

  /**
   * 카테고리 통계 캐시
   */
  static async getCategoryStats(): Promise<any> {
    return this.categories.get("stats");
  }

  static async setCategoryStats(data: any): Promise<void> {
    await this.categories.set("stats", data);
  }

  /**
   * 사용자 프로필 캐시
   */
  static async getUserProfile(userId: string): Promise<any> {
    return this.users.get(`profile:${userId}`);
  }

  static async setUserProfile(userId: string, data: any): Promise<void> {
    await this.users.set(`profile:${userId}`, data);
  }

  /**
   * 관계형 캐시 무효화 시스템
   */
  static async invalidateRelated(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    logger.info(`Invalidating related cache for ${entityType}:${entityId}`);

    switch (entityType) {
      case "campaign":
        // 캠페인 관련 모든 캐시 무효화
        await this.campaigns.invalidate(`detail:${entityId}`);
        await this.campaigns.invalidatePattern(`business:*`);
        await this.campaigns.invalidatePattern(`list:*`);
        await this.stats.invalidatePattern("*");
        await this.categories.invalidate("stats");
        break;

      case "user":
        // 사용자 관련 캐시 무효화
        await this.users.invalidate(`profile:${entityId}`);
        // 해당 사용자가 비즈니스인 경우 캠페인 캐시도 무효화
        await this.campaigns.invalidatePattern(`business:${entityId}:*`);
        await this.admin.invalidate("dashboard");
        break;

      case "business_profile":
        // 비즈니스 프로필 변경시 관련 캠페인 캐시 무효화
        await this.users.invalidate(`profile:${entityId}`);
        await this.campaigns.invalidatePattern(`business:${entityId}:*`);
        await this.campaigns.invalidatePattern(`list:*`);
        break;

      case "campaign_application":
        // 지원서 관련 캐시 무효화
        await this.campaigns.invalidatePattern(`detail:*`);
        await this.stats.invalidatePattern("*");
        await this.admin.invalidate("dashboard");
        break;

      default:
        logger.warn(
          `Unknown entity type for cache invalidation: ${entityType}`,
        );
    }
  }

  /**
   * 전체 캐시 무효화 (긴급시 사용)
   */
  static async flushAll(): Promise<void> {
    logger.warn("Flushing all cache namespaces");

    await Promise.all([
      this.campaigns.flush(),
      this.users.flush(),
      this.admin.flush(),
      this.stats.flush(),
      this.categories.flush(),
      this.responses.flush(),
    ]);
  }

  /**
   * 캐시 상태 모니터링
   */
  static async getHealthStatus(): Promise<{
    redis: boolean;
    namespaces: string[];
    totalKeys: number;
  }> {
    try {
      const namespaces = [
        "campaigns",
        "users",
        "admin",
        "stats",
        "categories",
        "responses",
      ];
      const totalKeys = (await this.redis?.dbsize()) || 0;

      return {
        redis: !!this.redis,
        namespaces,
        totalKeys,
      };
    } catch (error) {
      return {
        redis: false,
        namespaces: [],
        totalKeys: 0,
      };
    }
  }

  // 헬퍼 메서드들
  private static generateCampaignKey(filters: any, pagination: any): string {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");

    const pageStr = `page:${pagination.page || 1},limit:${pagination.limit || 20}`;

    return `list:${filterStr}:${pageStr}`;
  }

  /**
   * 캐시 키 빌더 (체이닝 방식)
   */
  static keyBuilder() {
    return new CacheKeyBuilder();
  }
}

class CacheKeyBuilder {
  private parts: string[] = [];

  add(key: string, value?: any): this {
    if (value !== undefined && value !== null) {
      this.parts.push(`${key}:${value}`);
    } else {
      this.parts.push(key);
    }
    return this;
  }

  filter(filters: Record<string, any>): this {
    const filterParts = Object.entries(filters)
      .filter(([_, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`);

    if (filterParts.length > 0) {
      this.parts.push(`filter:${filterParts.join(",")}`);
    }
    return this;
  }

  page(page: number, limit: number): this {
    this.parts.push(`page:${page}:${limit}`);
    return this;
  }

  build(): string {
    return this.parts.join(":");
  }
}

// 기존 캐시 시스템과의 호환성을 위한 어댑터
export class LegacyCacheAdapter {
  /**
   * ResponseCache 호환
   */
  static async get(key: string): Promise<any> {
    return UnifiedCache.responses.get(key);
  }

  static async set(key: string, data: any, ttl: number = 300): Promise<void> {
    await UnifiedCache.responses.set(key, data, { ttl });
  }

  static async invalidate(key: string): Promise<void> {
    await UnifiedCache.responses.invalidate(key);
  }

  /**
   * CampaignCache 호환
   */
  static async getCampaigns(filters: any, pagination: any): Promise<any> {
    return UnifiedCache.getCampaignList(filters, pagination);
  }

  static async setCampaigns(
    filters: any,
    pagination: any,
    data: any,
  ): Promise<void> {
    await UnifiedCache.setCampaignList(filters, pagination, data);
  }

  /**
   * AdminCache 호환
   */
  static async getAdminStats(): Promise<any> {
    return UnifiedCache.getAdminDashboard();
  }

  static async setAdminStats(data: any): Promise<void> {
    await UnifiedCache.setAdminDashboard(data);
  }
}
