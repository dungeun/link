import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/utils/logger'

// 커스텀 에러 클래스
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

// 비즈니스 로직 에러
export class BusinessError extends AppError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, 400, code, details)
    this.name = 'BusinessError'
  }
}

// 인증 에러
export class AuthenticationError extends AppError {
  constructor(message: string = '인증이 필요합니다') {
    super(message, 401, 'AUTHENTICATION_REQUIRED')
    this.name = 'AuthenticationError'
  }
}

// 권한 에러
export class AuthorizationError extends AppError {
  constructor(message: string = '권한이 없습니다') {
    super(message, 403, 'AUTHORIZATION_FAILED')
    this.name = 'AuthorizationError'
  }
}

// 유효성 검증 에러
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

// Not Found 에러
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}을(를) 찾을 수 없습니다`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

// Rate Limit 에러
export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('요청 한도를 초과했습니다', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter })
    this.name = 'RateLimitError'
  }
}

// 에러 응답 포맷
interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: unknown
    timestamp: string
    requestId?: string
  }
}

// 에러 처리 함수
export function handleError(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
  // 요청 ID 생성
  const reqId = requestId || crypto.randomUUID()
  
  // 기본 에러 응답
  let statusCode = 500
  let message = '서버 오류가 발생했습니다'
  let code = 'INTERNAL_SERVER_ERROR'
  let details = undefined
  
  // AppError 처리
  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code || code
    details = error.details
    
    // 4xx 에러는 warn, 5xx 에러는 error로 로깅
    if (statusCode >= 500) {
      logger.error({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          details: error.details
        },
        requestId: reqId
      }, 'Application error')
    } else {
      logger.warn({
        error: {
          name: error.name,
          message: error.message,
          code: error.code,
          details: error.details
        },
        requestId: reqId
      }, 'Client error')
    }
  }
  // Zod 유효성 검증 에러
  else if (error instanceof ZodError) {
    statusCode = 400
    message = '입력 데이터가 올바르지 않습니다'
    code = 'VALIDATION_ERROR'
    details = error.flatten()
    
    logger.warn({
      error: 'Validation error',
      details,
      requestId: reqId
    }, 'Validation failed')
  }
  // Prisma 에러
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint
        statusCode = 409
        message = '이미 존재하는 데이터입니다'
        code = 'DUPLICATE_ENTRY'
        break
      case 'P2025': // Record not found
        statusCode = 404
        message = '데이터를 찾을 수 없습니다'
        code = 'NOT_FOUND'
        break
      case 'P2003': // Foreign key constraint
        statusCode = 400
        message = '참조 데이터가 올바르지 않습니다'
        code = 'INVALID_REFERENCE'
        break
      default:
        message = '데이터베이스 오류가 발생했습니다'
        code = 'DATABASE_ERROR'
    }
    
    logger.error({
      error: {
        code: error.code,
        meta: error.meta,
        message: error.message
      },
      requestId: reqId
    }, 'Prisma error')
  }
  // 일반 Error
  else if (error instanceof Error) {
    // 프로덕션에서는 상세 에러 메시지 숨김
    if (process.env.NODE_ENV === 'production') {
      message = '서버 오류가 발생했습니다'
    } else {
      message = error.message
    }
    
    logger.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      requestId: reqId
    }, 'Unhandled error')
  }
  // 알 수 없는 에러
  else {
    logger.error({
      error,
      requestId: reqId
    }, 'Unknown error')
  }
  
  // 에러 응답 생성
  const errorResponse: ErrorResponse = {
    error: {
      message,
      code,
      details: process.env.NODE_ENV === 'production' ? undefined : details,
      timestamp: new Date().toISOString(),
      requestId: reqId
    }
  }
  
  return NextResponse.json(errorResponse, { 
    status: statusCode,
    headers: {
      'X-Request-Id': reqId
    }
  })
}

// try-catch 래퍼
export async function tryCatch<T>(
  fn: () => Promise<T>,
  requestId?: string
): Promise<NextResponse<T | ErrorResponse>> {
  try {
    const result = await fn()
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, requestId)
  }
}

// 에러 바운더리 미들웨어
export function withErrorHandler(
  handler: (req: Request, params?: unknown) => Promise<Response>
) {
  return async (req: Request, params?: unknown): Promise<Response> => {
    const requestId = crypto.randomUUID()
    
    try {
      // 요청 로깅
      logger.info({
        method: req.method,
        url: req.url,
        requestId
      }, 'API request')
      
      // 핸들러 실행
      const response = await handler(req, params)
      
      // 응답 로깅
      logger.info({
        method: req.method,
        url: req.url,
        status: response.status,
        requestId
      }, 'API response')
      
      // Request ID 헤더 추가
      response.headers.set('X-Request-Id', requestId)
      
      return response
    } catch (error) {
      return handleError(error, requestId)
    }
  }
}

// 비동기 함수 에러 처리 유틸
export function asyncHandler<T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw error
    }
  }) as T
}