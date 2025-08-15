/**
 * 구조화된 로거 유틸리티
 * 개발/프로덕션 환경별 로그 제어
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class StructuredLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';
  
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return this.levels[level] >= this.levels[this.logLevel];
  }

  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context
    };
    
    if (this.isDevelopment) {
      // 개발 환경: 읽기 쉬운 포맷
      const prefix = context?.module ? `[${context.module}]` : '';
      return `${prefix} ${message}`;
    } else {
      // 프로덕션: JSON 포맷
      return JSON.stringify(logData);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, context));
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        metadata: {
          ...context?.metadata,
          errorMessage: error?.message,
          errorStack: this.isDevelopment ? error?.stack : undefined
        }
      };
      console.error(this.format('error', message, errorContext));
    }
  }

  // API 호출 로깅
  api(method: string, url: string, status?: number, duration?: number): void {
    if (this.shouldLog('info')) {
      this.info(`API ${method} ${url}`, {
        module: 'api',
        metadata: { status, duration }
      });
    }
  }

  // 성능 측정
  performance(action: string, duration: number): void {
    if (duration > 1000 && this.shouldLog('warn')) {
      this.warn(`Slow operation: ${action}`, {
        module: 'performance',
        metadata: { duration }
      });
    } else if (this.shouldLog('debug')) {
      this.debug(`Performance: ${action}`, {
        module: 'performance',
        metadata: { duration }
      });
    }
  }
}

// 싱글톤 인스턴스
export const logger = new StructuredLogger();

// 타이머 유틸리티
export class Timer {
  private start: number;
  private action: string;

  constructor(action: string) {
    this.action = action;
    this.start = Date.now();
  }

  end(): void {
    const duration = Date.now() - this.start;
    logger.performance(this.action, duration);
  }
}