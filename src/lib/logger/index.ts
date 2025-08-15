import pino from 'pino';
import type { Logger } from 'pino';

// 환경 변수
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// 브라우저 환경 체크
const isBrowser = typeof window !== 'undefined';

// 로그 레벨 설정
const getLogLevel = () => {
  if (isTest) return 'silent';
  if (isDevelopment) return 'debug';
  if (isProduction) return 'warn'; // 프로덕션에서는 warn 이상만
  return process.env.LOG_LEVEL || 'info';
};

// 로그 이벤트 타입
interface LogEvent {
  level: {
    label: string;
    value: number;
  };
  messages: unknown[];
  bindings?: unknown[];
  timestamp: number;
}

// 기본 로거 설정
const createLogger = (): Logger => {
  // 브라우저용 로거
  if (isBrowser) {
    return pino({
      level: getLogLevel(),
      browser: {
        transmit: {
          level: 'error',
          send: (level: { label: string; value: number }, logEvent: LogEvent) => {
            // 프로덕션에서만 에러를 서버로 전송
            if (isProduction && level.label === 'error') {
              fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEvent),
              }).catch(console.error);
            }
          },
        },
      },
    });
  }

  // 서버용 로거 - transport 제거 (Next.js와 호환성 문제)
  return pino({
    level: getLogLevel(),
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  });
};

// 싱글톤 로거 인스턴스
export const logger = createLogger();

// 컨텍스트별 로거 생성
export const createContextLogger = (context: Record<string, unknown>) => {
  return logger.child(context);
};

// API 요청 로거
export const createApiLogger = (req: Request, userId?: string) => {
  const url = new URL(req.url);
  return logger.child({
    method: req.method,
    path: url.pathname,
    userId,
    requestId: crypto.randomUUID(),
    userAgent: req.headers.get('user-agent'),
  });
};

// 에러 로거 (스택 트레이스 포함)
export const logError = (
  error: Error | unknown,
  context?: string,
  additionalData?: Record<string, unknown>
) => {
  const errorObj = error instanceof Error
    ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    : { error: String(error) };

  logger.error({
    ...errorObj,
    context,
    ...additionalData,
  });
};

// 성능 로거
export const createPerformanceLogger = (operation: string) => {
  const startTime = Date.now();
  const perfLogger = logger.child({ operation });

  return {
    end: (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      perfLogger.info({
        duration,
        ...metadata,
      }, `Operation ${operation} completed in ${duration}ms`);
    },
  };
};

// 데이터베이스 쿼리 로거
export const logDbQuery = (
  query: string,
  params?: unknown[],
  duration?: number
) => {
  const dbLogger = logger.child({ component: 'database' });
  
  if (isDevelopment) {
    dbLogger.debug({
      query,
      params,
      duration,
    }, 'Database query executed');
  } else if (duration && duration > 1000) {
    // 프로덕션에서는 느린 쿼리만 로깅
    dbLogger.warn({
      query: query.substring(0, 100), // 쿼리 일부만
      duration,
    }, 'Slow query detected');
  }
};

// 사용자 활동 로거
export const logUserActivity = (
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    userId,
    action,
    ...metadata,
    timestamp: new Date().toISOString(),
  }, `User activity: ${action}`);
};

// 보안 이벤트 로거
export const logSecurityEvent = (
  event: string,
  userId?: string,
  metadata?: Record<string, unknown>
) => {
  logger.warn({
    securityEvent: event,
    userId,
    ...metadata,
    timestamp: new Date().toISOString(),
  }, `Security event: ${event}`);
};

// 레거시 console 호환성 (마이그레이션용)
export const legacyLogger = {
  log: (...args: unknown[]) => logger.info(args.map(arg => String(arg)).join(' ')),
  error: (...args: unknown[]) => logger.error(args.map(arg => String(arg)).join(' ')),
  warn: (...args: unknown[]) => logger.warn(args.map(arg => String(arg)).join(' ')),
  debug: (...args: unknown[]) => logger.debug(args.map(arg => String(arg)).join(' ')),
  info: (...args: unknown[]) => logger.info(args.map(arg => String(arg)).join(' ')),
};

// 전역 에러 핸들러는 Next.js에서 자동 처리하므로 제거