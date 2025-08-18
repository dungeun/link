import { NextResponse } from 'next/server'
import { ApplicationError, isApplicationError, createErrorResponse } from '@/lib/errors/application-errors'
import { logger } from '@/lib/logger'

/**
 * 표준화된 API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode?: number
    timestamp?: Date
    fields?: Record<string, string>
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  meta?: ApiResponse['meta'],
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta })
    },
    { status: statusCode }
  )
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  error: unknown,
  fallbackMessage: string = '서버 오류가 발생했습니다'
): NextResponse<ApiResponse> {
  // ApplicationError 인스턴스인 경우
  if (isApplicationError(error)) {
    logger.error(`Application error: ${error.name}`, error.message, {
      statusCode: error.statusCode,
      stack: error.stack
    })

    return NextResponse.json(
      createErrorResponse(error),
      { status: error.statusCode }
    )
  }

  // 일반 Error 인스턴스인 경우
  if (error instanceof Error) {
    logger.error('Unhandled error:', error.message, {
      stack: error.stack
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          message: process.env.NODE_ENV === 'production' 
            ? fallbackMessage 
            : error.message,
          code: 'INTERNAL_ERROR',
          statusCode: 500,
          timestamp: new Date()
        }
      },
      { status: 500 }
    )
  }

  // 알 수 없는 에러
  logger.error('Unknown error:', String(error))
  
  return NextResponse.json(
    {
      success: false,
      error: {
        message: fallbackMessage,
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
        timestamp: new Date()
      }
    },
    { status: 500 }
  )
}

/**
 * 페이지네이션 메타 정보 생성
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * API 핸들러 래퍼 - 에러 처리 자동화
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<ApiResponse<R>>>
) {
  return async (...args: T): Promise<NextResponse<ApiResponse<R>>> => {
    try {
      return await handler(...args)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

/**
 * 비동기 API 핸들러 래퍼 - try-catch 자동화
 */
export async function handleApiRequest<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string
    errorMessage?: string
    statusCode?: number
  }
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const result = await operation()
    return successResponse(result, undefined, options?.statusCode)
  } catch (error) {
    return errorResponse(error, options?.errorMessage)
  }
}