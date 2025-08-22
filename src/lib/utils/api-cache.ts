/**
 * API 캐싱 유틸리티 - 중복 호출 방지
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * API 호출 캐싱 및 중복 방지
   */
  async fetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60000, // 기본 1분
  ): Promise<T> {
    // 캐시 확인
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    // 진행 중인 요청 확인 (중복 방지)
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // 새 요청 시작
    const promise = fetcher()
      .then((data) => {
        // 캐시 저장
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        });
        return data;
      })
      .finally(() => {
        // 진행 중 요청 제거
        this.pendingRequests.delete(key);
      });

    // 진행 중 요청으로 등록
    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * 특정 키 캐시 무효화
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 패턴 매칭 캐시 무효화
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 전체 캐시 초기화
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const apiCache = new APICache();

// 5분마다 자동 정리
if (typeof window !== "undefined") {
  setInterval(
    () => {
      apiCache.cleanup();
    },
    5 * 60 * 1000,
  );
}

/**
 * API 호출 래퍼 - 자동 캐싱
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  ttl?: number,
): Promise<T> {
  const cacheKey = `${url}:${JSON.stringify(options?.body || {})}`;

  return apiCache.fetch(
    cacheKey,
    async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    ttl,
  );
}

/**
 * auth/me 전용 캐싱 - 더 긴 TTL
 */
export async function fetchAuthMe(token: string): Promise<any> {
  return apiCache.fetch(
    "auth:me",
    async () => {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    5 * 60 * 1000,
  ); // 5분 캐싱
}

/**
 * public/settings 전용 캐싱 - 매우 긴 TTL
 */
export async function fetchPublicSettings(): Promise<any> {
  return apiCache.fetch(
    "public:settings",
    async () => {
      const response = await fetch("/api/public/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      return response.json();
    },
    30 * 60 * 1000,
  ); // 30분 캐싱
}
