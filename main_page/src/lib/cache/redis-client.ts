import { redis } from '@/lib/db/redis'

// 기존 redis 클라이언트 재사용
export const getRedisClient = () => {
  return redis
}

// 캐시 키 생성 헬퍼
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]) => {
  return `${prefix}:${parts.join(':')}`
}

// 캐시 TTL 상수
export const CACHE_TTL = {
  SHORT: 60, // 1분
  MEDIUM: 300, // 5분
  LONG: 3600, // 1시간
  DAY: 86400, // 1일
} as const