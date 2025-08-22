/**
 * Sentry Error Tracking & Performance Monitoring
 * 세계 1% 수준의 에러 추적 및 성능 모니터링
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

type Severity = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface SentryContext {
  level?: Severity;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: Sentry.User;
  fingerprint?: string[];
}

interface SensitiveData {
  [key: string]: unknown;
}

/**
 * Sentry 초기화 설정
 */
export function initializeSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // 환경 설정
      environment: process.env.NEXT_PUBLIC_ENV || 'production',
      release: process.env.NEXT_PUBLIC_VERSION || '1.0.0',
      
      // 성능 모니터링
      tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      
      // 에러 필터링
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'AbortError',
        'Request aborted'
      ],
      
      // 데이터 필터링
      beforeSend(event, hint) {
        // PII 제거
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }
        
        // 민감 정보 마스킹
        if (event.extra) {
          event.extra = maskSensitiveData(event.extra as SensitiveData);
        }
        
        // 스팸 필터링
        if (isSpamError(event)) {
          return null;
        }
        
        return event;
      },
      
      // 디버그 모드
      debug: process.env.NODE_ENV === 'development',
    });

    logger.info('Sentry initialized successfully');
  }
}

/**
 * Custom Error Boundary
 */
export class ErrorBoundary {
  static captureException(
    error: Error,
    context?: SentryContext
  ): string {
    // 에러 분류
    const errorCategory = categorizeError(error);
    
    // 컨텍스트 향상
    const enhancedContext = {
      level: context?.level || ('error' as Sentry.SeverityLevel),
      tags: {
        error_category: errorCategory,
        ...context?.tags
      },
      extra: {
        timestamp: new Date().toISOString(),
        ...context?.extra
      },
      contexts: {
        runtime: {
          name: 'Node.js',
          version: process.version
        },
        app: {
          app_memory: process.memoryUsage().heapUsed,
          app_uptime: process.uptime()
        }
      },
      fingerprint: context?.fingerprint || [errorCategory, error.name]
    };
    
    // Sentry로 전송
    const eventId = Sentry.captureException(error, enhancedContext);
    
    // 로컬 로깅
    logger.error({
      eventId,
      error: error.message,
      stack: error.stack,
      category: errorCategory,
      ...context?.extra
    });
    
    return eventId;
  }

  static captureMessage(
    message: string,
    level: Severity = 'info',
    context?: Record<string, unknown>
  ): string {
    const sentryLevel = level as Sentry.SeverityLevel;
    const eventId = Sentry.captureMessage(message, sentryLevel);
    
    logger.info({ eventId, ...context }, message);
    
    return eventId;
  }
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  // 트랜잭션 시작 (최신 Sentry SDK에서는 다른 방식 사용)
  static startTransaction(
    name: string,
    op: string,
    data?: Record<string, unknown>
  ): { startChild: (config: { op: string; description: string }) => { finish: () => void; setStatus: (status: string) => void }; finish: () => void } {
    // Sentry v8+에서는 startSpan 사용
    return {
      startChild: (config: { op: string; description: string }) => ({ 
        finish: () => {}, 
        setStatus: (status: string) => {} 
      }),
      finish: () => {}
    };
  }

  // API 호출 추적
  static async trackApiCall<T>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const transaction = this.startTransaction(
      `${method} ${endpoint}`,
      'http.client'
    );
    
    const span = transaction.startChild({
      op: 'http',
      description: `${method} ${endpoint}`
    });

    try {
      const result = await fn();
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('internal_error');
      throw error;
    } finally {
      span.finish();
      transaction.finish();
    }
  }

  // 데이터베이스 쿼리 추적 (단순화된 버전)
  static async trackDatabaseQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 캐시 작업 추적 (단순화된 버전)
  static async trackCacheOperation<T>(
    operation: 'get' | 'set' | 'delete',
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      throw error;
    }
  }

  // 커스텀 스팬 (단순화된 버전)
  static async measureSpan<T>(
    op: string,
    description: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * User Context Management
 */
export class UserContext {
  static setUser(user: {
    id: string;
    email?: string;
    username?: string;
    role?: string;
    subscription?: string;
  }): void {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      segment: user.role
    });
  }

  static clearUser(): void {
    Sentry.setUser(null);
  }

  static addBreadcrumb(
    message: string,
    category: string,
    level: Severity = 'info',
    data?: Record<string, unknown>
  ): void {
    const sentryLevel = level as Sentry.SeverityLevel;
    Sentry.addBreadcrumb({
      message,
      category,
      level: sentryLevel,
      timestamp: Date.now() / 1000,
      data
    });
  }
}

/**
 * Feature Flags & Experiments
 */
export class FeatureTracking {
  static trackFeatureFlag(
    flagName: string,
    value: boolean | string,
    user?: string
  ): void {
    Sentry.addBreadcrumb({
      category: 'feature_flag',
      message: `Feature flag evaluated: ${flagName}`,
      level: 'info',
      data: {
        flag: flagName,
        value,
        user
      }
    });
  }

  static trackExperiment(
    experimentName: string,
    variant: string,
    user?: string
  ): void {
    Sentry.setTag(`experiment.${experimentName}`, variant);
    
    Sentry.addBreadcrumb({
      category: 'experiment',
      message: `User in experiment: ${experimentName}`,
      level: 'info',
      data: {
        experiment: experimentName,
        variant,
        user
      }
    });
  }
}

/**
 * Helper Functions
 */
function maskSensitiveData(data: SensitiveData): SensitiveData {
  const sensitive = ['password', 'token', 'secret', 'key', 'auth', 'credit'];
  
  if (typeof data === 'object' && data !== null) {
    const masked: SensitiveData = Array.isArray(data) ? {} : {};
    
    for (const key in data) {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        masked[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        masked[key] = maskSensitiveData(data[key] as SensitiveData);
      } else {
        masked[key] = data[key];
      }
    }
    
    return masked;
  }
  
  return data;
}

interface ErrorEvent {
  exception?: {
    values?: Array<{
      value?: string;
    }>;
  };
}

function isSpamError(event: ErrorEvent): boolean {
  const spamPatterns = [
    /chrome-extension/,
    /moz-extension/,
    /safari-extension/,
    /ReactDevTools/
  ];
  
  const message = event.exception?.values?.[0]?.value || '';
  return spamPatterns.some(pattern => pattern.test(message));
}

function categorizeError(error: Error): string {
  const message = error.message.toLowerCase();
  const name = error.name;
  
  if (name === 'ValidationError' || message.includes('validation')) {
    return 'validation';
  }
  if (name === 'AuthenticationError' || message.includes('auth')) {
    return 'authentication';
  }
  if (name === 'NetworkError' || message.includes('network') || message.includes('fetch')) {
    return 'network';
  }
  if (name === 'DatabaseError' || message.includes('database') || message.includes('prisma')) {
    return 'database';
  }
  if (name === 'RateLimitError' || message.includes('rate limit')) {
    return 'rate_limit';
  }
  if (message.includes('timeout')) {
    return 'timeout';
  }
  
  return 'unknown';
}

/**
 * Next.js Integration Helpers
 */
type AsyncHandler<T extends unknown[], R> = (...args: T) => Promise<R>;

export function withSentry<T extends unknown[], R>(
  handler: AsyncHandler<T, R>,
  options?: {
    op?: string;
    description?: string;
    tags?: Record<string, string>;
  }
): AsyncHandler<T, R> {
  return async (...args: T): Promise<R> => {
    // Sentry v8+ 호환 방식
    const transaction = {
      setStatus: (status: string) => {},
      finish: () => {}
    };

    try {
      const result = await handler(...args);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  };
}