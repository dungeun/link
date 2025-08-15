import { NextRequest } from 'next/server';
import { JWT_SECRET } from '@/lib/auth/constants';

/**
 * Edge Runtime에서 사용 가능한 JWT 검증 함수
 * middleware.ts에서 사용됩니다
 */

/**
 * 헤더에서 JWT 토큰 추출
 */
export function getTokenFromHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Edge Runtime에서 JWT 검증
 */
export async function verifyJWTEdge<T = unknown>(token: string): Promise<T | null> {
  try {
    // Edge Runtime에서는 jose 라이브러리 사용
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch (error) {
    const { logger } = await import('@/lib/utils/logger');
    logger.error('[JWT Edge] Verification failed:', error);
    return null;
  }
}

/**
 * 토큰에서 사용자 정보 추출 (Edge Runtime용)
 */
export async function getUserFromToken(token: string | null): Promise<{
  id: string;
  email: string;
  type: string;
} | null> {
  if (!token) return null;

  try {
    const payload = await verifyJWTEdge<{
      id: string;
      email: string;
      type: string;
    }>(token);

    return payload;
  } catch {
    return null;
  }
}