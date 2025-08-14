import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { AUTH_CONFIG, AUTH_ERRORS } from './constants';
import { createErrorResponse, createApiError } from '@/lib/utils/api-error';

export interface JWTPayload {
  id: string;
  userId?: string;
  email: string;
  type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  user: JWTPayload | null;
  error?: string;
}

/**
 * 통합 인증 미들웨어
 * Bearer 토큰과 쿠키 인증을 모두 지원
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const cookieStore = cookies();
    
    // 1. Authorization 헤더에서 Bearer 토큰 확인
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // 2. 쿠키에서 토큰 확인
      token = cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value || 
              cookieStore.get('accessToken')?.value;
    }

    if (!token) {
      return { user: null, error: AUTH_ERRORS.MISSING_TOKEN };
    }

    // 3. JWT 토큰 검증
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET) as JWTPayload;
    
    // Handle both id and userId fields for compatibility
    if (!decoded || (!decoded.id && !decoded.userId) || !decoded.type) {
      return { user: null, error: AUTH_ERRORS.INVALID_TOKEN };
    }
    
    // Normalize the user object to always have both id and userId
    if (!decoded.id && decoded.userId) {
      decoded.id = decoded.userId;
    }
    if (!decoded.userId && decoded.id) {
      decoded.userId = decoded.id;
    }

    return { user: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { user: null, error: AUTH_ERRORS.TOKEN_EXPIRED };
    }
    
    return { user: null, error: AUTH_ERRORS.INVALID_TOKEN };
  }
}

/**
 * 권한 검증 미들웨어
 */
export function requireAuth(allowedTypes?: ('ADMIN' | 'BUSINESS' | 'INFLUENCER')[]) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request);
    
    if (!user || error) {
      return createErrorResponse(
        createApiError.unauthorized(error || AUTH_ERRORS.MISSING_TOKEN)
      );
    }

    if (allowedTypes && !allowedTypes.includes(user.type)) {
      return createErrorResponse(
        createApiError.forbidden(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS)
      );
    }

    return { user };
  };
}

/**
 * API 라우트용 인증 헬퍼
 */
export async function withAuth(
  request: NextRequest,
  allowedTypes?: ('ADMIN' | 'BUSINESS' | 'INFLUENCER')[]
): Promise<{
  user: JWTPayload;
  error?: never;
} | {
  user?: never;
  error: NextResponse;
}> {
  const { user, error } = await authenticateRequest(request);
  
  if (!user || error) {
    return {
      error: createErrorResponse(
        createApiError.unauthorized(error || AUTH_ERRORS.MISSING_TOKEN)
      )
    };
  }

  if (allowedTypes && !allowedTypes.includes(user.type)) {
    return {
      error: createErrorResponse(
        createApiError.forbidden(AUTH_ERRORS.INSUFFICIENT_PERMISSIONS)
      )
    };
  }

  return { user };
}