import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTEdge, getTokenFromHeader } from '@/lib/auth/jwt-edge';
import { logger } from '@/lib/utils/logger';
import { addSecurityHeaders, addApiSecurityHeaders, securityCheck } from './middleware.security';

// 인증이 필요없는 public 경로들
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/influencers', // 인플루언서 검색은 공개
  '/api/payments/confirm', // Toss 결제 콜백
  '/api/payments/callback', // 결제 콜백
  '/api/posts', // 커뮤니티 게시글 조회는 공개
  '/api/setup', // 초기 설정 API
  '/api/home', // 홈페이지 데이터 API는 공개
  '/api/ui-config', // UI 설정은 공개
  '/api/campaigns', // 캠페인 목록 조회는 공개
  '/api/home/campaigns',
  '/api/home/content',
  '/api/home/statistics',
  '/api/settings',
];

// 인증이 필요없는 페이지 경로들
const publicPagePaths = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/about',
  '/pricing',
  '/influencers',
  '/campaigns',
  '/community',
  '/terms',
  '/privacy',
  '/contact',
];

// 인증이 필요한 페이지 경로들
const protectedPagePaths = [
  '/admin',
  '/business',
  '/influencer',
  '/campaigns/create',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  logger.debug('[Middleware] Request to:', pathname);

  // 보안 체크
  const securityResult = securityCheck(request);
  if (!securityResult.allowed) {
    logger.warn('[Security] Request blocked:', securityResult.reason);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 응답 준비
  let response = NextResponse.next();

  // Public 페이지는 인증 체크 스킵
  if (publicPagePaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return addSecurityHeaders(response);
  }

  // Public API는 인증 체크 스킵
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return pathname.startsWith('/api/') ? addApiSecurityHeaders(response) : addSecurityHeaders(response);
  }

  // 기타 API 라우트는 각 라우트에서 인증 처리
  if (pathname.startsWith('/api/')) {
    return addApiSecurityHeaders(response);
  }

  // 페이지 라우트 보호
  if (protectedPagePaths.some(path => pathname.startsWith(path))) {
    const token = request.cookies.get('auth-token')?.value || request.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = await verifyJWTEdge<{id: string, email: string, type: string}>(token);
      
      if (!payload) {
        logger.error('[Middleware] Invalid token');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // 역할 기반 접근 제어
      if (pathname.startsWith('/admin') && payload.type !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/business') && payload.type !== 'BUSINESS') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      if (pathname.startsWith('/influencer') && payload.type !== 'INFLUENCER') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
    } catch (error) {
      logger.error('[Middleware] JWT verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 모든 응답에 보안 헤더 추가
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};