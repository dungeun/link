import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '@/lib/auth/constants';
import { logger } from '@/lib/utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  type: string;
  iat?: number;
  exp?: number;
}

/**
 * 관리자 API용 공통 인증 함수
 * JWT 토큰 검증
 */
export async function authenticateAdmin(request: NextRequest): Promise<AuthUser | null> {
  // Authorization 헤더에서 토큰 확인
  const authHeader = request.headers.get('authorization');
  let token = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }
  
  // 헤더에 없으면 쿠키에서 확인
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get('auth-token')?.value || cookieStore.get('accessToken')?.value;
    } catch (error) {
      // cookies() 함수가 실패하면 Request 객체에서 직접 쿠키 추출
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        token = cookies['auth-token'] || cookies['accessToken'];
      }
    }
  }

  if (!token) {
    logger.debug('[Admin Auth] No token found');
    logger.debug('[Admin Auth] Headers:', Object.fromEntries(request.headers.entries()));
    return null;
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as AuthUser & { userId?: string };
    logger.debug('[Admin Auth] JWT verified successfully:', { type: decoded.type, email: decoded.email });
    
    // userId 필드가 있으면 id로 변환
    if (decoded.userId && !decoded.id) {
      decoded.id = decoded.userId;
    }
    
    return decoded;
  } catch (error) {
    logger.error('[Admin Auth] JWT verification failed:', error);
    return null;
  }
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  const userType = user.type?.toUpperCase();
  return userType === 'ADMIN';
}

/**
 * 관리자 API 인증 미들웨어
 * 인증 + 관리자 권한 확인을 한 번에 처리
 */
export async function requireAdminAuth(request: NextRequest): Promise<{ user: AuthUser; error?: never } | { user?: never; error: Response }> {
  const user = await authenticateAdmin(request);
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  if (!isAdmin(user)) {
    return {
      error: new Response(
        JSON.stringify({ error: '관리자만 접근할 수 있습니다.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }
  
  return { user };
}