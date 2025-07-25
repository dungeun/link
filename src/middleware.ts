import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWTEdge, getTokenFromHeader } from '@/lib/auth/jwt-edge';

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

  console.log('[Middleware] Request to:', pathname);

  // Public 페이지는 인증 체크 스킵
  if (publicPagePaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return NextResponse.next();
  }

  // Public API는 인증 체크 스킵
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 기타 API 라우트는 각 라우트에서 인증 처리
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
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
        console.error('[Middleware] Invalid token');
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
      console.error('[Middleware] JWT verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};