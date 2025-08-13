import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from './cache-service'

// 캐시 무효화가 필요한 엔드포인트 매핑
const INVALIDATION_RULES: Record<string, string[]> = {
  // 캠페인 생성/수정 시 무효화
  '/api/admin/campaigns': ['home:campaigns:*', 'campaigns:list:*', 'home:statistics'],
  '/api/business/campaigns': ['home:campaigns:*', 'campaigns:list:*', 'home:statistics'],
  
  // 사용자 생성/수정 시 무효화
  '/api/auth/register': ['home:statistics'],
  '/api/admin/users': ['home:statistics', 'user:*'],
  
  // UI 설정 변경 시 무효화
  '/api/admin/ui-config': ['ui:config'],
  
  // 결제/정산 관련 무효화
  '/api/payments': ['user:*:stats', 'campaign:*:stats'],
  '/api/settlements': ['user:*:stats'],
}

// 캐시 무효화 미들웨어
export async function invalidateCache(request: NextRequest, response: NextResponse) {
  const { pathname } = request.nextUrl
  const method = request.method
  
  // POST, PUT, PATCH, DELETE 요청에 대해서만 캐시 무효화
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return
  }
  
  // 경로에 매칭되는 무효화 규칙 찾기
  for (const [pattern, cachePatterns] of Object.entries(INVALIDATION_RULES)) {
    if (pathname.startsWith(pattern)) {
      // 각 캐시 패턴에 대해 무효화 실행
      for (const cachePattern of cachePatterns) {
        await cacheService.deletePattern(cachePattern)
      }
      break
    }
  }
  
  // 특정 엔티티 ID가 있는 경우 처리
  const idMatch = pathname.match(/\/(campaigns|users|posts)\/([^\/]+)/)
  if (idMatch) {
    const [, entity, id] = idMatch
    await cacheService.invalidateEntity(entity, id)
  }
}

// 캐시 헤더 설정 헬퍼
export function setCacheHeaders(response: NextResponse, options?: {
  public?: boolean
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
}) {
  const {
    public: isPublic = true,
    maxAge = 0,
    sMaxAge = 60,
    staleWhileRevalidate = 300
  } = options || {}
  
  const cacheControl = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
    `s-maxage=${sMaxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`
  ].join(', ')
  
  response.headers.set('Cache-Control', cacheControl)
  return response
}