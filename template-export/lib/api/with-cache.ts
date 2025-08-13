import { NextRequest, NextResponse } from 'next/server'
import { cacheService, CACHE_TTL } from '@/lib/cache/cache-service'
import { setCacheHeaders } from '@/lib/cache/cache-middleware'

export interface CacheConfig {
  key: string | ((req: NextRequest) => string)
  ttl?: number
  revalidate?: number
  tags?: string[]
}

// API 핸들러에 캐싱 기능을 추가하는 HOF
export function withCache<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 캐시 키 생성
    const cacheKey = typeof config.key === 'function' 
      ? config.key(req) 
      : config.key

    // GET 요청에 대해서만 캐시 확인
    if (req.method === 'GET') {
      const cached = await cacheService.get<T>(cacheKey)
      if (cached) {
        const response = NextResponse.json(cached)
        setCacheHeaders(response, {
          maxAge: 0,
          sMaxAge: config.ttl || CACHE_TTL.MEDIUM,
          staleWhileRevalidate: config.revalidate || 300
        })
        response.headers.set('X-Cache', 'HIT')
        return response
      }
    }

    // 핸들러 실행
    const response = await handler(req)
    
    // 성공 응답인 경우 캐시 저장
    if (response.ok && req.method === 'GET') {
      const data = await response.clone().json()
      await cacheService.set(cacheKey, data, config.ttl || CACHE_TTL.MEDIUM)
      
      // 캐시 헤더 설정
      setCacheHeaders(response, {
        maxAge: 0,
        sMaxAge: config.ttl || CACHE_TTL.MEDIUM,
        staleWhileRevalidate: config.revalidate || 300
      })
      response.headers.set('X-Cache', 'MISS')
    }

    return response
  }
}

// 조건부 캐싱을 위한 래퍼
export function withConditionalCache<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig & {
    condition?: (req: NextRequest) => boolean
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 조건 확인
    if (config.condition && !config.condition(req)) {
      return handler(req)
    }

    return withCache(handler, config)(req)
  }
}

// 사용자별 캐싱을 위한 래퍼
export function withUserCache<T = any>(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Omit<CacheConfig, 'key'> & {
    keyPrefix: string
  }
) {
  return withCache(handler, {
    ...config,
    key: (req: NextRequest) => {
      // Authorization 헤더에서 사용자 정보 추출
      const auth = req.headers.get('authorization')
      const userId = auth ? auth.split(' ')[1].split('.')[0] : 'anonymous'
      return `${config.keyPrefix}:${userId}`
    }
  })
}