import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/lib/auth/constants';

export interface AuthResult {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    type: string;
  };
  error?: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = req.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 헤더에 토큰이 없으면 쿠키에서 확인
    if (!token) {
      const cookieValue = req.cookies.get('auth-token');
      if (cookieValue) {
        token = cookieValue.value;
      }
    }

    if (!token) {
      return {
        isAuthenticated: false,
        error: 'No token provided'
      };
    }

    // JWT 토큰 검증
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      isAuthenticated: true,
      user: {
        id: decoded.userId || decoded.id,
        email: decoded.email,
        name: decoded.name,
        type: decoded.type || decoded.userType
      }
    };
  } catch (error: any) {
    console.error('Auth verification error:', error.message);
    return {
      isAuthenticated: false,
      error: error.message || 'Invalid token'
    };
  }
}

// 관리자 권한 확인
export async function verifyAdminAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.isAuthenticated) {
    return authResult;
  }
  
  if (authResult.user?.type?.toUpperCase() !== 'ADMIN') {
    return {
      isAuthenticated: false,
      error: 'Admin access required'
    };
  }
  
  return authResult;
}

// 비즈니스 권한 확인
export async function verifyBusinessAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.isAuthenticated) {
    return authResult;
  }
  
  if (authResult.user?.type?.toUpperCase() !== 'BUSINESS') {
    return {
      isAuthenticated: false,
      error: 'Business access required'
    };
  }
  
  return authResult;
}

// 인플루언서 권한 확인
export async function verifyInfluencerAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await verifyAuth(req);
  
  if (!authResult.isAuthenticated) {
    return authResult;
  }
  
  const userType = authResult.user?.type?.toUpperCase();
  if (userType !== 'INFLUENCER' && userType !== 'USER') {
    return {
      isAuthenticated: false,
      error: 'Influencer access required'
    };
  }
  
  return authResult;
}