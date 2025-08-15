/**
 * 구조화된 로깅 시스템
 * 프로덕션 환경에서 안전하고 효율적인 로깅 제공
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  userId?: string
  requestId?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class StructuredLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
  
  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest) return false
    return this.levels[level] >= this.levels[this.logLevel]
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      } : undefined,
    }
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined
    
    // 민감한 정보 제거
    const sanitized = { ...context }
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      }
    })
    
    return sanitized
  }

  private output(entry: LogEntry): void {
    if (this.isDevelopment) {
      // 개발 환경: 읽기 쉬운 포맷
      const color = this.getColor(entry.level)
      console.log(
        `${color}[${entry.level.toUpperCase()}]${this.reset()} ${entry.timestamp} - ${entry.message}`,
        entry.context ? entry.context : '',
        entry.error ? entry.error : ''
      )
    } else {
      // 프로덕션: JSON 포맷 (로그 수집 시스템용)
      console.log(JSON.stringify(entry))
    }
  }

  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    }
    return colors[level]
  }

  private reset(): string {
    return '\x1b[0m'
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatEntry('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatEntry('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatEntry('warn', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.output(this.formatEntry('error', message, context, error))
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog('fatal')) {
      this.output(this.formatEntry('fatal', message, context, error))
    }
  }

  // 성능 측정용 유틸리티
  startTimer(): () => number {
    const start = Date.now()
    return () => Date.now() - start
  }

  // HTTP 요청 로깅
  logRequest(req: { method: string; url: string; headers?: Record<string, string> }, context?: LogContext): void {
    this.info(`${req.method} ${req.url}`, {
      ...context,
      method: req.method,
      path: req.url,
    })
  }

  // HTTP 응답 로깅
  logResponse(res: { statusCode: number }, duration: number, context?: LogContext): void {
    const level = res.statusCode >= 400 ? 'error' : 'info'
    this[level](`Response ${res.statusCode} (${duration}ms)`, {
      ...context,
      statusCode: res.statusCode,
      duration,
    })
  }

  // 데이터베이스 쿼리 로깅
  logQuery(query: string, duration: number, context?: LogContext): void {
    if (duration > 1000) {
      this.warn(`Slow query detected (${duration}ms)`, {
        ...context,
        query: this.isDevelopment ? query : undefined,
        duration,
      })
    } else {
      this.debug(`Query executed (${duration}ms)`, {
        ...context,
        duration,
      })
    }
  }
}

// 싱글톤 인스턴스
export const logger = new StructuredLogger()

// 기존 console 메서드 대체 (마이그레이션 용이성)
export const replaceConsole = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.log = (message: string, ...args: unknown[]) => logger.info(String(message), { args })
    console.warn = (message: string, ...args: unknown[]) => logger.warn(String(message), { args })
    console.error = (message: string, ...args: unknown[]) => logger.error(String(message), undefined, { args })
  }
}

export default logger