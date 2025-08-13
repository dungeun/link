/**
 * 캐싱 유틸리티
 */

import { NextResponse } from 'next/server';

// 메모리 기반 간단한 캐시 (개발용)
class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();

  set(key: string, data: any, ttlSeconds: number = 300): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    // 만료된 항목 정리
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

// 전역 캐시 인스턴스
const cache = new SimpleCache();

export { cache };

/**
 * 캐시 키 생성 헬퍼
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  static create(): CacheKeyBuilder {
    return new CacheKeyBuilder();
  }

  add(key: string, value?: string | number | boolean): CacheKeyBuilder {
    if (value !== undefined) {
      this.parts.push(`${key}:${value}`);
    } else {
      this.parts.push(key);
    }
    return this;
  }

  user(userId: string): CacheKeyBuilder {
    return this.add('user', userId);
  }

  campaign(campaignId?: string): CacheKeyBuilder {
    return campaignId ? this.add('campaign', campaignId) : this.add('campaigns');
  }

  page(page: number, limit: number): CacheKeyBuilder {
    return this.add('page', page).add('limit', limit);
  }

  filter(filters: Record<string, any>): CacheKeyBuilder {
    const filterString = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join(',');
    
    if (filterString) {
      this.parts.push(`filters:${filterString}`);
    }
    return this;
  }

  build(): string {
    return this.parts.join('|');
  }
}

/**
 * 응답 캐싱 미들웨어
 */
export class ResponseCache {
  /**
   * 캐시된 응답이 있으면 반환, 없으면 함수 실행 후 캐시
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // 캐시된 데이터 확인
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // 데이터 조회 및 캐시 저장
    const data = await fetcher();
    cache.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * NextResponse에 캐시 헤더 추가
   */
  static addCacheHeaders(
    response: NextResponse,
    maxAge: number = 60,
    staleWhileRevalidate: number = 300
  ): NextResponse {
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
    return response;
  }

  /**
   * 캐시 무효화
   */
  static invalidate(pattern: string): void {
    // 간단한 패턴 매칭으로 캐시 무효화
    const keys = Array.from((cache as any).cache.keys());
    keys.forEach((key: string) => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  }

  /**
   * 사용자별 캐시 무효화
   */
  static invalidateUser(userId: string): void {
    this.invalidate(`user:${userId}`);
  }

  /**
   * 캠페인 관련 캐시 무효화
   */
  static invalidateCampaigns(campaignId?: string): void {
    if (campaignId) {
      this.invalidate(`campaign:${campaignId}`);
    }
    this.invalidate('campaigns');
  }
}

/**
 * 데이터베이스 쿼리 캐싱 데코레이터
 */
export function cached(ttlSeconds: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 캐시 키 생성 (함수명 + 인자들)
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      return ResponseCache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        ttlSeconds
      );
    };

    return descriptor;
  };
}

/**
 * 자주 사용되는 캐시 설정들
 */
export const CachePresets = {
  // 짧은 캐시 (1분)
  SHORT: { ttl: 60, swr: 120 },
  
  // 중간 캐시 (5분)
  MEDIUM: { ttl: 300, swr: 600 },
  
  // 긴 캐시 (30분)
  LONG: { ttl: 1800, swr: 3600 },
  
  // 정적 데이터 캐시 (24시간)
  STATIC: { ttl: 86400, swr: 172800 },

  // 사용자 데이터 (짧은 캐시)
  USER_DATA: { ttl: 60, swr: 300 },
  
  // 캠페인 목록 (중간 캐시)
  CAMPAIGN_LIST: { ttl: 300, swr: 600 },
  
  // 캠페인 상세 (짧은 캐시)
  CAMPAIGN_DETAIL: { ttl: 180, swr: 360 },
  
  // 통계 데이터 (긴 캐시)
  STATISTICS: { ttl: 900, swr: 1800 }
};

/**
 * 캐시 통계 및 모니터링
 */
export class CacheStats {
  private static hits = 0;
  private static misses = 0;

  static hit(): void {
    this.hits++;
  }

  static miss(): void {
    this.misses++;
  }

  static getStats(): {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size: cache.size()
    };
  }

  static reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// 캐시 히트/미스 추적을 위한 프록시
const originalGet = cache.get.bind(cache);
cache.get = function(key: string) {
  const result = originalGet(key);
  if (result !== null) {
    CacheStats.hit();
  } else {
    CacheStats.miss();
  }
  return result;
};