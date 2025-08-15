/**
 * Production-ready Logger System
 * Console 로그를 대체하는 구조화된 로깅 시스템
 */

import pino from 'pino';
import { config } from '@/lib/config';

// 로그 레벨 정의
export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

// 로그 컨텍스트 타입
interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: string | number | boolean | undefined | null | Record<string, unknown> | unknown[];
}

// Request 타입 정의
interface LogRequest {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
}

// Response 타입 정의
interface LogResponse {
  statusCode?: number;
  getHeaders?: () => Record<string, string | number | string[]>;
  send?: (data: unknown) => void;
}

// Pino 설정
const pinoConfig = {
  level: config.isDevelopment ? 'debug' : 'info',
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
  serializers: {
    error: (err: Error) => ({
      type: err.constructor.name,
      message: err.message,
      stack: config.isDevelopment ? err.stack : undefined,
      ...err,
    }),
    req: (req: LogRequest) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
    }),
    res: (res: LogResponse) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    }),
  },
  // 민감한 정보 필터링
  redact: {
    paths: [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'authorization',
      'cookie',
      'jwt',
      'secret',
      'apiKey',
      'creditCard',
      'ssn',
      '*.password',
      '*.token',
      '*.secret',
      'headers.authorization',
      'headers.cookie',
    ],
    remove: true,
  },
};

// Logger 클래스
class Logger {
  private static instance: Logger;
  private pinoLogger: pino.Logger;
  private context: LogContext = {};

  private constructor() {
    this.pinoLogger = pino(pinoConfig);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // 컨텍스트 설정
  public setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  // 컨텍스트 클리어
  public clearContext(): void {
    this.context = {};
  }

  // Child logger 생성
  public child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.pinoLogger = this.pinoLogger.child(context);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  // 로그 메소드들
  public fatal(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, data);
  }

  public error(message: string, error?: Error | Record<string, unknown>, data?: Record<string, unknown>): void {
    if (error instanceof Error) {
      this.pinoLogger.error({ ...this.context, ...data, error }, message);
    } else {
      this.pinoLogger.error({ ...this.context, ...error, ...data }, message);
    }
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  public info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  public trace(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.TRACE, message, data);
  }

  // 성능 로깅
  public time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration, label });
    };
  }

  // API 요청/응답 로깅
  public api(req: LogRequest, res: LogResponse, duration: number): void {
    const level = res.statusCode && res.statusCode >= 500 ? LogLevel.ERROR 
                : res.statusCode && res.statusCode >= 400 ? LogLevel.WARN 
                : LogLevel.INFO;
    
    this.log(level, `${req.method} ${req.url}`, {
      req,
      res,
      duration,
      type: 'api',
    });
  }

  // 데이터베이스 쿼리 로깅
  public query(query: string, params?: unknown[], duration?: number): void {
    this.debug('Database query', {
      query: config.isDevelopment ? query : query.substring(0, 100),
      params: config.isDevelopment ? params : undefined,
      duration,
      type: 'database',
    });
  }

  // 비즈니스 이벤트 로깅
  public event(eventName: string, data?: Record<string, unknown>): void {
    this.info(`Event: ${eventName}`, {
      ...data,
      type: 'event',
      eventName,
    });
  }

  // Private 메소드
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    const logData = { ...this.context, ...data };
    
    switch (level) {
      case LogLevel.FATAL:
        this.pinoLogger.fatal(logData, message);
        break;
      case LogLevel.ERROR:
        this.pinoLogger.error(logData, message);
        break;
      case LogLevel.WARN:
        this.pinoLogger.warn(logData, message);
        break;
      case LogLevel.INFO:
        this.pinoLogger.info(logData, message);
        break;
      case LogLevel.DEBUG:
        this.pinoLogger.debug(logData, message);
        break;
      case LogLevel.TRACE:
        this.pinoLogger.trace(logData, message);
        break;
    }
  }
}

// 싱글톤 인스턴스 export
export const logger = Logger.getInstance();

// Development 환경에서만 console 메소드 오버라이드
if (config.isProduction) {
  // 프로덕션에서 console 사용 방지
  const noop = () => {};
  console.log = noop;
  console.error = (message: unknown, ...args: unknown[]) => {
    logger.error('Console error called', { message, args });
  };
  console.warn = (message: unknown, ...args: unknown[]) => {
    logger.warn('Console warn called', { message, args });
  };
  console.info = noop;
  console.debug = noop;
}

// Express/Next.js 미들웨어
export const loggerMiddleware = (req: LogRequest & { headers: Record<string, string | string[] | undefined> }, res: LogResponse & { send: (data: unknown) => void }, next: () => void) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Request 로깅
  logger.setContext({
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent'] as string | undefined,
  });
  
  // Response 로깅
  const originalSend = res.send;
  res.send = function (data: unknown) {
    const duration = Date.now() - start;
    logger.api(req, res, duration);
    logger.clearContext();
    originalSend.call(this, data);
  };
  
  next();
};

export default logger;