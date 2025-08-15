import { redis } from '@/lib/db/redis'
import crypto from 'crypto'

interface CacheOptions {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  compress?: boolean // Compress large data
}

interface CachedData<T> {
  data: T
  metadata: {
    createdAt: number
    ttl: number
    tags?: string[]
    compressed?: boolean
  }
}

export class RedisCache {
  private static instance: RedisCache
  private defaultTTL = 3600 // 1 hour
  
  private constructor() {}
  
  static getInstance(): RedisCache {
    if (!RedisCache.instance) {
      RedisCache.instance = new RedisCache()
    }
    return RedisCache.instance
  }
  
  /**
   * 캐시 키 생성
   */
  private generateKey(namespace: string, identifier: unknown): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(identifier))
      .digest('hex')
    return `cache:${namespace}:${hash}`
  }
  
  /**
   * 캐시 가져오기
   */
  async get<T>(namespace: string, identifier: unknown): Promise<T | null> {
    if (!redis) return null
    
    try {
      const key = this.generateKey(namespace, identifier)
      const cached = await redis.get(key)
      
      if (!cached) return null
      
      const parsed: CachedData<T> = JSON.parse(cached)
      
      // TTL 체크
      const now = Date.now()
      const expired = now > (parsed.metadata.createdAt + (parsed.metadata.ttl * 1000))
      
      if (expired) {
        await this.delete(namespace, identifier)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }
  
  /**
   * 캐시 설정
   */
  async set<T>(
    namespace: string,
    identifier: unknown,
    data: T,
    options: CacheOptions = {}
  ): Promise<void> {
    if (!redis) return
    
    try {
      const key = this.generateKey(namespace, identifier)
      const ttl = options.ttl || this.defaultTTL
      
      const cacheData: CachedData<T> = {
        data,
        metadata: {
          createdAt: Date.now(),
          ttl,
          tags: options.tags
        }
      }
      
      await redis.setex(key, ttl, JSON.stringify(cacheData))
      
      // 태그 인덱싱
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await redis.sadd(`cache:tag:${tag}`, key)
          await redis.expire(`cache:tag:${tag}`, ttl)
        }
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }
  
  /**
   * 캐시 삭제
   */
  async delete(namespace: string, identifier: unknown): Promise<void> {
    if (!redis) return
    
    try {
      const key = this.generateKey(namespace, identifier)
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }
  
  /**
   * 태그로 캐시 무효화
   */
  async invalidateByTag(tag: string): Promise<void> {
    if (!redis) return
    
    try {
      const keys = await redis.smembers(`cache:tag:${tag}`)
      
      if (keys.length > 0) {
        await redis.del(...keys)
        await redis.del(`cache:tag:${tag}`)
      }
    } catch (error) {
      console.error('Cache invalidate by tag error:', error)
    }
  }
  
  /**
   * 패턴으로 캐시 무효화
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    if (!redis) return
    
    try {
      const keys = await redis.keys(`cache:${pattern}`)
      
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidate by pattern error:', error)
    }
  }
  
  /**
   * 캐시된 함수 실행
   */
  async cached<T>(
    namespace: string,
    identifier: unknown,
    fn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // 캐시 확인
    const cached = await this.get<T>(namespace, identifier)
    if (cached !== null) {
      return cached
    }
    
    // 함수 실행
    const result = await fn()
    
    // 캐시 저장
    await this.set(namespace, identifier, result, options)
    
    return result
  }
}

// 싱글톤 인스턴스
export const cache = RedisCache.getInstance()

// 캐시 데코레이터
export function Cacheable(namespace: string, options: CacheOptions = {}) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function (...args: unknown[]) {
      const cacheKey = {
        method: propertyKey,
        args
      }
      
      return cache.cached(
        namespace,
        cacheKey,
        () => originalMethod.apply(this, args),
        options
      )
    }
    
    return descriptor
  }
}

// 캐시 미들웨어
export async function cacheMiddleware(
  request: Request,
  handler: () => Promise<Response>,
  options: CacheOptions = {}
): Promise<Response> {
  const url = new URL(request.url)
  const cacheKey = {
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    method: request.method
  }
  
  // GET 요청만 캐시
  if (request.method !== 'GET') {
    return handler()
  }
  
  // 캐시 확인
  const cached = await cache.get<unknown>('api', cacheKey)
  if (cached) {
    return new Response(JSON.stringify(cached), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      }
    })
  }
  
  // 핸들러 실행
  const response = await handler()
  const data = await response.json()
  
  // 성공 응답만 캐시
  if (response.ok) {
    await cache.set('api', cacheKey, data, options)
  }
  
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    }
  })
}

// 캐시 워밍
export class CacheWarmer {
  static async warmPopularData(prisma: unknown): Promise<void> {
    try {
      // 인기 캠페인 캐싱
      const popularCampaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          budget: true,
          category: true
        }
      })
      
      await cache.set('popular', 'campaigns', popularCampaigns, {
        ttl: 3600,
        tags: ['campaigns', 'popular']
      })
      
      // 카테고리 캐싱
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      })
      
      await cache.set('static', 'categories', categories, {
        ttl: 86400, // 24시간
        tags: ['categories']
      })
      
      console.log('Cache warming completed')
    } catch (error) {
      console.error('Cache warming error:', error)
    }
  }
}