/**
 * Edge Runtime 호환 로거
 * Next.js 미들웨어에서 사용 가능한 로거
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class EdgeLogger {
  private logLevel: LogLevel = 'info'
  
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  constructor(level?: LogLevel) {
    if (level) {
      this.logLevel = level
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context))
    }
  }

  child(context: LogContext): EdgeLogger {
    // Edge Runtime에서는 간단한 구현
    return this
  }
}

// Edge Runtime용 성능 로거
export function createPerformanceLogger(operation: string) {
  const startTime = Date.now()
  
  return {
    end: (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime
      if (duration > 100) {
        console.log(`[PERF] ${operation} completed in ${duration}ms`, metadata)
      }
    }
  }
}

// Edge Runtime용 API 로거
export function createApiLogger(req: Request, userId?: string) {
  const url = new URL(req.url)
  return new EdgeLogger().child({
    method: req.method,
    path: url.pathname,
    userId,
  })
}

// 보안 이벤트 로거
export function logSecurityEvent(
  event: string,
  details: unknown,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): void {
  const logger = new EdgeLogger()
  const message = `Security event: ${event}`
  
  if (severity === 'critical' || severity === 'high') {
    logger.error(message, { severity, details })
  } else {
    logger.warn(message, { severity, details })
  }
}

// 싱글톤 인스턴스
export const logger = new EdgeLogger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
)

export default logger