/**
 * 프로덕션용 로깅 시스템
 * console.log 대체 및 구조화된 로그 관리
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, unknown>
  error?: Error
}

class Logger {
  private logLevel: LogLevel
  private isProduction: boolean

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production'
    this.logLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = entry.timestamp
    const level = LogLevel[entry.level]
    const context = entry.context ? `[${entry.context}]` : ''
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : ''
    
    return `${timestamp} ${level} ${context} ${entry.message} ${metadata}`.trim()
  }

  private log(level: LogLevel, message: string, context?: string, metadata?: unknown) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: typeof metadata === 'object' ? metadata : { data: metadata }
    }

    // 개발환경: console 출력
    if (!this.isProduction) {
      const formatted = this.formatLog(entry)
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formatted)
          break
        case LogLevel.INFO:
          console.info(formatted)
          break
        case LogLevel.WARN:
          console.warn(formatted)
          break
        case LogLevel.ERROR:
          console.error(formatted)
          break
      }
    } else {
      // 프로덕션환경: 구조화된 JSON 로그
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: string, metadata?: unknown) {
    this.log(LogLevel.DEBUG, message, context, metadata)
  }

  info(message: string, context?: string, metadata?: unknown) {
    this.log(LogLevel.INFO, message, context, metadata)
  }

  warn(message: string, context?: string, metadata?: unknown) {
    this.log(LogLevel.WARN, message, context, metadata)
  }

  error(message: string, context?: string, metadata?: unknown) {
    this.log(LogLevel.ERROR, message, context, metadata)
  }

  // 에러 객체와 함께 로깅
  errorWithException(message: string, error: Error, context?: string, metadata?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      metadata,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    if (!this.isProduction) {
      console.error(`${entry.timestamp} ERROR ${context ? `[${context}]` : ''} ${message}`, error)
    } else {
      console.log(JSON.stringify(entry))
    }
  }
}

// 싱글톤 인스턴스
export const logger = new Logger()

// 편의 함수들
export const log = {
  debug: (message: string, context?: string, metadata?: unknown) => logger.debug(message, context, metadata),
  info: (message: string, context?: string, metadata?: unknown) => logger.info(message, context, metadata),
  warn: (message: string, context?: string, metadata?: unknown) => logger.warn(message, context, metadata),
  error: (message: string, context?: string, metadata?: unknown) => logger.error(message, context, metadata),
  exception: (message: string, error: Error, context?: string, metadata?: unknown) => logger.errorWithException(message, error, context, metadata)
}

export default logger