import { getRedisClient, generateCacheKey, CACHE_TTL } from './redis-client'

export interface CacheOptions {
  ttl?: number
  prefix?: string
}

class CacheService {
  private redis = getRedisClient()

  // 캐시 가져오기
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const data = await this.redis.get(key)
      if (!data) return null

      return JSON.parse(data) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  // 캐시 설정
  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    if (!this.redis) return false

    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttl, serialized)
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }

  // 캐시 삭제
  async delete(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }

  // 패턴으로 캐시 삭제
  async deletePattern(pattern: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache delete pattern error:', error)
      return false
    }
  }

  // 캐시 무효화 헬퍼
  async invalidate(...keys: string[]): Promise<void> {
    if (!this.redis) return

    try {
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate error:', error)
    }
  }

  // 캐시 또는 데이터 가져오기
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    // 캐시에서 먼저 확인
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 캐시에 없으면 데이터 가져오기
    const data = await fetcher()
    
    // 캐시에 저장
    await this.set(key, data, ttl)
    
    return data
  }

  // 특정 엔티티의 모든 캐시 무효화
  async invalidateEntity(entity: string, id: string): Promise<void> {
    const pattern = `${entity}:${id}:*`
    await this.deletePattern(pattern)
  }

  // 태그 기반 캐시 무효화
  async invalidateByTags(...tags: string[]): Promise<void> {
    if (!this.redis || tags.length === 0) return

    try {
      for (const tag of tags) {
        const pattern = `*:tag:${tag}:*`
        await this.deletePattern(pattern)
      }
    } catch (error) {
      console.error('Cache invalidate by tags error:', error)
    }
  }
}

export const cacheService = new CacheService()

// CACHE_TTL을 re-export
export { CACHE_TTL } from './redis-client'

// 캐시 키 생성 유틸리티
export const cacheKeys = {
  // 사용자 관련
  user: (id: string) => generateCacheKey('user', id),
  userProfile: (id: string) => generateCacheKey('user', id, 'profile'),
  userStats: (id: string) => generateCacheKey('user', id, 'stats'),
  
  // 캠페인 관련
  campaign: (id: string) => generateCacheKey('campaign', id),
  campaignList: (page: number, limit: number, filter?: string) => 
    generateCacheKey('campaigns', 'list', page, limit, filter || 'all'),
  campaignStats: (id: string) => generateCacheKey('campaign', id, 'stats'),
  
  // 홈페이지 데이터
  homeStats: () => generateCacheKey('home', 'statistics'),
  homeCampaigns: (filter: string) => generateCacheKey('home', 'campaigns', filter),
  homeContent: () => generateCacheKey('home', 'content'),
  
  // 분석 데이터
  analytics: (period: string) => generateCacheKey('analytics', period),
  
  // UI 설정
  uiConfig: () => generateCacheKey('ui', 'config'),
}