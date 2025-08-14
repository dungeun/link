import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getJWTSecret } from '@/lib/auth/constants'
import { logger } from '@/lib/utils/logger'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  console.log('=== LOGIN API START ===')
  
  try {
    // Request body 복제 후 사용
    const requestClone = request.clone();
    const body = await requestClone.json();
    console.log('Parsed request body:', body);
    
    const { email, password } = body
    
    logger.debug('Login attempt for:', email, 'Password length:', password?.length)

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // 데이터베이스에서 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true
      }
    })

    if (!user) {
      logger.debug('User not found for email:', email)
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    logger.debug('User found:', user.email, 'Type:', user.type, 'Status:', user.status)
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    logger.debug('Password validation result:', isValidPassword)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 상태 확인
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '계정이 비활성화되었습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // JWT 토큰 생성
    const jwtSecret = getJWTSecret();
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id, // 호환성을 위해 추가
        email: user.email,
        type: user.type,
        name: user.name
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 응답 생성
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        verified: (user as any).emailVerified,
        profile: user.profile
      },
      token,
      accessToken: token // Add this for backward compatibility with useAuth hook
    })

    // 쿠키 보안 설정 (환경에 따라 적절히 설정)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // 프로덕션에서는 HTTPS 강제
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    };

    response.cookies.set('auth-token', token, cookieOptions);
    response.cookies.set('accessToken', token, cookieOptions); // 호환성 유지

    return response

  } catch (error: any) {
    const { handleApiError } = await import('@/lib/utils/api-error');
    return handleApiError(error, { endpoint: 'login' });
  }
}