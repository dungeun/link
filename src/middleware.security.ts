/**
 * 보안 미들웨어
 * 모든 응답에 보안 헤더를 추가합니다.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function addSecurityHeaders(response: NextResponse): NextResponse {
  // 기본 보안 헤더
  const headers = {
    // XSS 보호
    'X-XSS-Protection': '1; mode=block',
    
    // 콘텐츠 타입 스니핑 방지
    'X-Content-Type-Options': 'nosniff',
    
    // 클릭재킹 방지
    'X-Frame-Options': 'SAMEORIGIN',
    
    // HTTPS 강제 (프로덕션에서만)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    }),
    
    // Referrer 정책
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 권한 정책
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  // Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.tosspayments.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.tosspayments.com wss://",
    "frame-src 'self' https://tosspayments.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ];

  // 개발 환경에서는 CSP 완화
  if (process.env.NODE_ENV === 'development') {
    headers['Content-Security-Policy-Report-Only'] = cspDirectives.join('; ');
  } else {
    headers['Content-Security-Policy'] = cspDirectives.join('; ');
  }

  // 헤더 적용
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// API 라우트 전용 보안 헤더
export function addApiSecurityHeaders(response: NextResponse): NextResponse {
  // API는 HTML이 아니므로 일부 헤더만 적용
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  // CORS 설정 (필요시)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ];
  
  // origin 검증 로직 추가 가능
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins[0]);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// 보안 체크 함수
export function securityCheck(request: NextRequest): { allowed: boolean; reason?: string } {
  const url = new URL(request.url);
  
  // 의심스러운 패턴 체크
  const suspiciousPatterns = [
    /\.\.\//,  // 디렉토리 순회
    /<script/i,  // XSS 시도
    /javascript:/i,  // XSS 시도
    /on\w+=/i,  // 이벤트 핸들러 주입
    /union.*select/i,  // SQL 인젝션
    /exec\(/i,  // 코드 실행
    /eval\(/i,  // 코드 평가
  ];
  
  const path = url.pathname + url.search;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(path)) {
      return { 
        allowed: false, 
        reason: `Suspicious pattern detected: ${pattern}` 
      };
    }
  }
  
  // Rate limiting 체크 (간단한 예시)
  // 실제로는 Redis 등을 사용한 정교한 구현 필요
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // TODO: Implement proper rate limiting with Redis
  
  return { allowed: true };
}