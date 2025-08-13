import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger/production';
import { config } from '@/lib/config';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
}

export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    type: ErrorType,
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.type = type;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    this.name = 'AppError';
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

function filterErrorMessage(error: any): string {
  if (config.isProduction) {
    if (error instanceof AppError) {
      return error.message;
    }
    
    if (error instanceof ZodError) {
      return '입력 데이터가 올바르지 않습니다.';
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return '중복된 데이터가 존재합니다.';
        case 'P2025':
          return '요청한 데이터를 찾을 수 없습니다.';
        case 'P2003':
          return '관련 데이터가 존재하여 삭제할 수 없습니다.';
        default:
          return '데이터베이스 작업 중 오류가 발생했습니다.';
      }
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      return '데이터 검증에 실패했습니다.';
    }
    
    return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
  
  return error.message || '알 수 없는 오류가 발생했습니다.';
}

function determineErrorType(error: any): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }
  
  if (error instanceof ZodError) {
    return ErrorType.VALIDATION;
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return ErrorType.CONFLICT;
      case 'P2025':
        return ErrorType.NOT_FOUND;
      default:
        return ErrorType.DATABASE;
    }
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return ErrorType.VALIDATION;
  }
  
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return ErrorType.AUTHENTICATION;
  }
  
  return ErrorType.INTERNAL;
}

function determineStatusCode(error: any): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  
  const errorType = determineErrorType(error);
  
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 400;
    case ErrorType.AUTHENTICATION:
      return 401;
    case ErrorType.AUTHORIZATION:
      return 403;
    case ErrorType.NOT_FOUND:
      return 404;
    case ErrorType.CONFLICT:
      return 409;
    case ErrorType.RATE_LIMIT:
      return 429;
    case ErrorType.DATABASE:
    case ErrorType.EXTERNAL_SERVICE:
    case ErrorType.INTERNAL:
    default:
      return 500;
  }
}

function getErrorDetails(error: any): any {
  if (config.isProduction) {
    return undefined;
  }
  
  if (error instanceof ZodError) {
    return {
      validation: error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      code: error.code,
      meta: error.meta,
    };
  }
  
  if (error instanceof AppError) {
    return error.details;
  }
  
  return {
    name: error.name,
    stack: error.stack,
  };
}

export function handleError(
  error: any,
  requestId?: string
): NextResponse<ErrorResponse> {
  const errorType = determineErrorType(error);
  const statusCode = determineStatusCode(error);
  
  if (statusCode >= 500) {
    logger.error('Application Error', error, {
      type: errorType,
      statusCode,
      requestId,
    });
  } else {
    logger.warn('Client Error', {
      type: errorType,
      statusCode,
      message: error.message,
      requestId,
    });
  }
  
  const response: ErrorResponse = {
    success: false,
    error: {
      type: errorType,
      message: filterErrorMessage(error),
      code: error instanceof AppError ? error.code : undefined,
      details: getErrorDetails(error),
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
  
  return NextResponse.json(response, { status: statusCode });
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data
    },
    { status }
  );
}

export function wrapAsync<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  }) as T;
}

export function apiHandler<T = any>(
  handler: (req: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (req: Request, context?: any) => {
    const requestId = req.headers.get('x-request-id') || 
                     Math.random().toString(36).substring(7);
    
    try {
      logger.info(`API Request: ${req.method} ${req.url}`, {
        requestId,
        method: req.method,
        url: req.url,
      });
      
      const response = await handler(req, context);
      
      logger.info(`API Response: ${response.status}`, {
        requestId,
        status: response.status,
      });
      
      return response;
    } catch (error) {
      return handleError(error, requestId);
    }
  };
}

export const Errors = {
  validation: (message: string, details?: any) =>
    new AppError(ErrorType.VALIDATION, message, 400, 'VALIDATION_ERROR', details),
  
  unauthorized: (message: string = '인증이 필요합니다.') =>
    new AppError(ErrorType.AUTHENTICATION, message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message: string = '접근 권한이 없습니다.') =>
    new AppError(ErrorType.AUTHORIZATION, message, 403, 'FORBIDDEN'),
  
  notFound: (resource: string = '리소스') =>
    new AppError(ErrorType.NOT_FOUND, `${resource}를 찾을 수 없습니다.`, 404, 'NOT_FOUND'),
  
  conflict: (message: string) =>
    new AppError(ErrorType.CONFLICT, message, 409, 'CONFLICT'),
  
  rateLimit: (message: string = '요청 한도를 초과했습니다.') =>
    new AppError(ErrorType.RATE_LIMIT, message, 429, 'RATE_LIMIT_EXCEEDED'),
  
  internal: (message: string = '서버 오류가 발생했습니다.') =>
    new AppError(ErrorType.INTERNAL, message, 500, 'INTERNAL_ERROR'),
};