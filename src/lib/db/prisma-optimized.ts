/**
 * 최적화된 Prisma 데이터베이스 클라이언트
 * 연결 풀 최적화 및 성능 개선
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { config } from '@/lib/config'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 연결 풀 설정
const CONNECTION_POOL_CONFIG = {
  // 최대 연결 수
  connection_limit: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '10'),
  // 연결 타임아웃 (초)
  connect_timeout: parseInt(process.env.DATABASE_CONNECT_TIMEOUT || '10'),
  // 쿼리 타임아웃 (밀리초)
  pool_timeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '10000'),
  // 유휴 연결 타임아웃 (초)
  idle_in_transaction_session_timeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '10'),
  // 쿼리 로그 느린 쿼리 임계값 (밀리초)
  slow_query_threshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '2000')
}

// URL에 연결 풀 파라미터 추가
function getOptimizedDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }
  
  const url = new URL(baseUrl)
  
  // 연결 풀 파라미터 설정
  url.searchParams.set('connection_limit', String(CONNECTION_POOL_CONFIG.connection_limit))
  url.searchParams.set('connect_timeout', String(CONNECTION_POOL_CONFIG.connect_timeout))
  url.searchParams.set('pool_timeout', String(CONNECTION_POOL_CONFIG.pool_timeout))
  url.searchParams.set('idle_in_transaction_session_timeout', String(CONNECTION_POOL_CONFIG.idle_in_transaction_session_timeout))
  
  // pgbouncer 사용 시 추가 설정
  if (url.searchParams.get('pgbouncer') === 'true') {
    url.searchParams.set('pgbouncer', 'true')
    url.searchParams.set('statement_cache_size', '0') // pgbouncer와 호환성
  }
  
  return url.toString()
}

// Prisma 로그 레벨 설정
function getPrismaLogLevel(): Prisma.LogLevel[] {
  if (config.isDevelopment) {
    return ['warn', 'error']
  }
  if (config.isTest) {
    return ['error']
  }
  return ['error']
}

// 성능 모니터링 미들웨어
async function performanceMiddleware(params: { model?: string; action?: string }, next: (params: unknown) => Promise<unknown>) {
  const start = Date.now()
  const result = await next(params)
  const duration = Date.now() - start
  
  // 느린 쿼리 로깅
  if (duration > CONNECTION_POOL_CONFIG.slow_query_threshold) {
    console.warn(`[SLOW QUERY] ${params.model}.${params.action} took ${duration}ms`)
  }
  
  return result
}

// Prisma 클라이언트 생성 함수
function createPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: getOptimizedDatabaseUrl()
      }
    },
    log: getPrismaLogLevel().map(level => ({
      level,
      emit: 'event'
    })),
    errorFormat: config.isDevelopment ? 'pretty' : 'minimal'
  })
  
  // 성능 미들웨어 추가
  client.$use(performanceMiddleware)
  
  // 쿼리 최적화 미들웨어
  client.$use(async (params, next) => {
    // findMany에 대한 기본 제한 설정
    if (params.action === 'findMany' && !params.args?.take) {
      params.args = {
        ...params.args,
        take: 100 // 기본 제한
      }
    }
    
    // 큰 데이터셋에 대한 경고
    if (params.action === 'findMany' && params.args?.take && params.args.take > 1000) {
      console.warn(`[WARNING] Large dataset query: ${params.model}.findMany with take=${params.args.take}`)
    }
    
    return next(params)
  })
  
  // 이벤트 리스너 설정
  // @ts-ignore
  client.$on('warn', (e: Prisma.LogEvent) => {
    console.warn('[Prisma Warning]', e.message)
  })
  
  // @ts-ignore
  client.$on('error', (e: Prisma.LogEvent) => {
    console.error('[Prisma Error]', e.message)
  })
  
  // 연결 관리
  client.$connect()
    .then(() => {
      console.log('[Database] Connected successfully with optimized pool')
      console.log('[Database] Pool config:', CONNECTION_POOL_CONFIG)
    })
    .catch((error) => {
      console.error('[Database] Failed to connect:', error)
      process.exit(1)
    })
  
  // Health check 인터벌 (5분마다)
  setInterval(async () => {
    try {
      await client.$queryRaw`SELECT 1`
    } catch (error) {
      console.error('[Database] Health check failed:', error)
    }
  }, 5 * 60 * 1000)
  
  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Database] Received ${signal}, disconnecting...`)
    await client.$disconnect()
    console.log('[Database] Disconnected')
    process.exit(0)
  }
  
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  
  return client
}

// Prisma 클라이언트 인스턴스
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서 Hot Reload 시 재사용
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// 트랜잭션 헬퍼 함수
export async function withTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  }
): Promise<T> {
  return prisma.$transaction(fn, {
    maxWait: options?.maxWait || 5000, // 최대 대기 시간
    timeout: options?.timeout || 10000, // 트랜잭션 타임아웃
    isolationLevel: options?.isolationLevel || Prisma.TransactionIsolationLevel.ReadCommitted
  })
}

// 읽기 전용 트랜잭션
export async function readOnlyTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return withTransaction(fn, {
    isolationLevel: Prisma.TransactionIsolationLevel.ReadUncommitted
  })
}

// 배치 작업 헬퍼
export async function batchOperation<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await operation(batch)
    
    // 배치 간 짧은 대기 (백프레셔 방지)
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

// 연결 풀 상태 모니터링
export async function getPoolStatus() {
  try {
    const result = await prisma.$queryRaw<Array<{
      state: string
      count: number
    }>>`
      SELECT state, COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
      GROUP BY state
    `
    
    return {
      connections: result,
      poolConfig: CONNECTION_POOL_CONFIG,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('[Database] Failed to get pool status:', error)
    return null
  }
}

// 별칭 exports
export { prisma as db }
export default prisma

// Prisma 타입 재내보내기
export type { Prisma } from '@prisma/client'