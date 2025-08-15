import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import * as bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getJWTSecret } from '@/lib/auth/constants'
import { logger } from '@/lib/utils/logger'
import { checkLoginRateLimit, AccountLockManager } from '@/lib/rate-limiter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// 입력 검증 스키마
const loginSchema = z.object({
  email: z.string().email('유효한 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다')
})

// 민감한 정보를 제거한 안전한 로깅
function sanitizeForLogging(data: unknown) {
  const sanitized = { ...data }
  if (sanitized.password) {
    sanitized.password = '[REDACTED]'
  }
  if (sanitized.token) {
    sanitized.token = sanitized.token.substring(0, 10) + '...'
  }
  return sanitized
}

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
  
  try {
    // 1. Rate limiting 체크
    const rateLimitResult = await checkLoginRateLimit(clientIp)
    if (!rateLimitResult.success) {
      logger.warn({ 
        ip: clientIp, 
        remaining: rateLimitResult.remaining 
      }, 'Login rate limit exceeded')
      
      return NextResponse.json(
        { 
          error: '너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.retryAfter! / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
          }
        }
      )
    }

    // 2. Request body 파싱 및 검증
    const body = await request.json()
    
    // 입력 검증
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '입력 데이터가 올바르지 않습니다',
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // 3. 계정 잠금 확인
    const isLocked = await AccountLockManager.checkLock(email)
    if (isLocked) {
      logger.warn({ email: email }, 'Login attempt on locked account')
      return NextResponse.json(
        { 
          error: '계정이 일시적으로 잠겼습니다. 30분 후에 다시 시도해주세요.' 
        },
        { status: 423 } // Locked
      )
    }

    // 4. 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    })

    if (!user) {
      // 계정이 없어도 실패 횟수 증가 (이메일 열거 공격 방지)
      await AccountLockManager.incrementFailedAttempts(email)
      
      logger.info({ email }, 'Login failed - user not found')
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 5. 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      // 실패 횟수 증가
      const attempts = await AccountLockManager.incrementFailedAttempts(email)
      
      logger.info({ 
        email, 
        attempts,
        ip: clientIp 
      }, 'Login failed - invalid password')
      
      return NextResponse.json(
        { 
          error: '이메일 또는 비밀번호가 올바르지 않습니다.',
          remainingAttempts: Math.max(0, 5 - attempts)
        },
        { status: 401 }
      )
    }

    // 6. 계정 상태 확인
    if (user.status !== 'ACTIVE') {
      logger.info({ email, status: user.status }, 'Login failed - inactive account')
      return NextResponse.json(
        { error: '계정이 비활성화되었습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 7. 로그인 성공 - 실패 횟수 초기화
    await AccountLockManager.resetFailedAttempts(email)

    // 8. 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // 9. JWT 토큰 생성
    const jwtSecret = getJWTSecret()
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        type: user.type,
        name: user.name
      },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // 10. 리프레시 토큰 생성 (선택적)
    const refreshToken = jwt.sign(
      { 
        id: user.id,
        type: 'refresh' 
      },
      jwtSecret,
      { expiresIn: '30d' }
    )

    // 11. 로그인 성공 로깅 (민감 정보 제외)
    logger.info({ 
      userId: user.id,
      email: user.email,
      type: user.type,
      ip: clientIp
    }, 'Login successful')

    // 12. 쿠키 설정
    const cookieStore = cookies()
    
    // HttpOnly, Secure, SameSite 쿠키 설정
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/'
    })

    cookieStore.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/'
    })

    // 13. 응답 생성
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        verified: user.verified || false,
        profile: user.profile
      },
      token,
      accessToken: token
    })

    return response

  } catch (error) {
    // 개발 환경에서 더 자세한 에러 정보 제공
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
    
    logger.error({ 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      ip: clientIp 
    }, 'Login error')
    
    // 개발 환경에서는 더 자세한 에러 메시지 반환
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: '로그인 처리 중 오류가 발생했습니다.',
          details: errorMessage 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}