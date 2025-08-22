/**
 * Redis 캐시 구현 (성능 최적화용)
 */

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem>();
  private readonly defaultTtl = 2 * 60 * 1000; // 2분으로 단축 (메모리 절약)
  private readonly maxSize = 500; // 최대 캐시 항목 수 감소 (메모리 절약)

  set<T>(key: string, data: T, ttl?: number): void {
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 패턴으로 키 삭제
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // 만료된 항목 정리
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 싱글톤 인스턴스
const memoryCache = new MemoryCache();

// 정기적으로 만료된 항목 정리 (5분마다)
if (typeof window === "undefined") {
  // 서버사이드에서만
  setInterval(
    () => {
      memoryCache.cleanup();
    },
    5 * 60 * 1000,
  );
}

/**
 * 캠페인 전용 캐시 헬퍼
 */
export class CampaignCache {
  private static readonly CACHE_PREFIX = "campaigns:";
  private static readonly TTL = 1 * 60 * 1000; // 1분으로 단축 (더 빠른 데이터 갱신)

  static generateKey(filters: any, pagination: any): string {
    const key = `${this.CACHE_PREFIX}${JSON.stringify({ filters, pagination })}`;
    return Buffer.from(key).toString("base64"); // 안전한 키 생성
  }

  static async get(filters: any, pagination: any) {
    const key = this.generateKey(filters, pagination);
    return memoryCache.get(key);
  }

  static async set(filters: any, pagination: any, data: any) {
    const key = this.generateKey(filters, pagination);
    memoryCache.set(key, data, this.TTL);
  }

  static async invalidate() {
    memoryCache.deletePattern(`${this.CACHE_PREFIX}*`);
  }

  static async invalidateFilters(filterPattern: any) {
    const pattern = `${this.CACHE_PREFIX}*${JSON.stringify(filterPattern)}*`;
    memoryCache.deletePattern(pattern);
  }
}

/**
 * 카테고리 통계 캐시
 */
export class CategoryStatsCache {
  private static readonly CACHE_KEY = "category_stats";
  private static readonly TTL = 10 * 60 * 1000; // 10분

  static async get() {
    return memoryCache.get(this.CACHE_KEY);
  }

  static async set(data: any) {
    memoryCache.set(this.CACHE_KEY, data, this.TTL);
  }

  static async invalidate() {
    memoryCache.delete(this.CACHE_KEY);
  }
}

/**
 * 범용 쿼리 캐시 래퍼
 */
export class QueryCache {
  static async wrap<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = 5 * 60 * 1000,
  ): Promise<T> {
    // 캐시된 데이터 확인
    const cached = memoryCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // 쿼리 실행
    const result = await queryFn();

    // 캐시에 저장
    memoryCache.set(key, result, ttl);

    return result;
  }

  static invalidate(key: string) {
    memoryCache.delete(key);
  }

  static invalidatePattern(pattern: string) {
    memoryCache.deletePattern(pattern);
  }
}

export { memoryCache };
export default memoryCache;
