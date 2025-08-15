import { Redis } from 'ioredis'
import { redis } from '@/lib/db/redis'

interface RateLimitOptions {
  windowMs: number  // 시간 창 (밀리초)
  max: number       // 최대 요청 수
  skipSuccessfulRequests?: boolean
  keyPrefix?: string
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: Date
  retryAfter?: number
}

class RateLimiter {
  private redis: Redis | null
  private inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map()

  constructor() {
    this.redis = redis
    // 메모리 스토어 정리 (1분마다)
    setInterval(() => this.cleanupMemoryStore(), 60000)
  }

  private cleanupMemoryStore() {
    const now = Date.now()
    for (const [key, value] of this.inMemoryStore.entries()) {
      if (value.resetTime < now) {
        this.inMemoryStore.delete(key)
      }
    }
  }

  async checkLimit(
    identifier: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const {
      windowMs,
      max,
      keyPrefix = 'rate_limit'
    } = options

    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const resetTime = new Date(now + windowMs)

    try {
      if (this.redis) {
        // Redis 사용
        const current = await this.redis.incr(key)
        
        if (current === 1) {
          await this.redis.expire(key, Math.ceil(windowMs / 1000))
        }

        const ttl = await this.redis.ttl(key)
        const actualResetTime = new Date(now + (ttl * 1000))

        if (current > max) {
          return {
            success: false,
            limit: max,
            remaining: 0,
            resetTime: actualResetTime,
            retryAfter: ttl * 1000
          }
        }

        return {
          success: true,
          limit: max,
          remaining: max - current,
          resetTime: actualResetTime
        }
      } else {
        // 메모리 스토어 폴백
        const stored = this.inMemoryStore.get(key)
        
        if (!stored || stored.resetTime < now) {
          this.inMemoryStore.set(key, {
            count: 1,
            resetTime: now + windowMs
          })
          
          return {
            success: true,
            limit: max,
            remaining: max - 1,
            resetTime
          }
        }

        stored.count++
        
        if (stored.count > max) {
          return {
            success: false,
            limit: max,
            remaining: 0,
            resetTime: new Date(stored.resetTime),
            retryAfter: stored.resetTime - now
          }
        }

        return {
          success: true,
          limit: max,
          remaining: max - stored.count,
          resetTime: new Date(stored.resetTime)
        }
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // 에러 시 요청 허용 (fail open)
      return {
        success: true,
        limit: max,
        remaining: max,
        resetTime
      }
    }
  }

  async reset(identifier: string, keyPrefix = 'rate_limit'): Promise<void> {
    const key = `${keyPrefix}:${identifier}`
    
    if (this.redis) {
      await this.redis.del(key)
    } else {
      this.inMemoryStore.delete(key)
    }
  }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter()

// 미들웨어 헬퍼 함수
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15분
    max: 100 // 100 요청
  }
): Promise<RateLimitResult> {
  return rateLimiter.checkLimit(identifier, options)
}

// 로그인 시도 전용 rate limiter
export async function checkLoginRateLimit(
  identifier: string
): Promise<RateLimitResult> {
  // 개발 환경에서는 rate limit 완화
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return rateLimiter.checkLimit(identifier, {
    windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 개발: 1분, 프로덕션: 15분
    max: isDevelopment ? 100 : 5, // 개발: 100회, 프로덕션: 5회 시도
    keyPrefix: 'login_attempt'
  })
}

// 계정 잠금 관리
export class AccountLockManager {
  private static readonly LOCK_DURATION = 30 * 60 * 1000 // 30분
  private static readonly MAX_ATTEMPTS = 5

  static async checkLock(email: string): Promise<boolean> {
    const key = `account_lock:${email}`
    
    if (redis) {
      const locked = await redis.get(key)
      return locked === 'true'
    }
    
    return false
  }

  static async incrementFailedAttempts(email: string): Promise<number> {
    const key = `failed_attempts:${email}`
    
    if (redis) {
      const attempts = await redis.incr(key)
      
      if (attempts === 1) {
        await redis.expire(key, 3600) // 1시간 후 자동 삭제
      }
      
      if (attempts >= this.MAX_ATTEMPTS) {
        await this.lockAccount(email)
      }
      
      return attempts
    }
    
    return 0
  }

  static async lockAccount(email: string): Promise<void> {
    const key = `account_lock:${email}`
    
    if (redis) {
      await redis.set(key, 'true', 'PX', this.LOCK_DURATION)
    }
  }

  static async unlockAccount(email: string): Promise<void> {
    if (redis) {
      await redis.del(`account_lock:${email}`)
      await redis.del(`failed_attempts:${email}`)
    }
  }

  static async resetFailedAttempts(email: string): Promise<void> {
    if (redis) {
      await redis.del(`failed_attempts:${email}`)
    }
  }
}