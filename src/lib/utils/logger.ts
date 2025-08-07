/**
 * 개발 환경에서만 로깅하는 안전한 로거
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 개발 환경에서만 로그 출력
   */
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },

  /**
   * 개발 환경에서만 에러 로그 출력
   */
  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    }
  },

  /**
   * 개발 환경에서만 경고 로그 출력
   */
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * 개발 환경에서만 디버그 로그 출력
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * 항상 출력되는 중요한 에러 (프로덕션에서도 필요한 경우)
   */
  critical: (...args: any[]) => {
    console.error('[CRITICAL]', ...args);
  },

  /**
   * 항상 출력되는 중요한 정보 (프로덕션에서도 필요한 경우)
   */
  info: (...args: any[]) => {
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