/**
 * 애플리케이션 전역 에러 클래스 정의
 */

// 기본 애플리케이션 에러
export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

// 인증 에러
export class AuthenticationError extends ApplicationError {
  constructor(message: string = "인증이 필요합니다") {
    super(message, 401, true);
  }
}

// 권한 에러
export class AuthorizationError extends ApplicationError {
  constructor(message: string = "권한이 없습니다") {
    super(message, 403, true);
  }
}

// 유효성 검사 에러
export class ValidationError extends ApplicationError {
  public readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, 400, true);
    this.fields = fields;
  }
}

// 리소스 없음 에러
export class NotFoundError extends ApplicationError {
  constructor(resource: string) {
    super(`${resource}을(를) 찾을 수 없습니다`, 404, true);
  }
}

// 충돌 에러
export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

// 비율 제한 에러
export class RateLimitError extends ApplicationError {
  public readonly retryAfter?: number;

  constructor(message: string = "너무 많은 요청입니다", retryAfter?: number) {
    super(message, 429, true);
    this.retryAfter = retryAfter;
  }
}

// 데이터베이스 에러
export class DatabaseError extends ApplicationError {
  constructor(message: string = "데이터베이스 오류가 발생했습니다") {
    super(message, 500, false);
  }
}

// 외부 서비스 에러
export class ExternalServiceError extends ApplicationError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(message, 502, false);
    this.service = service;
  }
}

// 에러 타입 가드
export const isApplicationError = (
  error: unknown,
): error is ApplicationError => {
  return error instanceof ApplicationError;
};

// 에러 응답 생성 헬퍼
export const createErrorResponse = (error: ApplicationError) => {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.name,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      ...(error instanceof ValidationError &&
        error.fields && { fields: error.fields }),
      ...(error instanceof RateLimitError &&
        error.retryAfter && { retryAfter: error.retryAfter }),
    },
  };
};
