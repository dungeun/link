import { NextRequest, NextResponse } from 'next/server'

// 보안 설정
const SECURITY_CONFIG = {
  // CSP 설정
  contentSecurityPolicy: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://t1.daumcdn.net", "https://ssl.daumcdn.net", "https://cdn.iamport.kr", "https://js.tosspayments.com", "https://postcode.map.daum.net"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "data:", "https:", "blob:"],
    'connect-src': ["'self'", "https://api.github.com", "https:", "https://api.tosspayments.com"],
    'frame-src': ["'self'", "https://www.youtube.com", "https://youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://service.iamport.kr", "https://postcode.map.daum.net"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  },
  
  // CORS 설정 - 환경별로 다르게 설정
  cors: {
    development: ['http://localhost:3000', 'http://localhost:3001'],
    production: ['https://revu-platform.vercel.app', 'https://revu.com']
  }
}

// CSP 헤더 생성
function generateCSP(): string {
  const csp = SECURITY_CONFIG.contentSecurityPolicy
  return Object.entries(csp)
    .map(([key, values]) => {
      if (values.length === 0) return key
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

// 보안 헤더 추가
export async function addSecurityHeaders(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  // 기본 보안 헤더
  const headers = {
    // XSS 방지
    'X-XSS-Protection': '1; mode=block',
    
    // 콘텐츠 타입 스니핑 방지
    'X-Content-Type-Options': 'nosniff',
    
    // 클릭재킹 방지
    'X-Frame-Options': 'DENY',
    
    // HTTPS 강제
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // Referrer 정책
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 권한 정책
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    
    // CSP
    'Content-Security-Policy': generateCSP(),
    
    // DNS Prefetch 제어
    'X-DNS-Prefetch-Control': 'on',
    
    // 다운로드 옵션
    'X-Download-Options': 'noopen',
    
    // 허용된 권한
    'X-Permitted-Cross-Domain-Policies': 'none'
  }

  // 헤더 적용
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// API 전용 보안 헤더
export async function addApiSecurityHeaders(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  const origin = request.headers.get('origin')
  const env = process.env.NODE_ENV || 'development'
  
  // 허용된 origin 목록
  const allowedOrigins = SECURITY_CONFIG.cors[env as keyof typeof SECURITY_CONFIG.cors] || []
  
  // CORS 헤더 설정 - 보안 강화
  if (origin) {
    // origin이 허용 목록에 있는 경우에만 설정
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    } else {
      // 허용되지 않은 origin의 경우 CORS 헤더를 설정하지 않음
      console.warn(`Blocked CORS request from origin: ${origin}`)
    }
  }
  
  // Preflight 요청 처리
  if (request.method === 'OPTIONS') {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With')
    response.headers.set('Access-Control-Max-Age', '86400')
  }
  
  // API 보안 헤더
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

// 고급 보안 체크
interface SecurityCheckResult {
  allowed: boolean
  reason?: string
  action?: 'block' | 'challenge' | 'allow'
}

// IP 기반 rate limiting
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

// 보안 체크 함수
export async function advancedSecurityCheck(request: NextRequest): Promise<SecurityCheckResult> {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname
  
  // 이미지와 정적 파일은 User-Agent 체크 건너뛰기
  const isStaticFile = path.startsWith('/uploads/') || 
                      path.startsWith('/images/') || 
                      path.startsWith('/_next/') ||
                      path.startsWith('/favicon') ||
                      path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff|woff2|ttf)$/i)
  
  // 1. User-Agent 체크 (정적 파일과 내부 서버 요청은 제외)
  const isInternalRequest = request.headers.get('X-Internal-Request') === 'true' || 
                           userAgent === 'HomePage-Sync-Service/1.0.0'
  
  if (!isStaticFile && !isInternalRequest && (!userAgent || userAgent.length < 10)) {
    return { 
      allowed: false, 
      reason: 'Invalid User-Agent',
      action: 'block'
    }
  }
  
  // 정적 파일과 내부 요청은 추가 보안 체크 건너뛰기
  if (isStaticFile || isInternalRequest) {
    return { allowed: true }
  }
  
  // 2. 악성 봇 체크 (개발 환경에서는 curl 허용)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const botPatterns = isDevelopment ? [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /wget/i, /python/i, /java/i  // curl 제외
  ] : [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ]
  
  const isBot = botPatterns.some(pattern => pattern.test(userAgent))
  
  // 알려진 좋은 봇 허용
  const goodBots = [
    /googlebot/i, /bingbot/i, /slackbot/i,
    /twitterbot/i, /facebookexternalhit/i
  ]
  
  const isGoodBot = goodBots.some(pattern => pattern.test(userAgent))
  
  if (isBot && !isGoodBot) {
    return { 
      allowed: false, 
      reason: 'Suspicious bot detected',
      action: 'block'
    }
  }
  
  // 3. SQL Injection 패턴 체크
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
    /(\b(OR|AND)\b\s*\d+\s*=\s*\d+)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bEXEC\b|\bEXECUTE\b)/i
  ]
  
  const url = request.url
  const hasSqlPattern = sqlPatterns.some(pattern => pattern.test(url))
  
  if (hasSqlPattern) {
    return { 
      allowed: false, 
      reason: 'SQL injection attempt detected',
      action: 'block'
    }
  }
  
  // 4. XSS 패턴 체크
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<embed/gi,
    /<object/gi
  ]
  
  const hasXssPattern = xssPatterns.some(pattern => pattern.test(url))
  
  if (hasXssPattern) {
    return { 
      allowed: false, 
      reason: 'XSS attempt detected',
      action: 'block'
    }
  }
  
  // 5. Path Traversal 체크
  const pathTraversalPatterns = [
    /\.\.\//g,
    /\.\.%2F/gi,
    /%2e%2e%2f/gi,
    /\.\.\\/g
  ]
  
  const hasPathTraversal = pathTraversalPatterns.some(pattern => pattern.test(url))
  
  if (hasPathTraversal) {
    return { 
      allowed: false, 
      reason: 'Path traversal attempt detected',
      action: 'block'
    }
  }
  
  // 6. IP 기반 Rate Limiting (간단한 구현)
  const now = Date.now()
  const windowMs = 60000 // 1분
  // 개발 환경에서는 더 관대한 설정
  const maxRequests = process.env.NODE_ENV === 'development' ? 1000 : 100 // 개발: 분당 1000 요청, 프로덕션: 100 요청
  
  const requestData = ipRequestCounts.get(ip)
  
  if (requestData) {
    if (now < requestData.resetTime) {
      requestData.count++
      
      if (requestData.count > maxRequests) {
        return { 
          allowed: false, 
          reason: 'Rate limit exceeded',
          action: 'block'
        }
      }
    } else {
      // 시간 창 리셋
      ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    }
  } else {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs })
  }
  
  // 7. 정기적인 메모리 정리 (1시간마다)
  if (Math.random() < 0.001) { // 0.1% 확률로 실행
    const cutoff = now - 3600000 // 1시간 전
    for (const [key, value] of ipRequestCounts.entries()) {
      if (value.resetTime < cutoff) {
        ipRequestCounts.delete(key)
      }
    }
  }
  
  return { 
    allowed: true,
    action: 'allow'
  }
}

// 보안 이벤트 로깅
export function logSecurityEvent(
  eventType: string, 
  details: unknown, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const event = {
    timestamp: new Date().toISOString(),
    type: eventType,
    severity,
    details,
    // Edge Runtime에서는 해시 생성 제거 (Web Crypto API는 async라서 sync 함수에서 사용 불가)
    hash: `${eventType}-${Date.now()}`
  }
  
  // 프로덕션에서는 보안 로깅 서비스로 전송
  if (process.env.NODE_ENV === 'production') {
    // TODO: 보안 로깅 서비스 구현 (예: Sentry, Datadog)
    console.log('[SECURITY EVENT]', JSON.stringify(event))
  } else {
    console.log('[SECURITY EVENT]', event)
  }
  
  // Critical 이벤트는 즉시 알림
  if (severity === 'critical') {
    // TODO: 알림 서비스 구현 (예: Slack, Email)
    console.error('[CRITICAL SECURITY EVENT]', event)
  }
}