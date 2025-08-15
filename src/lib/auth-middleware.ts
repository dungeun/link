import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getServerSession } from '@/lib/auth-server';
import { getJWTSecret } from '@/lib/auth/constants';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
}

export async function authenticateJWT(request: NextRequest): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload & {
      id: string;
      email: string;
      name: string;
      type: 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
    };
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      type: decoded.type
    };
  } catch (error) {
    return null;
  }
}

export async function authenticateSession(): Promise<AuthUser | null> {
  const session = await getServerSession();
  
  if (!session || !session.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    type: session.user.type
  };
}

export async function requireAuth(
  request: NextRequest,
  allowedTypes?: Array<'ADMIN' | 'BUSINESS' | 'INFLUENCER'>
): Promise<AuthUser | NextResponse> {
  // Try session auth first, then JWT
  let user = await authenticateSession();
  
  if (!user) {
    user = await authenticateJWT(request);
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (allowedTypes && !allowedTypes.includes(user.type)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return user;
}

export function createAuthResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details })
    },
    { status }
  );
}