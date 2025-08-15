/**
 * 중앙화된 환경 변수 관리
 * 모든 환경 변수를 한 곳에서 관리하고 타입 안전성 제공
 */

interface EnvConfig {
  // App
  NODE_ENV: 'development' | 'production' | 'test'
  NEXT_PUBLIC_APP_URL: string
  NEXT_PUBLIC_API_URL: string
  
  // Database
  DATABASE_URL: string
  DATABASE_CONNECTION_LIMIT: number
  DATABASE_CONNECT_TIMEOUT: number
  DATABASE_POOL_TIMEOUT: number
  DATABASE_IDLE_TIMEOUT: number
  SLOW_QUERY_THRESHOLD: number
  
  // Auth
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  
  // Redis
  REDIS_URL?: string
  REDIS_PASSWORD?: string
  
  // API Keys
  GOOGLE_TRANSLATE_API_KEY?: string
  YOUTUBE_API_KEY?: string
  INSTAGRAM_API_KEY?: string
  TIKTOK_API_KEY?: string
  
  // Storage
  UPLOAD_DIR: string
  MAX_FILE_SIZE: number
  
  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  
  // Performance
  ENABLE_CACHE: boolean
  CACHE_TTL: number
  
  // Security
  RATE_LIMIT_WINDOW: number
  RATE_LIMIT_MAX_REQUESTS: number
  CORS_ORIGINS: string[]
}

class EnvironmentConfig {
  private config: Partial<EnvConfig> = {}
  private validated = false
  
  constructor() {
    this.loadConfig()
    this.validate()
  }
  
  private loadConfig(): void {
    this.config = {
      // App
      NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      
      // Database
      DATABASE_URL: process.env.DATABASE_URL || '',
      DATABASE_CONNECTION_LIMIT: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
      DATABASE_CONNECT_TIMEOUT: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10'),
      DATABASE_POOL_TIMEOUT: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
      DATABASE_IDLE_TIMEOUT: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10'),
      SLOW_QUERY_THRESHOLD: parseInt(process.env.SLOW_QUERY_THRESHOLD || '2000'),
      
      // Auth
      JWT_SECRET: process.env.JWT_SECRET || '',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
      
      // Redis
      REDIS_URL: process.env.REDIS_URL,
      REDIS_PASSWORD: process.env.REDIS_PASSWORD,
      
      // API Keys
      GOOGLE_TRANSLATE_API_KEY: process.env.GOOGLE_TRANSLATE_API_KEY,
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
      INSTAGRAM_API_KEY: process.env.INSTAGRAM_API_KEY,
      TIKTOK_API_KEY: process.env.TIKTOK_API_KEY,
      
      // Storage
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
      
      // Logging
      LOG_LEVEL: (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) || 'info',
      
      // Performance
      ENABLE_CACHE: process.env.ENABLE_CACHE === 'true',
      CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600'),
      
      // Security
      RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
      RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    }
  }
  
  private validate(): void {
    const required: (keyof EnvConfig)[] = [
      'DATABASE_URL',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
    ]
    
    const missing = required.filter(key => !this.config[key])
    
    if (missing.length > 0 && this.config.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
    
    this.validated = true
  }
  
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    if (!this.validated) {
      this.validate()
    }
    
    const value = this.config[key]
    
    if (value === undefined) {
      throw new Error(`Environment variable ${key} is not defined`)
    }
    
    return value as EnvConfig[K]
  }
  
  getOptional<K extends keyof EnvConfig>(key: K): EnvConfig[K] | undefined {
    return this.config[key] as EnvConfig[K] | undefined
  }
  
  isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }
  
  isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }
  
  isTest(): boolean {
    return this.config.NODE_ENV === 'test'
  }
  
  getAllConfig(): Partial<EnvConfig> {
    // 민감한 정보 제외
    const { 
      JWT_SECRET,
      NEXTAUTH_SECRET,
      DATABASE_URL,
      REDIS_PASSWORD,
      GOOGLE_TRANSLATE_API_KEY,
      YOUTUBE_API_KEY,
      INSTAGRAM_API_KEY,
      TIKTOK_API_KEY,
      ...safeConfig 
    } = this.config
    
    return safeConfig
  }
}

// 싱글톤 인스턴스
export const env = new EnvironmentConfig()

// 타입 내보내기
export type { EnvConfig }

export default env