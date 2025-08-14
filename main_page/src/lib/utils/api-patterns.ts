/**
 * API 엔드포인트 패턴 및 데코레이터
 * 
 * 공통 API 패턴을 표준화하고 재사용 가능한 데코레이터를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceTimer } from './performance';
import { ResponseCache, CacheKeyBuilder, CachePresets } from './cache';
import { ValidationHelper } from './validation';
import { handleApiError, createSuccessResponse } from './api-error';
import { requireAuth } from '@/lib/auth-middleware';
import { z } from 'zod';

// API 핸들러 옵션
interface ApiHandlerOptions {
  requireAuth?: boolean | string[]; // true for any auth, array for specific roles
  cache?: {
    ttl: number;
    keyBuilder?: (req: NextRequest, params?: any) => string;
  };
  validation?: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
  };
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// API 핸들러 래퍼
export function createApiHandler(
  handler: (req: NextRequest, context: ApiContext) => Promise<NextResponse>,
  options: ApiHandlerOptions = {}
) {
  return async (req: NextRequest, params?: any) => {
    const timer = new PerformanceTimer(`api.${handler.name}`);
    
    try {
      const context: ApiContext = {
        user: null,
        params: params || {},
        validated: {}
      };

      // 1. 인증 확인
      if (options.requireAuth) {
        const authRoles = Array.isArray(options.requireAuth) ? options.requireAuth : undefined;
        const authResult = await requireAuth(req, authRoles);
        
        if (authResult instanceof NextResponse) {
          return authResult;
        }
        
        context.user = authResult;
      }

      // 2. 입력 유효성 검사
      if (options.validation) {
        const validationResults = await validateApiInputs(req, params, options.validation);
        if (validationResults.error) {
          return validationResults.error;
        }
        context.validated = validationResults.data;
      }

      // 3. 캐시 확인 (GET 요청만)
      if (req.method === 'GET' && options.cache) {
        const cacheKey = options.cache.keyBuilder 
          ? options.cache.keyBuilder(req, params)
          : generateDefaultCacheKey(req, params);

        const cachedResponse = await ResponseCache.getOrSet(
          cacheKey,
          async () => {
            const response = await handler(req, context);
            return response;
          },
          options.cache.ttl
        );

        if (cachedResponse instanceof NextResponse) {
          timer.end();
          return cachedResponse;
        }
      }

      // 4. 핸들러 실행
      const response = await handler(req, context);
      
      timer.end();
      return response;

    } catch (error) {
      return handleApiError(error, {
        endpoint: handler.name,
        method: req.method,
        userId: context?.user?.id
      });
    }
  };
}

// API 컨텍스트 인터페이스
export interface ApiContext {
  user: any;
  params: Record<string, any>;
  validated: {
    body?: any;
    query?: any;
    params?: any;
  };
}

// 입력 유효성 검사 헬퍼
async function validateApiInputs(
  req: NextRequest,
  params: any,
  validation: NonNullable<ApiHandlerOptions['validation']>
) {
  const results: any = {};
  const errors: string[] = [];

  // Body 유효성 검사
  if (validation.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    try {
      const body = await req.json();
      const bodyValidation = await ValidationHelper.validate(body, validation.body);
      
      if (!bodyValidation.success) {
        errors.push(...ValidationHelper.formatErrorMessages(bodyValidation.errors!));
      } else {
        results.body = bodyValidation.data;
      }
    } catch (e) {
      errors.push('Invalid JSON body');
    }
  }

  // Query 유효성 검사
  if (validation.query) {
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const queryValidation = await ValidationHelper.validate(query, validation.query);
    if (!queryValidation.success) {
      errors.push(...ValidationHelper.formatErrorMessages(queryValidation.errors!));
    } else {
      results.query = queryValidation.data;
    }
  }

  // Params 유효성 검사
  if (validation.params && params) {
    const paramsValidation = await ValidationHelper.validate(params, validation.params);
    if (!paramsValidation.success) {
      errors.push(...ValidationHelper.formatErrorMessages(paramsValidation.errors!));
    } else {
      results.params = paramsValidation.data;
    }
  }

  if (errors.length > 0) {
    return {
      error: NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      ),
      data: null
    };
  }

  return { error: null, data: results };
}

// 기본 캐시 키 생성
function generateDefaultCacheKey(req: NextRequest, params?: any): string {
  const url = new URL(req.url);
  const builder = CacheKeyBuilder.create()
    .add('path', url.pathname);

  // Query parameters 추가
  const queryObj = Object.fromEntries(url.searchParams.entries());
  if (Object.keys(queryObj).length > 0) {
    builder.filter(queryObj);
  }

  // Route parameters 추가
  if (params && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      builder.add(key, String(value));
    });
  }

  return builder.build();
}

// 사전 정의된 API 패턴들
export const ApiPatterns = {
  /**
   * CRUD 리스트 조회 패턴
   */
  list: (handler: (req: NextRequest, context: ApiContext) => Promise<any>) =>
    createApiHandler(
      async (req, context) => {
        const data = await handler(req, context);
        return createSuccessResponse(data);
      },
      {
        cache: {
          ttl: CachePresets.MEDIUM.ttl,
          keyBuilder: (req) => {
            const { searchParams } = new URL(req.url);
            return CacheKeyBuilder.create()
              .add('list')
              .add('path', new URL(req.url).pathname)
              .filter(Object.fromEntries(searchParams.entries()))
              .build();
          }
        }
      }
    ),

  /**
   * 인증이 필요한 리소스 조회 패턴
   */
  protectedGet: (
    handler: (req: NextRequest, context: ApiContext) => Promise<any>,
    roles?: string[]
  ) =>
    createApiHandler(
      async (req, context) => {
        const data = await handler(req, context);
        return createSuccessResponse(data);
      },
      {
        requireAuth: roles || true,
        cache: {
          ttl: CachePresets.SHORT.ttl,
          keyBuilder: (req, params) => {
            return CacheKeyBuilder.create()
              .add('protected')
              .add('path', new URL(req.url).pathname)
              .add('user', req.headers.get('authorization') || 'anonymous')
              .build();
          }
        }
      }
    ),

  /**
   * 리소스 생성 패턴
   */
  create: (
    handler: (req: NextRequest, context: ApiContext) => Promise<any>,
    validation?: z.ZodSchema,
    roles?: string[]
  ) =>
    createApiHandler(
      async (req, context) => {
        const data = await handler(req, context);
        return createSuccessResponse(data, '리소스가 성공적으로 생성되었습니다.', 201);
      },
      {
        requireAuth: roles || true,
        validation: validation ? { body: validation } : undefined
      }
    ),

  /**
   * 리소스 업데이트 패턴
   */
  update: (
    handler: (req: NextRequest, context: ApiContext) => Promise<any>,
    validation?: z.ZodSchema,
    roles?: string[]
  ) =>
    createApiHandler(
      async (req, context) => {
        const data = await handler(req, context);
        
        // 관련 캐시 무효화
        ResponseCache.invalidate(new URL(req.url).pathname);
        
        return createSuccessResponse(data, '리소스가 성공적으로 업데이트되었습니다.');
      },
      {
        requireAuth: roles || true,
        validation: validation ? { body: validation } : undefined
      }
    ),

  /**
   * 리소스 삭제 패턴
   */
  delete: (
    handler: (req: NextRequest, context: ApiContext) => Promise<void>,
    roles?: string[]
  ) =>
    createApiHandler(
      async (req, context) => {
        await handler(req, context);
        
        // 관련 캐시 무효화
        ResponseCache.invalidate(new URL(req.url).pathname);
        
        return createSuccessResponse(null, '리소스가 성공적으로 삭제되었습니다.', 204);
      },
      {
        requireAuth: roles || true
      }
    )
};

// 사용 예시:
/*
// /api/campaigns/route.ts
export const GET = ApiPatterns.list(async (req, context) => {
  const { page, limit } = context.validated.query;
  // ... 캠페인 목록 조회 로직
  return { campaigns, pagination };
});

export const POST = ApiPatterns.create(
  async (req, context) => {
    const campaignData = context.validated.body;
    // ... 캠페인 생성 로직
    return newCampaign;
  },
  campaignCreateSchema,
  ['BUSINESS']
);
*/