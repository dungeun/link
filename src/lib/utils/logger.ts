/**
 * 개발 환경에서만 로깅하는 안전한 로거
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 개발 환경에서만 로그 출력
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },

  /**
   * 개발 환경에서만 에러 로그 출력
   */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * 개발 환경에서만 경고 로그 출력
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * 개발 환경에서만 디버그 로그 출력
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * 항상 출력되는 중요한 에러 (프로덕션에서도 필요한 경우)
   */
  critical: (...args: unknown[]) => {
    console.error('[CRITICAL]', ...args);
  },

  /**
   * 항상 출력되는 중요한 정보 (프로덕션에서도 필요한 경우)
   */
  info: (...args: unknown[]) => {
    console.info('[INFO]', ...args);
  }
};

/**
 * API 요청 로깅 (개발 환경에서만)
 */
export const logApiRequest = (method: string, path: string, userId?: string) => {
  if (isDevelopment) {
    console.log(`[API] ${method} ${path}${userId ? ` (User: ${userId})` : ''}`);
  }
};

/**
 * 에러 로깅 with 스택 트레이스
 */
export const logError = (error: Error | unknown, context?: string) => {
  if (isDevelopment) {
    console.error(`[ERROR]${context ? ` ${context}:` : ''}`, error);
  }
  
  // 프로덕션에서는 중요한 에러만 로깅 (스택 트레이스 제외)
  if (!isDevelopment && error instanceof Error) {
    console.error('[PROD_ERROR]', error.message);
  }
};

/**
 * 성능 모니터링 유틸리티
 */
export const performance = {
  /**
   * 함수 실행 시간 측정
   */
  measure: (label: string) => {
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        logger.debug(`Performance [${label}]: ${duration}ms`);
        return duration;
      }
    };
  },

  /**
   * API 응답 시간 측정
   */
  measureApi: (endpoint: string) => {
    const start = Date.now();
    return {
      end: (success: boolean = true) => {
        const duration = Date.now() - start;
        const status = success ? 'SUCCESS' : 'FAILED';
        logger.debug(`API [${endpoint}] ${status}: ${duration}ms`);
        
        // 느린 API 호출 경고 (개발 환경에서만)
        if (isDevelopment && duration > 3000) {
          logger.warn(`Slow API detected: ${endpoint} took ${duration}ms`);
        }
        
        return duration;
      }
    };
  }
};