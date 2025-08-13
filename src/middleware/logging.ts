import { NextRequest, NextResponse } from 'next/server';
import { createApiLogger, createPerformanceLogger } from '@/lib/logger';

/**
 * 로깅 미들웨어
 * 모든 API 요청을 로깅하고 성능을 측정합니다.
 */
export async function loggingMiddleware(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  // API 경로만 로깅
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }
  
  // 로그 엔드포인트는 제외 (무한 루프 방지)
  if (request.nextUrl.pathname === '/api/logs') {
    return response;
  }
  
  // 사용자 ID 추출 (JWT 토큰에서)
  const userId = await getUserIdFromRequest(request);
  
  // API 로거 생성
  const apiLogger = createApiLogger(request, userId);
  
  // 성능 로거 생성
  const perfLogger = createPerformanceLogger(
    `${request.method} ${request.nextUrl.pathname}`
  );
  
  // 요청 로깅
  apiLogger.info({
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
    },
  }, 'API request received');
  
  // 응답에 요청 ID 헤더 추가
  const requestId = crypto.randomUUID();
  const headers = new Headers(response.headers);
  headers.set('x-request-id', requestId);
  
  // 응답 상태 로깅
  const status = response.status;
  const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
  
  apiLogger[level]({
    status,
    requestId,
  }, `API response sent with status ${status}`);
  
  // 성능 측정 종료
  perfLogger.end({ status });
  
  return NextResponse.next({
    headers,
  });
}

/**
 * JWT 토큰에서 사용자 ID 추출
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | undefined> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    
    const token = authHeader.substring(7);
    
    // JWT 검증 (jose 라이브러리 사용)
    const { payload } = await import('jose').then(m => 
      m.jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    );
    
    return payload.sub as string;
  } catch {
    return undefined;
  }
}