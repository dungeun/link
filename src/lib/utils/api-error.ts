/**
 * API 에러 처리 표준화
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiError {
  code: string;
  message: string;
  status: number;
  context?: Record<string, unknown>;
}

export class APIError extends Error {
  code: string;
  status: number;
  context?: Record<string, unknown>;

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500, context?: Record<string, unknown>) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.context = context;
  }
}

// 공통 에러 타입들
export const API_ERRORS = {
  // 인증 관련
  UNAUTHORIZED: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.', status: 401 },
  FORBIDDEN: { code: 'FORBIDDEN', message: '권한이 없습니다.', status: 403 },
  INVALID_TOKEN: { code: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다.', status: 401 },
  TOKEN_EXPIRED: { code: 'TOKEN_EXPIRED', message: '토큰이 만료되었습니다.', status: 401 },

  // 요청 관련
  BAD_REQUEST: { code: 'BAD_REQUEST', message: '잘못된 요청입니다.', status: 400 },
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', message: '입력값이 올바르지 않습니다.', status: 400 },
  MISSING_REQUIRED_FIELDS: { code: 'MISSING_REQUIRED_FIELDS', message: '필수 필드가 누락되었습니다.', status: 400 },

  // 리소스 관련
  NOT_FOUND: { code: 'NOT_FOUND', message: '요청한 리소스를 찾을 수 없습니다.', status: 404 },
  ALREADY_EXISTS: { code: 'ALREADY_EXISTS', message: '이미 존재하는 리소스입니다.', status: 409 },

  // 서버 관련
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다.', status: 500 },
  DATABASE_ERROR: { code: 'DATABASE_ERROR', message: '데이터베이스 오류가 발생했습니다.', status: 500 },
  EXTERNAL_SERVICE_ERROR: { code: 'EXTERNAL_SERVICE_ERROR', message: '외부 서비스 오류가 발생했습니다.', status: 502 },
} as const;

/**
 * 표준화된 에러 응답 생성
 */
export function createErrorResponse(
  error: ApiError | APIError | Error | string,
  context?: Record<string, unknown>
): NextResponse {
  let apiError: ApiError;

  if (error instanceof APIError) {
    apiError = {
      code: error.code,
      message: error.message,
      status: error.status,
      context: error.context || context
    };
  } else if (typeof error === 'string') {
    apiError = {
      code: API_ERRORS.INTERNAL_ERROR.code,
      message: error,
      status: API_ERRORS.INTERNAL_ERROR.status,
      context
    };
  } else if (error instanceof Error) {
    apiError = {
      code: API_ERRORS.INTERNAL_ERROR.code,
      message: error.message,
      status: API_ERRORS.INTERNAL_ERROR.status,
      context
    };
  } else {
    apiError = error;
  }

  // 에러 로깅
  logger.error('API Error:', {
    code: apiError.code,
    message: apiError.message,
    status: apiError.status,
    context: apiError.context
  });

  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.context && { context: apiError.context })
      }
    },
    { status: apiError.status }
  );
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  );
}

/**
 * API 에러 생성 헬퍼 함수들
 */
export const createApiError = {
  unauthorized: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.UNAUTHORIZED.message, API_ERRORS.UNAUTHORIZED.code, API_ERRORS.UNAUTHORIZED.status, context),
  
  forbidden: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.FORBIDDEN.message, API_ERRORS.FORBIDDEN.code, API_ERRORS.FORBIDDEN.status, context),
  
  badRequest: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.BAD_REQUEST.message, API_ERRORS.BAD_REQUEST.code, API_ERRORS.BAD_REQUEST.status, context),
  
  validation: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.VALIDATION_ERROR.message, API_ERRORS.VALIDATION_ERROR.code, API_ERRORS.VALIDATION_ERROR.status, context),
  
  notFound: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.NOT_FOUND.message, API_ERRORS.NOT_FOUND.code, API_ERRORS.NOT_FOUND.status, context),
  
  alreadyExists: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.ALREADY_EXISTS.message, API_ERRORS.ALREADY_EXISTS.code, API_ERRORS.ALREADY_EXISTS.status, context),
  
  internal: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.INTERNAL_ERROR.message, API_ERRORS.INTERNAL_ERROR.code, API_ERRORS.INTERNAL_ERROR.status, context),
  
  database: (message?: string, context?: Record<string, unknown>) => 
    new APIError(message || API_ERRORS.DATABASE_ERROR.message, API_ERRORS.DATABASE_ERROR.code, API_ERRORS.DATABASE_ERROR.status, context),
};

/**
 * try-catch 블록을 위한 에러 핸들러
 */
export function handleApiError(error: unknown, context?: Record<string, unknown>): NextResponse {
  if (error instanceof APIError) {
    return createErrorResponse(error);
  }

  if (error instanceof Error) {
    // Prisma 에러 처리
    if (error.name === 'PrismaClientKnownRequestError') {
      return createErrorResponse(createApiError.database(error.message, context));
    }

    // 기타 에러
    return createErrorResponse(createApiError.internal(error.message, context));
  }

  // 알 수 없는 에러
  return createErrorResponse(createApiError.internal('알 수 없는 오류가 발생했습니다.', context));
}